from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import text
from sqlalchemy.engine import Engine

from ukmppr.bronze import write_bronze_json
from ukmppr.reddit_client import RedditClient


@dataclass(frozen=True)
class IngestResult:
    fetched: int
    inserted: int
    after: str | None


def _utc_now_compact() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def ingest_new_posts(
    *,
    engine: Engine,
    bronze_dir: Path,
    user_agent: str,
    subreddit: str,
    limit: int = 100,
    pages: int = 1,
) -> IngestResult:
    source = "reddit"
    feed = "new"

    with engine.begin() as conn:
        row = conn.execute(
            text(
                """
                SELECT after_token
                FROM ingestion_state
                WHERE source=:source AND subreddit=:subreddit AND feed=:feed
                """
            ),
            {"source": source, "subreddit": subreddit, "feed": feed},
        ).fetchone()
        after = row[0] if row else None

    fetched = 0
    inserted = 0

    client = RedditClient(user_agent=user_agent)
    try:
        current_after = after
        for _ in range(pages):
            listing = client.fetch_listing(
                subreddit=subreddit, feed=feed, limit=limit, after=current_after
            )
            fetched += len(listing.items)

            # Bronze snapshot for reproducibility
            blob_rel = (
                f"listings/{subreddit}/{feed}/{_utc_now_compact()}_{current_after or 'start'}.json"
            )
            write_bronze_json(
                bronze_dir=bronze_dir,
                rel_path=blob_rel,
                payload={
                    "subreddit": subreddit,
                    "feed": feed,
                    "after": current_after,
                    "items": listing.items,
                    "next_after": listing.after,
                },
            )

            with engine.begin() as conn:
                for item in listing.items:
                    post_id = item.get("id")
                    if not post_id:
                        continue
                    params: dict[str, Any] = {
                        "post_id": post_id,
                        "subreddit": subreddit,
                        "title": item.get("title"),
                        "body": item.get("selftext"),
                        "created_utc": datetime.fromtimestamp(
                            item.get("created_utc", 0), tz=timezone.utc
                        )
                        if item.get("created_utc")
                        else None,
                        "score": item.get("score"),
                        "num_comments": item.get("num_comments"),
                        "permalink": ("https://www.reddit.com" + item.get("permalink"))
                        if item.get("permalink")
                        else None,
                        "raw_blob_path": str(bronze_dir / blob_rel),
                    }
                    res = conn.execute(
                        text(
                            """
                            INSERT INTO posts (post_id, subreddit, title, body, created_utc, score, num_comments, permalink, raw_blob_path)
                            VALUES (:post_id, :subreddit, :title, :body, :created_utc, :score, :num_comments, :permalink, :raw_blob_path)
                            ON CONFLICT (post_id) DO UPDATE SET
                              score=EXCLUDED.score,
                              num_comments=EXCLUDED.num_comments,
                              collected_at=now(),
                              raw_blob_path=EXCLUDED.raw_blob_path
                            """
                        ),
                        params,
                    )
                    # SQLAlchemy doesn't easily expose rowcount for INSERT .. ON CONFLICT; count as inserted-ish
                    inserted += 1 if res is not None else 0

                conn.execute(
                    text(
                        """
                        INSERT INTO ingestion_state (source, subreddit, feed, after_token)
                        VALUES (:source, :subreddit, :feed, :after)
                        ON CONFLICT (source, subreddit, feed) DO UPDATE SET
                          after_token=EXCLUDED.after_token,
                          updated_at=now()
                        """
                    ),
                    {
                        "source": source,
                        "subreddit": subreddit,
                        "feed": feed,
                        "after": listing.after,
                    },
                )

            current_after = listing.after
            if not current_after:
                break

        return IngestResult(fetched=fetched, inserted=inserted, after=current_after)
    finally:
        client.close()
