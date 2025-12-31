from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Literal

from sqlalchemy import text
from sqlalchemy.engine import Engine

from ukmppr.llm_signal_scoring import score_text_llm
from ukmppr.signal_scoring import SignalResult, score_text


Scope = Literal["posts", "comments", "both"]
Method = Literal["rules", "llm", "hybrid"]


@dataclass(frozen=True)
class ScoreSignalsResult:
    posts_scored: int
    comments_scored: int


@dataclass(frozen=True)
class TopSignalRow:
    signal_score: float
    content_type: str
    content_id: str
    post_id: str
    permalink: str | None
    post_title: str | None


def _upsert_signal(
    *,
    conn,
    content_type: str,
    content_id: str,
    post_id: str,
    result: SignalResult,
) -> None:
    conn.execute(
        text(
            """
            INSERT INTO signals (
              content_type, content_id, post_id,
              is_question, asks_recommendation, mentions_cost, mentions_platform,
              signal_score, detected_keywords
            )
            VALUES (
              :content_type, :content_id, :post_id,
              :is_question, :asks_recommendation, :mentions_cost, :mentions_platform,
                            :signal_score, CAST(:detected_keywords AS jsonb)
            )
            ON CONFLICT (content_type, content_id) DO UPDATE SET
              is_question=EXCLUDED.is_question,
              asks_recommendation=EXCLUDED.asks_recommendation,
              mentions_cost=EXCLUDED.mentions_cost,
              mentions_platform=EXCLUDED.mentions_platform,
              signal_score=EXCLUDED.signal_score,
              detected_keywords=EXCLUDED.detected_keywords,
              collected_at=now()
            """
        ),
        {
            "content_type": content_type,
            "content_id": content_id,
            "post_id": post_id,
            "is_question": result.is_question,
            "asks_recommendation": result.asks_recommendation,
            "mentions_cost": result.mentions_cost,
            "mentions_platform": result.mentions_platform,
            "signal_score": result.signal_score,
            "detected_keywords": json.dumps(result.detected_keywords),
        },
    )


def _score_text_with_method(
    text_body: str | None,
    *,
    method: Method,
    hybrid_min_score: float,
) -> SignalResult:
    if method == "rules":
        return score_text(text_body)
    if method == "llm":
        return score_text_llm(text_body)
    if method == "hybrid":
        rule_result = score_text(text_body)
        if (
            rule_result.signal_score >= hybrid_min_score
            or rule_result.is_question
            or rule_result.asks_recommendation
        ):
            return rule_result
        return score_text_llm(text_body)

    raise ValueError(f"Unsupported scoring method: {method}")


def get_top_signals(
    *,
    engine: Engine,
    subreddit: str,
    limit: int = 25,
) -> list[TopSignalRow]:
    with engine.begin() as conn:
        rows = conn.execute(
            text(
                """
                SELECT s.signal_score, s.content_type, s.content_id, s.post_id,
                       p.permalink, p.title
                FROM signals s
                JOIN posts p ON p.post_id = s.post_id
                WHERE p.subreddit = :subreddit
                ORDER BY s.signal_score DESC, s.collected_at DESC
                LIMIT :limit
                """
            ),
            {"subreddit": subreddit, "limit": limit},
        ).fetchall()

    return [
        TopSignalRow(
            signal_score=float(r[0]),
            content_type=r[1],
            content_id=r[2],
            post_id=r[3],
            permalink=r[4],
            post_title=r[5],
        )
        for r in rows
    ]


def score_signals(
    *,
    engine: Engine,
    subreddit: str,
    scope: Scope = "both",
    limit_posts: int = 500,
    limit_comments: int = 2000,
    force: bool = False,
    method: Method = "rules",
    hybrid_min_score: float = 0.2,
) -> ScoreSignalsResult:
    posts_scored = 0
    comments_scored = 0

    with engine.begin() as conn:
        if scope in ("posts", "both"):
            where_force = (
                ""
                if force
                else "AND NOT EXISTS (SELECT 1 FROM signals s WHERE s.content_type='post' AND s.content_id=p.post_id)"
            )
            rows = conn.execute(
                text(
                    f"""
                    SELECT p.post_id, COALESCE(p.title,'') || '\n\n' || COALESCE(p.body,'') AS text
                    FROM posts p
                    WHERE p.subreddit=:subreddit
                    {where_force}
                    ORDER BY p.created_utc DESC NULLS LAST
                    LIMIT :limit_posts
                    """
                ),
                {"subreddit": subreddit, "limit_posts": limit_posts},
            ).fetchall()

            for post_id, combined in rows:
                result = _score_text_with_method(
                    combined, method=method, hybrid_min_score=hybrid_min_score
                )
                _upsert_signal(
                    conn=conn,
                    content_type="post",
                    content_id=post_id,
                    post_id=post_id,
                    result=result,
                )
                posts_scored += 1

        if scope in ("comments", "both"):
            where_force = (
                ""
                if force
                else "AND NOT EXISTS (SELECT 1 FROM signals s WHERE s.content_type='comment' AND s.content_id=c.comment_id)"
            )
            rows = conn.execute(
                text(
                    f"""
                    SELECT c.comment_id, c.post_id, c.body
                    FROM comments c
                    JOIN posts p ON p.post_id=c.post_id
                    WHERE p.subreddit=:subreddit
                    {where_force}
                    ORDER BY c.created_utc DESC NULLS LAST
                    LIMIT :limit_comments
                    """
                ),
                {"subreddit": subreddit, "limit_comments": limit_comments},
            ).fetchall()

            for comment_id, post_id, body in rows:
                result = _score_text_with_method(
                    body, method=method, hybrid_min_score=hybrid_min_score
                )
                _upsert_signal(
                    conn=conn,
                    content_type="comment",
                    content_id=comment_id,
                    post_id=post_id,
                    result=result,
                )
                comments_scored += 1

    return ScoreSignalsResult(posts_scored=posts_scored, comments_scored=comments_scored)
