from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Any

from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ClusteringResult:
    docs_embedded: int
    clusters_created: int
    noise_count: int


def _fetch_docs(
    engine: Engine, *, subreddit: str, limit: int, min_signal_score: float = 0.0
) -> list[dict[str, Any]]:
    """Fetch high-signal posts and comments for embedding."""
    with engine.begin() as conn:
        # Get posts with their signals (high quality content)
        post_rows = conn.execute(
            text(
                """
                SELECT 
                    p.post_id as content_id,
                    'post' as content_type,
                    COALESCE(p.title,'') || ' ' || COALESCE(p.body,'') AS doc,
                    COALESCE(s.signal_score, 0) as signal_score
                FROM posts p
                LEFT JOIN signals s ON s.content_id = p.post_id AND s.content_type = 'post'
                WHERE p.subreddit = :subreddit
                  AND LENGTH(COALESCE(p.title,'') || COALESCE(p.body,'')) > 50
                  AND COALESCE(s.signal_score, 0) >= :min_signal
                ORDER BY COALESCE(s.signal_score, 0) DESC, p.score DESC NULLS LAST
                LIMIT :limit
                """
            ),
            {"subreddit": subreddit, "limit": limit, "min_signal": min_signal_score},
        ).fetchall()

        # Also get high-signal comments
        comment_rows = conn.execute(
            text(
                """
                SELECT 
                    c.comment_id as content_id,
                    'comment' as content_type,
                    c.body AS doc,
                    COALESCE(s.signal_score, 0) as signal_score
                FROM comments c
                JOIN posts p ON p.post_id = c.post_id
                LEFT JOIN signals s ON s.content_id = c.comment_id AND s.content_type = 'comment'
                WHERE p.subreddit = :subreddit
                  AND LENGTH(c.body) > 100
                  AND COALESCE(s.signal_score, 0) >= :min_signal
                ORDER BY COALESCE(s.signal_score, 0) DESC, c.score DESC NULLS LAST
                LIMIT :limit
                """
            ),
            {"subreddit": subreddit, "limit": limit, "min_signal": min_signal_score},
        ).fetchall()

    docs = []
    for r in post_rows:
        docs.append({"content_type": "post", "content_id": r[0], "doc": r[2], "signal_score": r[3]})
    for r in comment_rows:
        docs.append(
            {"content_type": "comment", "content_id": r[0], "doc": r[2], "signal_score": r[3]}
        )

    # Sort by signal score and take top items
    docs.sort(key=lambda x: x["signal_score"], reverse=True)
    return docs[: limit * 2]  # Return up to 2x limit (posts + comments)


def run_clustering(
    *,
    engine: Engine,
    subreddit: str,
    limit: int = 2000,
    min_topic_size: int = 10,
    min_signal_score: float = 0.3,
    embedding_model: str = "all-MiniLM-L6-v2",
    nr_topics: int | str = "auto",
) -> ClusteringResult:
    """Embed docs and cluster with BERTopic, storing results in Postgres."""
    from bertopic import BERTopic
    from sentence_transformers import SentenceTransformer
    from sklearn.feature_extraction.text import CountVectorizer
    from hdbscan import HDBSCAN
    from umap import UMAP

    docs_data = _fetch_docs(
        engine, subreddit=subreddit, limit=limit, min_signal_score=min_signal_score
    )
    if not docs_data:
        return ClusteringResult(docs_embedded=0, clusters_created=0, noise_count=0)

    docs = [d["doc"] for d in docs_data]
    logger.info(f"Embedding {len(docs)} docs with {embedding_model}")

    # Embedding
    embedder = SentenceTransformer(embedding_model)
    embeddings = embedder.encode(docs, show_progress_bar=True)

    # Custom vectorizer with UK finance stop words removed
    uk_finance_stops = [
        "ve",
        "just",
        "like",
        "know",
        "going",
        "got",
        "think",
        "want",
        "really",
        "would",
        "could",
        "get",
        "one",
        "also",
        "much",
        "way",
        "re",
        "ll",
        "don",
        "didn",
        "doesn",
        "isn",
        "wasn",
        "weren",
        "years",
        "year",
        "months",
        "month",
        "time",
        "money",
        "uk",
    ]
    from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

    custom_stops = list(ENGLISH_STOP_WORDS) + uk_finance_stops

    vectorizer = CountVectorizer(
        stop_words=custom_stops,
        min_df=3,
        max_df=0.7,
        ngram_range=(1, 2),
    )

    # Better UMAP settings for finance text
    umap_model = UMAP(
        n_neighbors=15,
        n_components=5,
        min_dist=0.0,
        metric="cosine",
        random_state=42,
    )

    # HDBSCAN with better settings
    hdbscan_model = HDBSCAN(
        min_cluster_size=min_topic_size,
        min_samples=3,
        metric="euclidean",
        cluster_selection_method="eom",
        prediction_data=True,
    )

    # BERTopic with improved settings
    topic_model = BERTopic(
        embedding_model=embedder,
        umap_model=umap_model,
        hdbscan_model=hdbscan_model,
        vectorizer_model=vectorizer,
        nr_topics=nr_topics,
        verbose=True,
        calculate_probabilities=True,
    )
    topics, probs = topic_model.fit_transform(docs, embeddings)

    # Extract topic info
    topic_info = topic_model.get_topic_info()
    # topic_info columns: Topic, Count, Name, Representation, Representative_Docs

    # Clear old cluster data for this subreddit (simple approach for MVP)
    with engine.begin() as conn:
        # Delete memberships for posts in this subreddit
        conn.execute(
            text(
                """
                DELETE FROM cluster_membership
                WHERE content_type = 'post'
                  AND content_id IN (SELECT post_id FROM posts WHERE subreddit = :subreddit)
                """
            ),
            {"subreddit": subreddit},
        )
        # We'll keep clusters table global but overwrite on each run (MVP)
        conn.execute(text("DELETE FROM clusters"))

    # Insert clusters
    clusters_created = 0
    with engine.begin() as conn:
        for _, row in topic_info.iterrows():
            cluster_id = int(row["Topic"])
            label = str(row.get("Name", f"Topic_{cluster_id}"))
            top_terms = row.get("Representation", [])
            if hasattr(top_terms, "tolist"):
                top_terms = top_terms.tolist()
            rep_docs = row.get("Representative_Docs", [])
            if hasattr(rep_docs, "tolist"):
                rep_docs = rep_docs.tolist()
            doc_count = int(row.get("Count", 0))

            conn.execute(
                text(
                    """
                    INSERT INTO clusters (cluster_id, label, top_terms, representative_docs, doc_count)
                    VALUES (:cluster_id, :label, :top_terms, :representative_docs, :doc_count)
                    ON CONFLICT (cluster_id) DO UPDATE SET
                      label = EXCLUDED.label,
                      top_terms = EXCLUDED.top_terms,
                      representative_docs = EXCLUDED.representative_docs,
                      doc_count = EXCLUDED.doc_count,
                      created_at = now()
                    """
                ),
                {
                    "cluster_id": cluster_id,
                    "label": label,
                    "top_terms": json.dumps(top_terms[:10] if isinstance(top_terms, list) else []),
                    "representative_docs": json.dumps(
                        rep_docs[:3] if isinstance(rep_docs, list) else []
                    ),
                    "doc_count": doc_count,
                },
            )
            clusters_created += 1

    # Insert memberships
    noise_count = 0
    with engine.begin() as conn:
        for i, d in enumerate(docs_data):
            cluster_id = int(topics[i])
            prob = (
                float(probs[i].max())
                if hasattr(probs[i], "max")
                else float(probs[i])
                if probs is not None
                else None
            )
            if cluster_id == -1:
                noise_count += 1
            conn.execute(
                text(
                    """
                    INSERT INTO cluster_membership (content_type, content_id, cluster_id, probability)
                    VALUES (:content_type, :content_id, :cluster_id, :probability)
                    ON CONFLICT (content_type, content_id) DO UPDATE SET
                      cluster_id = EXCLUDED.cluster_id,
                      probability = EXCLUDED.probability,
                      created_at = now()
                    """
                ),
                {
                    "content_type": d["content_type"],
                    "content_id": d["content_id"],
                    "cluster_id": cluster_id,
                    "probability": prob,
                },
            )

    return ClusteringResult(
        docs_embedded=len(docs),
        clusters_created=clusters_created,
        noise_count=noise_count,
    )


def get_cluster_summary(engine: Engine) -> list[dict[str, Any]]:
    """Return cluster summary for display."""
    with engine.begin() as conn:
        rows = conn.execute(
            text(
                """
                SELECT c.cluster_id, c.label, c.top_terms, c.doc_count
                FROM clusters c
                ORDER BY c.doc_count DESC
                """
            )
        ).fetchall()
    return [
        {
            "cluster_id": r[0],
            "label": r[1],
            "top_terms": r[2],
            "doc_count": r[3],
        }
        for r in rows
    ]
