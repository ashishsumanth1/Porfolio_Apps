from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.engine import Engine


DDL = [
    # State tracking
    """
    CREATE TABLE IF NOT EXISTS ingestion_state (
      source TEXT NOT NULL,
      subreddit TEXT NOT NULL,
      feed TEXT NOT NULL,
      after_token TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (source, subreddit, feed)
    );
    """,
    # Silver: posts
    """
    CREATE TABLE IF NOT EXISTS posts (
      post_id TEXT PRIMARY KEY,
      subreddit TEXT NOT NULL,
      title TEXT,
      body TEXT,
      created_utc TIMESTAMPTZ,
      score INTEGER,
      num_comments INTEGER,
      permalink TEXT,
      collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      raw_blob_path TEXT
    );
    """,
    # Silver: comments
    """
    CREATE TABLE IF NOT EXISTS comments (
      comment_id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
      parent_id TEXT,
      depth INTEGER,
      body TEXT,
      created_utc TIMESTAMPTZ,
      score INTEGER,
      collected_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """,
    # Migrations / additive columns
    """
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS thread_blob_path TEXT;
    """,
    """
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS thread_fetched_at TIMESTAMPTZ;
    """,
    """
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS thread_comment_count INTEGER;
    """,
    # Indexes
    """
    CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
    """,
    # Gold: signals (rule-based prefilter)
    """
    CREATE TABLE IF NOT EXISTS signals (
      content_type TEXT NOT NULL CHECK (content_type IN ('post','comment')),
      content_id TEXT NOT NULL,
      post_id TEXT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
      is_question BOOLEAN NOT NULL,
      asks_recommendation BOOLEAN NOT NULL,
      mentions_cost BOOLEAN NOT NULL,
      mentions_platform BOOLEAN NOT NULL,
      signal_score DOUBLE PRECISION NOT NULL,
      detected_keywords JSONB NOT NULL,
      collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (content_type, content_id)
    );
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_signals_post_id ON signals(post_id);
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_signals_score ON signals(signal_score DESC);
    """,
    # Gold: clusters (BERTopic themes)
    """
    CREATE TABLE IF NOT EXISTS clusters (
      cluster_id INTEGER PRIMARY KEY,
      label TEXT,
      top_terms JSONB,
      representative_docs JSONB,
      doc_count INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """,
    # Gold: cluster_membership
    """
    CREATE TABLE IF NOT EXISTS cluster_membership (
      content_type TEXT NOT NULL CHECK (content_type IN ('post','comment')),
      content_id TEXT NOT NULL,
      cluster_id INTEGER NOT NULL REFERENCES clusters(cluster_id) ON DELETE CASCADE,
      probability DOUBLE PRECISION,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (content_type, content_id)
    );
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_cluster_membership_cluster ON cluster_membership(cluster_id);
    """,
]


def init_db(engine: Engine) -> None:
    with engine.begin() as conn:
        for stmt in DDL:
            conn.execute(text(stmt))
