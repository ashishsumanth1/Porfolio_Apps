"""
Weekly trend aggregation for theme/cluster analysis.

Computes:
- Weekly doc counts per cluster
- Week-over-week growth percentage
- Rolling averages
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any

from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


@dataclass
class TrendsResult:
    weeks_computed: int
    rows_inserted: int


def _monday_of_week(d: date) -> date:
    """Return the Monday of the week containing date d."""
    return d - timedelta(days=d.weekday())


def compute_weekly_trends(engine: Engine, lookback_weeks: int = 12) -> TrendsResult:
    """
    Compute weekly_theme_stats for the last N weeks.

    For each cluster, calculates:
    - doc_count: number of posts in that week
    - signal_sum: sum of signal_score for those posts
    - avg_score: average Reddit score
    - growth_pct: percentage change vs prior week
    """
    with engine.begin() as conn:
        # Ensure table exists
        conn.execute(
            text("""
            CREATE TABLE IF NOT EXISTS weekly_theme_stats (
                week_start DATE NOT NULL,
                cluster_id INTEGER NOT NULL REFERENCES clusters(cluster_id) ON DELETE CASCADE,
                cluster_label TEXT,
                doc_count INTEGER NOT NULL DEFAULT 0,
                signal_sum DOUBLE PRECISION NOT NULL DEFAULT 0,
                avg_score DOUBLE PRECISION,
                growth_pct DOUBLE PRECISION,
                computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                PRIMARY KEY (week_start, cluster_id)
            );
        """)
        )
        conn.execute(
            text("""
            CREATE INDEX IF NOT EXISTS idx_weekly_theme_stats_cluster 
            ON weekly_theme_stats(cluster_id);
        """)
        )
        conn.execute(
            text("""
            CREATE INDEX IF NOT EXISTS idx_weekly_theme_stats_week 
            ON weekly_theme_stats(week_start DESC);
        """)
        )

        # Clear existing stats for recompute
        conn.execute(text("DELETE FROM weekly_theme_stats"))

        # Compute weekly stats per cluster
        # Join cluster_membership -> posts -> signals (optional)
        # Note: We use string formatting for INTERVAL since SQLAlchemy can't bind inside INTERVAL
        interval_str = f"{lookback_weeks} weeks"
        result = conn.execute(
            text(f"""
            WITH weekly_docs AS (
                SELECT 
                    date_trunc('week', p.created_utc)::date AS week_start,
                    cm.cluster_id,
                    c.label AS cluster_label,
                    COUNT(*) AS doc_count,
                    COALESCE(SUM(s.signal_score), 0) AS signal_sum,
                    AVG(p.score) AS avg_score
                FROM cluster_membership cm
                JOIN posts p ON p.post_id = cm.content_id AND cm.content_type = 'post'
                JOIN clusters c ON c.cluster_id = cm.cluster_id
                LEFT JOIN signals s ON s.content_id = cm.content_id AND s.content_type = 'post'
                WHERE p.created_utc >= NOW() - INTERVAL '{interval_str}'
                  AND cm.cluster_id >= 0  -- exclude noise cluster
                GROUP BY 1, 2, 3
            ),
            with_prior AS (
                SELECT 
                    wd.*,
                    LAG(doc_count) OVER (PARTITION BY cluster_id ORDER BY week_start) AS prior_count
                FROM weekly_docs wd
            )
            INSERT INTO weekly_theme_stats (week_start, cluster_id, cluster_label, doc_count, signal_sum, avg_score, growth_pct)
            SELECT 
                week_start,
                cluster_id,
                cluster_label,
                doc_count,
                signal_sum,
                avg_score,
                CASE 
                    WHEN prior_count IS NULL OR prior_count = 0 THEN NULL
                    ELSE ROUND(((doc_count - prior_count)::numeric / prior_count) * 100, 1)
                END AS growth_pct
            FROM with_prior
            RETURNING 1
        """)
        )

        rows_inserted = result.rowcount

    # Count distinct weeks
    with engine.connect() as conn:
        weeks = (
            conn.execute(text("SELECT COUNT(DISTINCT week_start) FROM weekly_theme_stats")).scalar()
            or 0
        )

    logger.info(f"Computed weekly trends: {weeks} weeks, {rows_inserted} rows")
    return TrendsResult(weeks_computed=weeks, rows_inserted=rows_inserted)


def get_trending_themes(
    engine: Engine, weeks: int = 4, min_docs: int = 2, limit: int = 10
) -> list[dict[str, Any]]:
    """
    Get themes sorted by recent growth/activity.

    Returns themes that:
    - Have appeared in recent weeks
    - Show growth vs prior period
    """
    interval_str = f"{weeks} weeks"
    with engine.connect() as conn:
        rows = conn.execute(
            text(f"""
            WITH recent AS (
                SELECT 
                    cluster_id,
                    cluster_label,
                    SUM(doc_count) AS total_docs,
                    AVG(signal_sum) AS avg_signal,
                    AVG(growth_pct) FILTER (WHERE growth_pct IS NOT NULL) AS avg_growth
                FROM weekly_theme_stats
                WHERE week_start >= NOW() - INTERVAL '{interval_str}'
                GROUP BY cluster_id, cluster_label
                HAVING SUM(doc_count) >= :min_docs
            )
            SELECT 
                cluster_id,
                cluster_label,
                total_docs,
                avg_signal,
                avg_growth,
                COALESCE(avg_growth, 0) + (total_docs * 0.5) AS trend_score
            FROM recent
            ORDER BY trend_score DESC
            LIMIT :limit
        """),
            {"min_docs": min_docs, "limit": limit},
        ).fetchall()

    return [
        {
            "cluster_id": r.cluster_id,
            "label": r.cluster_label,
            "total_docs": r.total_docs,
            "avg_signal": round(r.avg_signal or 0, 2),
            "avg_growth": round(r.avg_growth or 0, 1) if r.avg_growth else None,
            "trend_score": round(r.trend_score or 0, 2),
        }
        for r in rows
    ]


def get_theme_timeseries(engine: Engine, cluster_id: int, weeks: int = 12) -> list[dict[str, Any]]:
    """Get weekly time series data for a specific theme."""
    interval_str = f"{weeks} weeks"
    with engine.connect() as conn:
        rows = conn.execute(
            text(f"""
            SELECT 
                week_start,
                doc_count,
                signal_sum,
                avg_score,
                growth_pct
            FROM weekly_theme_stats
            WHERE cluster_id = :cid
              AND week_start >= NOW() - INTERVAL '{interval_str}'
            ORDER BY week_start
        """),
            {"cid": cluster_id},
        ).fetchall()

    return [
        {
            "week": r.week_start.isoformat(),
            "docs": r.doc_count,
            "signal_sum": round(r.signal_sum or 0, 2),
            "avg_score": round(r.avg_score or 0, 1) if r.avg_score else None,
            "growth_pct": r.growth_pct,
        }
        for r in rows
    ]


def get_weekly_summary(engine: Engine, weeks: int = 8) -> list[dict[str, Any]]:
    """Get overall weekly summary across all themes."""
    interval_str = f"{weeks} weeks"
    with engine.connect() as conn:
        rows = conn.execute(
            text(f"""
            SELECT 
                week_start,
                COUNT(DISTINCT cluster_id) AS active_themes,
                SUM(doc_count) AS total_docs,
                SUM(signal_sum) AS total_signal,
                AVG(avg_score) AS avg_reddit_score
            FROM weekly_theme_stats
            WHERE week_start >= NOW() - INTERVAL '{interval_str}'
            GROUP BY week_start
            ORDER BY week_start DESC
        """)
        ).fetchall()

    return [
        {
            "week": r.week_start.isoformat(),
            "active_themes": r.active_themes,
            "total_docs": r.total_docs,
            "total_signal": round(r.total_signal or 0, 2),
            "avg_reddit_score": round(r.avg_reddit_score or 0, 1) if r.avg_reddit_score else None,
        }
        for r in rows
    ]
