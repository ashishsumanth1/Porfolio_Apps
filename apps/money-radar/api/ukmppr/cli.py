from __future__ import annotations

from pathlib import Path

import typer

from ukmppr.clustering import get_cluster_summary, run_clustering
from ukmppr.db import get_engine
from ukmppr.evaluation import (
    export_predictions_for_review,
    load_test_set,
    run_regression_tests,
    sample_for_labelling,
    save_test_set,
)
from ukmppr.ingest_listings import ingest_new_posts
from ukmppr.ingest_threads import ingest_threads
from ukmppr.llm_extraction import (
    run_extraction,
    get_pain_points_by_stage,
    get_stage_summary,
)
from ukmppr.logging import configure_logging
from ukmppr.score_signals import get_top_signals, score_signals
from ukmppr.schema import init_db
from ukmppr.settings import settings
from ukmppr.trends import compute_weekly_trends, get_trending_themes, get_weekly_summary

app = typer.Typer(add_completion=False)


db_app = typer.Typer(help="Database utilities")
ingest_app = typer.Typer(help="Ingestion jobs")
score_app = typer.Typer(help="Scoring / prefilter jobs")
cluster_app = typer.Typer(help="Clustering / topic modelling")
extract_app = typer.Typer(help="LLM extraction for pain points and intent")
trends_app = typer.Typer(help="Trend analysis & weekly aggregates")
eval_app = typer.Typer(help="Evaluation & regression testing")
app.add_typer(db_app, name="db")
app.add_typer(ingest_app, name="ingest")
app.add_typer(score_app, name="score")
app.add_typer(cluster_app, name="cluster")
app.add_typer(extract_app, name="extract")
app.add_typer(trends_app, name="trends")
app.add_typer(eval_app, name="eval")


@db_app.command("init")
def db_init() -> None:
    """Create required tables in Postgres."""
    configure_logging(settings.log_level)
    engine = get_engine()
    init_db(engine)
    typer.echo("DB initialised")


@ingest_app.command("listings")
def ingest_listings(
    subreddit: str = typer.Option("UKPersonalFinance", "--subreddit"),
    limit: int = typer.Option(100, "--limit"),
    pages: int = typer.Option(1, "--pages"),
) -> None:
    """Ingest newest posts listing into Bronze + Postgres posts table."""
    configure_logging(settings.log_level)
    settings.bronze_dir.mkdir(parents=True, exist_ok=True)

    engine = get_engine()
    result = ingest_new_posts(
        engine=engine,
        bronze_dir=settings.bronze_dir,
        user_agent=settings.reddit_user_agent,
        subreddit=subreddit,
        limit=limit,
        pages=pages,
    )
    typer.echo(
        f"fetched={result.fetched} inserted_or_updated={result.inserted} after={result.after}"
    )


@ingest_app.command("threads")
def ingest_threads_cmd(
    subreddit: str = typer.Option("UKPersonalFinance", "--subreddit"),
    max_posts: int = typer.Option(5, "--max-posts"),
    min_comments: int = typer.Option(30, "--min-comments"),
    min_score: int = typer.Option(50, "--min-score"),
    force: bool = typer.Option(False, "--force"),
    comment_limit: int = typer.Option(500, "--comment-limit"),
    sort: str = typer.Option("top", "--sort"),
) -> None:
    """Fetch selected thread JSON and normalise comment trees into `comments`."""
    configure_logging(settings.log_level)
    settings.bronze_dir.mkdir(parents=True, exist_ok=True)

    engine = get_engine()
    # Ensure schema exists / migrations applied.
    init_db(engine)

    result = ingest_threads(
        engine=engine,
        bronze_dir=settings.bronze_dir,
        user_agent=settings.reddit_user_agent,
        subreddit=subreddit,
        max_posts=max_posts,
        min_comments=min_comments,
        min_score=min_score,
        force=force,
        comment_limit=comment_limit,
        sort=sort,
    )
    typer.echo(
        f"considered={result.posts_considered} fetched={result.posts_fetched} comments_upserted={result.comments_upserted}"
    )


@score_app.command("signals")
def score_signals_cmd(
    subreddit: str = typer.Option("UKPersonalFinance", "--subreddit"),
    scope: str = typer.Option("both", "--scope", help="posts|comments|both"),
    limit_posts: int = typer.Option(500, "--limit-posts"),
    limit_comments: int = typer.Option(2000, "--limit-comments"),
    force: bool = typer.Option(False, "--force"),
    method: str = typer.Option("rules", "--method", help="rules|llm|hybrid"),
    hybrid_min_score: float = typer.Option(
        0.2, "--hybrid-min-score", help="Min rule score before skipping LLM"
    ),
    top: int = typer.Option(15, "--top"),
) -> None:
    """Compute signal flags/scores for posts/comments."""
    configure_logging(settings.log_level)
    engine = get_engine()
    init_db(engine)

    if scope not in ("posts", "comments", "both"):
        raise typer.BadParameter("--scope must be one of: posts, comments, both")
    if method not in ("rules", "llm", "hybrid"):
        raise typer.BadParameter("--method must be one of: rules, llm, hybrid")

    result = score_signals(
        engine=engine,
        subreddit=subreddit,
        scope=scope,  # type: ignore[arg-type]
        limit_posts=limit_posts,
        limit_comments=limit_comments,
        force=force,
        method=method,  # type: ignore[arg-type]
        hybrid_min_score=hybrid_min_score,
    )
    typer.echo(f"posts_scored={result.posts_scored} comments_scored={result.comments_scored}")

    rows = get_top_signals(engine=engine, subreddit=subreddit, limit=top)
    for r in rows:
        title = (r.post_title or "").replace("\n", " ")
        typer.echo(f"{r.signal_score:.2f} [{r.content_type}] {title[:90]} | {r.permalink}")


@cluster_app.command("run")
def cluster_run_cmd(
    subreddit: str = typer.Option("UKPersonalFinance", "--subreddit"),
    limit: int = typer.Option(2000, "--limit"),
    min_topic_size: int = typer.Option(10, "--min-topic-size"),
    min_signal: float = typer.Option(0.3, "--min-signal", help="Minimum signal score threshold"),
    model: str = typer.Option("all-MiniLM-L6-v2", "--model"),
    nr_topics: str = typer.Option("auto", "--nr-topics", help="Number of topics or 'auto'"),
) -> None:
    """Embed posts and cluster with BERTopic."""
    configure_logging(settings.log_level)
    engine = get_engine()
    init_db(engine)

    # Parse nr_topics
    topics_param: int | str = "auto"
    if nr_topics != "auto":
        try:
            topics_param = int(nr_topics)
        except ValueError:
            topics_param = "auto"

    result = run_clustering(
        engine=engine,
        subreddit=subreddit,
        limit=limit,
        min_topic_size=min_topic_size,
        min_signal_score=min_signal,
        embedding_model=model,
        nr_topics=topics_param,
    )
    typer.echo(
        f"embedded={result.docs_embedded} clusters={result.clusters_created} noise={result.noise_count}"
    )

    summary = get_cluster_summary(engine)
    for c in summary[:15]:
        terms = c["top_terms"][:5] if c["top_terms"] else []
        typer.echo(f"  [{c['cluster_id']}] {c['label'][:60]} | docs={c['doc_count']} | {terms}")


# ─────────────────────────────────────────────────────────────────────────────
# LLM Extraction commands
# ─────────────────────────────────────────────────────────────────────────────


@extract_app.command("run")
def extract_run_cmd(
    limit: int = typer.Option(50, "--limit", help="Number of items to process"),
    min_signal: float = typer.Option(0.5, "--min-signal", help="Minimum signal score"),
    force: bool = typer.Option(False, "--force", help="Re-extract even if already processed"),
) -> None:
    """Extract pain points and intent using LLM (Groq API or local Ollama)."""
    configure_logging(settings.log_level)
    engine = get_engine()
    init_db(engine)

    provider = settings.llm_provider.upper()
    typer.echo(f"Running LLM extraction with {provider}...")
    result = run_extraction(
        engine=engine,
        limit=limit,
        min_signal_score=min_signal,
        force=force,
    )
    typer.echo(
        f"processed={result.processed} successful={result.successful} failed={result.failed}"
    )


@extract_app.command("summary")
def extract_summary_cmd() -> None:
    """Show summary of extracted intent labels by UKPF stage."""
    configure_logging(settings.log_level)
    engine = get_engine()

    summary = get_stage_summary(engine)
    if not summary:
        typer.echo("No extractions found. Run `ukmppr extract run` first.")
        return

    typer.echo("\n📊 Pain Points by UKPF Stage:")
    typer.echo("-" * 60)
    for s in summary:
        typer.echo(
            f"  {s['stage']:<18} | count={s['count']:<4} | "
            f"avg_buying={s['avg_buying_intent']:.2f} | recs={s['recommendation_requests']}"
        )


@extract_app.command("show")
def extract_show_cmd(
    stage: str = typer.Option(None, "--stage", help="Filter by UKPF stage"),
    limit: int = typer.Option(20, "--limit"),
) -> None:
    """Show extracted pain points, optionally filtered by stage."""
    configure_logging(settings.log_level)
    engine = get_engine()

    points = get_pain_points_by_stage(engine, stage=stage, limit=limit)
    if not points:
        typer.echo("No pain points found.")
        return

    typer.echo("\n🎯 Top Pain Points" + (f" [{stage}]" if stage else "") + ":")
    typer.echo("-" * 80)
    for p in points:
        intent_emoji = {
            "question": "❓",
            "recommendation_request": "🛒",
            "rant": "😤",
            "comparison": "⚖️",
            "warning_story": "⚠️",
            "success_story": "🎉",
        }.get(p["intent_type"], "📝")

        typer.echo(
            f"{intent_emoji} [{p['ukpf_stage']:<12}] buying={p['buying_intent_score']:.1f} | "
            f"{p['pain_point'][:60]}"
        )
        if p["products_mentioned"]:
            prods = p["products_mentioned"] if isinstance(p["products_mentioned"], list) else []
            if prods:
                typer.echo(f"   └─ Products: {', '.join(prods[:5])}")


@trends_app.command("compute")
def trends_compute_cmd(
    lookback_weeks: int = typer.Option(12, "--weeks", help="Number of weeks to analyze"),
) -> None:
    """Compute weekly theme statistics and growth metrics."""
    configure_logging(settings.log_level)
    engine = get_engine()
    init_db(engine)

    result = compute_weekly_trends(engine=engine, lookback_weeks=lookback_weeks)
    typer.echo(f"weeks={result.weeks_computed} rows_inserted={result.rows_inserted}")


@trends_app.command("show")
def trends_show_cmd(
    weeks: int = typer.Option(4, "--weeks", help="Recent weeks to consider"),
    limit: int = typer.Option(10, "--limit"),
) -> None:
    """Show trending themes ranked by growth and activity."""
    configure_logging(settings.log_level)
    engine = get_engine()

    trending = get_trending_themes(engine=engine, weeks=weeks, limit=limit)
    if not trending:
        typer.echo("No trends computed yet. Run `python -m ukmppr trends compute` first.")
        return

    typer.echo(f"\n📈 Top {len(trending)} Trending Themes (last {weeks} weeks):\n")
    for t in trending:
        growth_str = (
            f"+{t['avg_growth']}%"
            if t["avg_growth"] and t["avg_growth"] > 0
            else f"{t['avg_growth']}%"
            if t["avg_growth"]
            else "N/A"
        )
        typer.echo(
            f"  [{t['cluster_id']:2d}] {t['label'][:50]:<50} | docs={t['total_docs']:3d} | growth={growth_str}"
        )


@trends_app.command("summary")
def trends_summary_cmd(
    weeks: int = typer.Option(8, "--weeks"),
) -> None:
    """Show weekly summary of all theme activity."""
    configure_logging(settings.log_level)
    engine = get_engine()

    summary = get_weekly_summary(engine=engine, weeks=weeks)
    if not summary:
        typer.echo("No weekly data. Run `python -m ukmppr trends compute` first.")
        return

    typer.echo(f"\n📊 Weekly Summary (last {weeks} weeks):\n")
    typer.echo(f"{'Week':<12} {'Themes':>7} {'Docs':>6} {'Signal':>8} {'Avg Score':>10}")
    typer.echo("-" * 50)
    for w in summary:
        typer.echo(
            f"{w['week']:<12} {w['active_themes']:>7} {w['total_docs']:>6} "
            f"{w['total_signal']:>8.1f} {w['avg_reddit_score'] or 0:>10.1f}"
        )


# --- Evaluation commands ---


@eval_app.command("sample")
def eval_sample_cmd(
    n_posts: int = typer.Option(100, "--posts"),
    n_comments: int = typer.Option(100, "--comments"),
    output: str = typer.Option("data/eval/samples.jsonl", "--output"),
) -> None:
    """Sample posts and comments for manual labelling."""
    configure_logging(settings.log_level)
    engine = get_engine()

    items = sample_for_labelling(engine, n_posts=n_posts, n_comments=n_comments)
    save_test_set(items, Path(output))
    typer.echo(f"Sampled {len(items)} items to {output}")


@eval_app.command("export")
def eval_export_cmd(
    limit: int = typer.Option(200, "--limit"),
    output: str = typer.Option("data/eval/predictions_for_review.jsonl", "--output"),
) -> None:
    """Export system predictions for manual review."""
    configure_logging(settings.log_level)
    engine = get_engine()

    count = export_predictions_for_review(engine, Path(output), limit=limit)
    typer.echo(f"Exported {count} predictions to {output}")


@eval_app.command("test")
def eval_test_cmd(
    test_set: str = typer.Option("data/eval/test_set.jsonl", "--test-set"),
) -> None:
    """Run regression tests against labelled test set."""
    configure_logging(settings.log_level)
    engine = get_engine()

    passed = run_regression_tests(engine, Path(test_set))
    raise typer.Exit(code=0 if passed else 1)


@eval_app.command("report")
def eval_report_cmd(
    test_set: str = typer.Option("data/eval/test_set.jsonl", "--test-set"),
) -> None:
    """Generate evaluation report from labelled test set."""
    configure_logging(settings.log_level)
    engine = get_engine()

    from ukmppr.evaluation import evaluate_signals

    items = load_test_set(Path(test_set))
    if not items:
        typer.echo("No test set found. Create one with `python -m ukmppr eval sample`")
        raise typer.Exit(1)

    report = evaluate_signals(engine, items)
    typer.echo(report.summary())


if __name__ == "__main__":
    app()
