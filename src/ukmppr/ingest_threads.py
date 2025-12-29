from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from sqlalchemy import text
from sqlalchemy.engine import Engine

from ukmppr.bronze import write_bronze_json
from ukmppr.reddit_client import RedditClient


@dataclass(frozen=True)
class ThreadIngestResult:
    posts_considered: int
    posts_fetched: int
    comments_upserted: int


def _utc_now_compact() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def _parse_created_utc(value: Any) -> datetime | None:
    if value is None:
        return None
    try:
        return datetime.fromtimestamp(float(value), tz=timezone.utc)
    except Exception:
        return None


def _iter_comment_nodes(
    children: Iterable[dict[str, Any]], *, depth: int
) -> Iterable[dict[str, Any]]:
    for child in children:
        if not isinstance(child, dict):
            continue
        if child.get("kind") != "t1":
            continue
        data = child.get("data")
        if not isinstance(data, dict):
            continue

        yield {"data": data, "depth": depth}

        replies = data.get("replies")
        if isinstance(replies, dict):
            rdata = replies.get("data") or {}
            rchildren = rdata.get("children") or []
            yield from _iter_comment_nodes(rchildren, depth=depth + 1)


def _flatten_thread(thread_payload: Any) -> tuple[dict[str, Any] | None, list[dict[str, Any]]]:
    """Return (post_data, comment_rows) from Reddit thread JSON payload."""
    if not isinstance(thread_payload, list) or len(thread_payload) < 2:
        return None, []

    post_data: dict[str, Any] | None = None
    first = thread_payload[0]
    if isinstance(first, dict):
        data = first.get("data") or {}
        children = data.get("children") or []
        if children and isinstance(children[0], dict) and isinstance(children[0].get("data"), dict):
            post_data = children[0]["data"]

    comment_rows: list[dict[str, Any]] = []
    second = thread_payload[1]
    if isinstance(second, dict):
        data = second.get("data") or {}
        children = data.get("children") or []
        for node in _iter_comment_nodes(children, depth=0):
            c = node["data"]
            cid = c.get("id")
            if not cid:
                continue
            comment_rows.append(
                {
                    "comment_id": cid,
                    "parent_id": c.get("parent_id"),
                    "depth": int(node["depth"]),
                    "body": c.get("body"),
                    "created_utc": _parse_created_utc(c.get("created_utc")),
                    "score": c.get("score"),
                }
            )

    return post_data, comment_rows


def ingest_threads(
    *,
    engine: Engine,
    bronze_dir: Path,
    user_agent: str,
    subreddit: str,
    max_posts: int = 10,
    min_comments: int = 30,
    min_score: int = 50,
    force: bool = False,
    comment_limit: int = 500,
    sort: str = "top",
) -> ThreadIngestResult:
    """Fetch thread JSON for selected posts and normalise comments into Postgres."""

    where_thread = "" if force else "AND (thread_blob_path IS NULL)"

    with engine.begin() as conn:
        rows = conn.execute(
            text(
                f"""
                SELECT post_id, permalink, num_comments, score
                FROM posts
                WHERE subreddit=:subreddit
                  AND (num_comments >= :min_comments OR score >= :min_score)
                  {where_thread}
                ORDER BY num_comments DESC NULLS LAST, score DESC NULLS LAST
                LIMIT :max_posts
                """
            ),
            {
                "subreddit": subreddit,
                "min_comments": min_comments,
                "min_score": min_score,
                "max_posts": max_posts,
            },
        ).fetchall()

    posts_considered = len(rows)
    posts_fetched = 0
    comments_upserted = 0

    if posts_considered == 0:
        return ThreadIngestResult(0, 0, 0)

    client = RedditClient(user_agent=user_agent)
    try:
        for post_id, permalink, _, _ in rows:
            payload = client.fetch_thread_json(post_id=post_id, limit=comment_limit, sort=sort)

            blob_rel = f"threads/{subreddit}/{post_id}/{_utc_now_compact()}.json"
            blob_path = write_bronze_json(bronze_dir=bronze_dir, rel_path=blob_rel, payload=payload)

            post_data, comment_rows = _flatten_thread(payload)

            with engine.begin() as conn:
                conn.execute(
                    text(
                        """
                        UPDATE posts
                        SET thread_blob_path=:thread_blob_path,
                            thread_fetched_at=now(),
                            raw_blob_path=COALESCE(raw_blob_path, :thread_blob_path),
                            permalink=COALESCE(permalink, :permalink)
                        WHERE post_id=:post_id
                        """
                    ),
                    {
                        "post_id": post_id,
                        "thread_blob_path": str(blob_path),
                        "permalink": permalink,
                    },
                )

                # Optionally refresh post fields from thread payload
                if isinstance(post_data, dict):
                    conn.execute(
                        text(
                            """
                            UPDATE posts
                            SET title=COALESCE(title, :title),
                                body=COALESCE(body, :body),
                                created_utc=COALESCE(created_utc, :created_utc)
                            WHERE post_id=:post_id
                            """
                        ),
                        {
                            "post_id": post_id,
                            "title": post_data.get("title"),
                            "body": post_data.get("selftext"),
                            "created_utc": _parse_created_utc(post_data.get("created_utc")),
                        },
                    )

                for c in comment_rows:
                    conn.execute(
                        text(
                            """
                            INSERT INTO comments (comment_id, post_id, parent_id, depth, body, created_utc, score)
                            VALUES (:comment_id, :post_id, :parent_id, :depth, :body, :created_utc, :score)
                            ON CONFLICT (comment_id) DO UPDATE SET
                              score=EXCLUDED.score,
                              body=COALESCE(EXCLUDED.body, comments.body),
                              collected_at=now()
                            """
                        ),
                        {
                            **c,
                            "post_id": post_id,
                        },
                    )

                conn.execute(
                    text(
                        """
                        UPDATE posts
                        SET thread_comment_count=:cnt
                        WHERE post_id=:post_id
                        """
                    ),
                    {"post_id": post_id, "cnt": len(comment_rows)},
                )

            posts_fetched += 1
            comments_upserted += len(comment_rows)

        return ThreadIngestResult(
            posts_considered=posts_considered,
            posts_fetched=posts_fetched,
            comments_upserted=comments_upserted,
        )
    finally:
        client.close()
