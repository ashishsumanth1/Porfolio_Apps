"""
UK Money Pain Point Radar – Streamlit Dashboard MVP

Run with:
    streamlit run src/ukmppr/dashboard.py
"""

from __future__ import annotations

import streamlit as st
import pandas as pd
from sqlalchemy import text

from ukmppr.db import get_engine
from ukmppr.trends import get_trending_themes, get_weekly_summary, get_theme_timeseries

st.set_page_config(page_title="UK Money Pain Point Radar", layout="wide")

engine = get_engine()


# --- Sidebar filters ---
st.sidebar.title("Filters")
subreddit = st.sidebar.text_input("Subreddit", value="UKPersonalFinance")

# --- Main content ---
st.title("🇬🇧 UK Money Pain Point Radar")
st.caption("Insights from r/UKPersonalFinance. **Not financial advice.**")

# Tabs
tab_trends, tab_themes, tab_signals, tab_posts = st.tabs(
    ["📈 Trends", "Themes", "High-Signal Items", "Recent Posts"]
)

# --- Trends tab ---
with tab_trends:
    st.header("Trending Topics & Weekly Analysis")

    col1, col2 = st.columns([2, 1])

    with col2:
        weeks_lookback = st.slider("Weeks to analyze", 2, 12, 4, key="trend_weeks")

    # Weekly summary chart
    st.subheader("📊 Weekly Activity Overview")
    weekly = get_weekly_summary(engine, weeks=weeks_lookback * 2)

    if weekly:
        df_weekly = pd.DataFrame(weekly)
        df_weekly["week"] = pd.to_datetime(df_weekly["week"])
        df_weekly = df_weekly.sort_values("week")

        # Activity chart
        st.line_chart(df_weekly.set_index("week")[["total_docs", "active_themes"]])

        # Summary metrics
        if len(df_weekly) >= 2:
            latest = df_weekly.iloc[-1]
            prior = df_weekly.iloc[-2]

            m1, m2, m3, m4 = st.columns(4)
            m1.metric(
                "Posts This Week",
                int(latest["total_docs"]),
                delta=int(latest["total_docs"] - prior["total_docs"]),
            )
            m2.metric(
                "Active Themes",
                int(latest["active_themes"]),
                delta=int(latest["active_themes"] - prior["active_themes"]),
            )
            m3.metric(
                "Signal Score",
                f"{latest['total_signal']:.1f}",
                delta=f"{latest['total_signal'] - prior['total_signal']:.1f}",
            )
            m4.metric("Avg Reddit Score", f"{latest['avg_reddit_score'] or 0:.0f}")
    else:
        st.info("No weekly data yet. Run `python -m ukmppr trends compute` to generate.")

    st.divider()

    # Trending themes
    st.subheader("🔥 Trending Themes")
    trending = get_trending_themes(engine, weeks=weeks_lookback, limit=10)

    if trending:
        for i, t in enumerate(trending, 1):
            growth = t["avg_growth"]
            if growth is not None and growth > 0:
                growth_badge = f"🟢 +{growth:.0f}%"
            elif growth is not None and growth < 0:
                growth_badge = f"🔴 {growth:.0f}%"
            else:
                growth_badge = "⚪ New"

            with st.expander(
                f"**#{i} {t['label']}** — {t['total_docs']} docs {growth_badge}", expanded=(i <= 3)
            ):
                st.write(
                    f"**Trend Score:** {t['trend_score']:.1f} | **Avg Signal:** {t['avg_signal']:.2f}"
                )

                # Time series for this theme
                ts = get_theme_timeseries(engine, t["cluster_id"], weeks=weeks_lookback * 2)
                if ts:
                    df_ts = pd.DataFrame(ts)
                    df_ts["week"] = pd.to_datetime(df_ts["week"])
                    st.bar_chart(df_ts.set_index("week")["docs"])

                # Sample posts from this theme
                with engine.connect() as conn:
                    posts = conn.execute(
                        text("""
                        SELECT p.title, p.permalink, p.score
                        FROM cluster_membership cm
                        JOIN posts p ON p.post_id = cm.content_id AND cm.content_type = 'post'
                        WHERE cm.cluster_id = :cid
                        ORDER BY p.score DESC NULLS LAST
                        LIMIT 5
                    """),
                        {"cid": t["cluster_id"]},
                    ).fetchall()

                if posts:
                    st.write("**Top posts:**")
                    for title, link, score in posts:
                        st.markdown(f"- [{title[:80]}]({link}) (⬆️ {score})")
    else:
        st.info("No trending data. Run `python -m ukmppr trends compute` after clustering.")

# --- Themes tab ---
with tab_themes:
    st.header("Discovered Themes (BERTopic)")

    with engine.connect() as conn:
        clusters = conn.execute(
            text(
                """
                SELECT c.cluster_id, c.label, c.top_terms, c.doc_count
                FROM clusters c
                ORDER BY c.doc_count DESC
                """
            )
        ).fetchall()

    if not clusters:
        st.info("No clusters yet. Run `python -m ukmppr cluster run` first.")
    else:
        for cluster_id, label, top_terms, doc_count in clusters:
            if cluster_id == -1:
                continue  # skip noise cluster in display
            terms = top_terms[:8] if top_terms else []
            with st.expander(f"**{label}** ({doc_count} docs)", expanded=False):
                st.write(f"**Top terms:** {', '.join(terms)}")
                # Representative posts
                with engine.connect() as conn:
                    reps = conn.execute(
                        text(
                            """
                            SELECT p.title, p.permalink
                            FROM cluster_membership cm
                            JOIN posts p ON p.post_id = cm.content_id
                            WHERE cm.cluster_id = :cid AND cm.content_type = 'post'
                            ORDER BY cm.probability DESC NULLS LAST
                            LIMIT 5
                            """
                        ),
                        {"cid": cluster_id},
                    ).fetchall()
                for title, permalink in reps:
                    st.markdown(f"- [{title}]({permalink})")

# --- High-signal items tab ---
with tab_signals:
    st.header("Top High-Signal Items")
    limit = st.slider("Show top N", 10, 100, 25)

    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT s.signal_score, s.content_type, s.content_id, p.title, p.permalink,
                       s.is_question, s.asks_recommendation, s.mentions_cost, s.mentions_platform
                FROM signals s
                JOIN posts p ON p.post_id = s.post_id
                WHERE p.subreddit = :subreddit
                ORDER BY s.signal_score DESC
                LIMIT :limit
                """
            ),
            {"subreddit": subreddit, "limit": limit},
        ).fetchall()

    if not rows:
        st.info("No signals yet. Run `python -m ukmppr score signals` first.")
    else:
        for score, ctype, cid, title, permalink, is_q, asks_rec, cost, platform in rows:
            flags = []
            if is_q:
                flags.append("❓")
            if asks_rec:
                flags.append("🛒")
            if cost:
                flags.append("💷")
            if platform:
                flags.append("🏦")
            st.markdown(f"**{score:.2f}** {''.join(flags)} [{title}]({permalink}) `{ctype}`")

# --- Recent posts tab ---
with tab_posts:
    st.header("Recent Posts")
    n_posts = st.slider("Posts to show", 5, 50, 15, key="posts_slider")

    with engine.connect() as conn:
        posts = conn.execute(
            text(
                """
                SELECT p.post_id, p.title, p.permalink, p.score, p.num_comments, p.created_utc
                FROM posts p
                WHERE p.subreddit = :subreddit
                ORDER BY p.created_utc DESC NULLS LAST
                LIMIT :n
                """
            ),
            {"subreddit": subreddit, "n": n_posts},
        ).fetchall()

    for post_id, title, permalink, score, num_comments, created in posts:
        st.markdown(f"- [{title}]({permalink}) — ⬆️ {score} 💬 {num_comments}")
