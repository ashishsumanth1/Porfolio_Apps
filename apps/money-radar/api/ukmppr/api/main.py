"""
UK Money Pain Point Radar - FastAPI Backend

Modern REST API for the web dashboard.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import text

from ukmppr.db import get_engine
from ukmppr.trends import get_trending_themes, get_weekly_summary, get_theme_timeseries


# --- Pydantic Models ---


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    database: str


class StatsResponse(BaseModel):
    posts: int
    comments: int
    signals: int
    clusters: int


class ThemeSummary(BaseModel):
    cluster_id: int
    label: str
    top_terms: list[str]
    doc_count: int


class ThemeDetail(BaseModel):
    cluster_id: int
    label: str
    top_terms: list[str]
    doc_count: int
    posts: list[dict[str, Any]]
    timeseries: list[dict[str, Any]]


class SignalItem(BaseModel):
    content_id: str
    content_type: str
    signal_score: float
    title: str
    permalink: str
    is_question: bool
    asks_recommendation: bool
    mentions_cost: bool
    mentions_platform: bool
    reddit_score: int | None
    created_at: str | None


class TrendingTheme(BaseModel):
    cluster_id: int
    label: str
    total_docs: int
    avg_signal: float
    avg_growth: float | None
    trend_score: float


class WeeklySummary(BaseModel):
    week: str
    active_themes: int
    total_docs: int
    total_signal: float
    avg_reddit_score: float | None


class PostItem(BaseModel):
    post_id: str
    title: str
    body: str | None
    permalink: str
    score: int
    num_comments: int
    created_utc: str | None
    subreddit: str


# --- App Setup ---

# Lazy engine initialization
_engine = None


def get_db_engine():
    global _engine
    if _engine is None:
        _engine = get_engine()
    return _engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup - initialize engine
    global _engine
    try:
        _engine = get_engine()
    except Exception as e:
        print(f"Warning: Could not connect to database: {e}")
    yield
    # Shutdown


app = FastAPI(
    title="UK Money Pain Point Radar",
    description="Reddit-powered voice of customer analytics for UK personal finance",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://*.railway.app",  # Railway deployments
        "*",  # Allow all in production (served from same origin)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static frontend files in production
STATIC_DIR = Path(__file__).parent.parent.parent.parent / "static"
if STATIC_DIR.exists():
    # Mount assets directory
    if (STATIC_DIR / "assets").exists():
        app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    # Serve index.html for root
    @app.get("/", include_in_schema=False)
    async def serve_frontend():
        return FileResponse(STATIC_DIR / "index.html")


# --- Endpoints ---


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    db_status = "connected"
    try:
        with get_db_engine().connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    return HealthResponse(
        status="ok",
        timestamp=datetime.utcnow().isoformat(),
        database=db_status,
    )


@app.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    """Get overall statistics."""
    with get_db_engine().connect() as conn:
        posts = conn.execute(text("SELECT COUNT(*) FROM posts")).scalar() or 0
        comments = conn.execute(text("SELECT COUNT(*) FROM comments")).scalar() or 0
        signals = conn.execute(text("SELECT COUNT(*) FROM signals")).scalar() or 0
        clusters = (
            conn.execute(text("SELECT COUNT(*) FROM clusters WHERE cluster_id >= 0")).scalar() or 0
        )

    return StatsResponse(posts=posts, comments=comments, signals=signals, clusters=clusters)


@app.get("/api/themes", response_model=list[ThemeSummary])
async def list_themes():
    """List all discovered themes/clusters."""
    with get_db_engine().connect() as conn:
        rows = conn.execute(
            text("""
            SELECT cluster_id, label, top_terms, doc_count
            FROM clusters
            WHERE cluster_id >= 0
            ORDER BY doc_count DESC
        """)
        ).fetchall()

    return [
        ThemeSummary(
            cluster_id=r.cluster_id,
            label=r.label or f"Cluster {r.cluster_id}",
            top_terms=r.top_terms[:8] if r.top_terms else [],
            doc_count=r.doc_count or 0,
        )
        for r in rows
    ]


@app.get("/api/themes/{cluster_id}", response_model=ThemeDetail)
async def get_theme(cluster_id: int, limit: int = Query(20, le=100)):
    """Get detailed view of a specific theme."""
    with get_db_engine().connect() as conn:
        # Get cluster info
        cluster = conn.execute(
            text("""
            SELECT cluster_id, label, top_terms, doc_count
            FROM clusters WHERE cluster_id = :cid
        """),
            {"cid": cluster_id},
        ).fetchone()

        if not cluster:
            return {"error": "Theme not found"}

        # Get posts in this cluster
        posts = conn.execute(
            text("""
            SELECT p.post_id, p.title, p.permalink, p.score, p.num_comments, p.created_utc
            FROM cluster_membership cm
            JOIN posts p ON p.post_id = cm.content_id AND cm.content_type = 'post'
            WHERE cm.cluster_id = :cid
            ORDER BY p.score DESC NULLS LAST
            LIMIT :limit
        """),
            {"cid": cluster_id, "limit": limit},
        ).fetchall()

    # Get timeseries
    timeseries = get_theme_timeseries(get_db_engine(), cluster_id, weeks=12)

    return ThemeDetail(
        cluster_id=cluster.cluster_id,
        label=cluster.label or f"Cluster {cluster.cluster_id}",
        top_terms=cluster.top_terms[:10] if cluster.top_terms else [],
        doc_count=cluster.doc_count or 0,
        posts=[
            {
                "post_id": p.post_id,
                "title": p.title,
                "permalink": p.permalink,
                "score": p.score,
                "num_comments": p.num_comments,
                "created_utc": p.created_utc.isoformat() if p.created_utc else None,
            }
            for p in posts
        ],
        timeseries=timeseries,
    )


@app.get("/api/signals", response_model=list[SignalItem])
async def list_signals(
    limit: int = Query(50, le=200),
    min_score: float = Query(0.0),
    content_type: str = Query(None),
):
    """List high-signal items."""
    where_clauses = ["s.signal_score >= :min_score"]
    params: dict[str, Any] = {"min_score": min_score, "limit": limit}

    if content_type:
        where_clauses.append("s.content_type = :ctype")
        params["ctype"] = content_type

    where_sql = " AND ".join(where_clauses)

    with get_db_engine().connect() as conn:
        rows = conn.execute(
            text(f"""
            SELECT 
                s.content_id, s.content_type, s.signal_score,
                p.title, p.permalink, p.score as reddit_score, p.created_utc,
                s.is_question, s.asks_recommendation, s.mentions_cost, s.mentions_platform
            FROM signals s
            JOIN posts p ON p.post_id = s.post_id
            WHERE {where_sql}
            ORDER BY s.signal_score DESC
            LIMIT :limit
        """),
            params,
        ).fetchall()

    return [
        SignalItem(
            content_id=r.content_id,
            content_type=r.content_type,
            signal_score=r.signal_score,
            title=r.title or "",
            permalink=r.permalink or "",
            reddit_score=r.reddit_score,
            created_at=r.created_utc.isoformat() if r.created_utc else None,
            is_question=r.is_question,
            asks_recommendation=r.asks_recommendation,
            mentions_cost=r.mentions_cost,
            mentions_platform=r.mentions_platform,
        )
        for r in rows
    ]


@app.get("/api/trends/themes", response_model=list[TrendingTheme])
async def get_trending(weeks: int = Query(4, le=52), limit: int = Query(10, le=50)):
    """Get trending themes by growth and activity."""
    trending = get_trending_themes(get_db_engine(), weeks=weeks, limit=limit)
    return [TrendingTheme(**t) for t in trending]


@app.get("/api/trends/weekly", response_model=list[WeeklySummary])
async def get_weekly(weeks: int = Query(8, le=52)):
    """Get weekly activity summary."""
    summary = get_weekly_summary(get_db_engine(), weeks=weeks)
    return [WeeklySummary(**w) for w in summary]


@app.get("/api/posts")
async def list_posts(
    limit: int = Query(30, le=100),
    sort_by: str = Query("created_utc"),  # created_utc, reddit_score, comment_count
    order: str = Query("desc"),  # asc, desc
):
    """List posts with sorting options."""
    field_map = {
        "created_utc": "p.created_utc",
        "reddit_score": "p.score",
        "comment_count": "p.num_comments",
    }
    sort_field = field_map.get(sort_by, "p.created_utc")
    sort_order = "ASC" if order == "asc" else "DESC"

    with get_db_engine().connect() as conn:
        rows = conn.execute(
            text(f"""
            SELECT post_id, title, body, permalink, score, num_comments, 
                   EXTRACT(EPOCH FROM created_utc)::bigint as created_utc_ts,
                   subreddit
            FROM posts p
            ORDER BY {sort_field} {sort_order} NULLS LAST
            LIMIT :limit
        """),
            {"limit": limit},
        ).fetchall()

    return [
        {
            "content_id": r.post_id,
            "content_type": "post",
            "title": r.title or "",
            "body": (r.body or "")[:500],
            "permalink": r.permalink or "",
            "reddit_score": r.score,
            "comment_count": r.num_comments or 0,
            "created_utc": r.created_utc_ts or 0,
        }
        for r in rows
    ]


@app.get("/api/posts/{post_id}")
async def get_post(post_id: str):
    """Get a single post with its comments."""
    with get_db_engine().connect() as conn:
        post = conn.execute(
            text("""
            SELECT post_id, title, body, permalink, score, num_comments, created_utc, subreddit
            FROM posts WHERE post_id = :pid
        """),
            {"pid": post_id},
        ).fetchone()

        if not post:
            return {"error": "Post not found"}

        comments = conn.execute(
            text("""
            SELECT comment_id, body, score, depth, created_utc
            FROM comments
            WHERE post_id = :pid
            ORDER BY score DESC NULLS LAST
            LIMIT 50
        """),
            {"pid": post_id},
        ).fetchall()

        signal = conn.execute(
            text("""
            SELECT signal_score, is_question, asks_recommendation, mentions_cost, mentions_platform
            FROM signals WHERE content_id = :pid AND content_type = 'post'
        """),
            {"pid": post_id},
        ).fetchone()

    return {
        "post": {
            "post_id": post.post_id,
            "title": post.title,
            "body": post.body,
            "permalink": post.permalink,
            "score": post.score,
            "num_comments": post.num_comments,
            "created_utc": post.created_utc.isoformat() if post.created_utc else None,
            "subreddit": post.subreddit,
        },
        "comments": [
            {
                "comment_id": c.comment_id,
                "body": c.body,
                "score": c.score,
                "depth": c.depth,
                "created_utc": c.created_utc.isoformat() if c.created_utc else None,
            }
            for c in comments
        ],
        "signal": {
            "signal_score": signal.signal_score if signal else 0,
            "is_question": signal.is_question if signal else False,
            "asks_recommendation": signal.asks_recommendation if signal else False,
            "mentions_cost": signal.mentions_cost if signal else False,
            "mentions_platform": signal.mentions_platform if signal else False,
        }
        if signal
        else None,
    }


# --- SPA Catch-all Route (must be last) ---
# This handles client-side routing for the React app
if STATIC_DIR.exists():

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        """Serve the SPA for any non-API routes."""
        # Check if it's a static file
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        # Otherwise serve index.html for client-side routing
        return FileResponse(STATIC_DIR / "index.html")
