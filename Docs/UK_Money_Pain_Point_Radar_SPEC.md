# UK Money Pain Point Radar
A Reddit-powered "voice of customer" analytics pipeline for UK personal finance. Collects threads, normalises nested comment trees, extracts structured pain points and intent, clusters themes, tracks trends, and serves insights with evidence links.

---

## 0. Why this project exists
People share real financial confusion and friction in public discussions: budgeting breakdowns, debt stress, pension confusion, ISA platform debates, credit-score myths, mortgage anxiety, and more. This project turns that noisy text stream into **structured, explainable insights**.

What makes it résumé-worthy:
- End to end data product: ingestion → modelling → enrichment → evaluation → dashboard
- Reproducible, scheduled pipeline with storage and backfills
- Modern NLP plus LLM techniques with schema validation
- Responsible handling of public content and platform constraints

---

## 1. Scope and positioning
### 1.1 Target subreddits (starter set)
- r/UKPersonalFinance (anchor)
- r/UKInvesting (optional)
- r/FIREUK (optional)

If you want a clean MVP, start with **r/UKPersonalFinance only**, ship, then add a second community.

### 1.2 What the system outputs
Weekly (or daily) deliverables:
- Top themes and rising themes
- Pain points per UKPF stage (budgeting, emergency fund, pension, debt, ISA, investing, mortgage, credit)
- Buying-intent signals (product and platform comparisons, "what should I use" questions)
- Evidence panel: representative posts and comments for each theme

### 1.3 Not financial advice
This project is an insight tool. The UI should include a disclaimer that outputs are summaries of public discussion, not guidance.

---

## 2. Data access and constraints
### 2.1 Listings and pagination
Reddit listing endpoints support pagination with parameters like `limit` and `after`. Use them to collect incrementally and avoid trying to download history in one go.

Typical listing patterns:
- `/r/{sub}/new.json?limit=100`
- `/r/{sub}/top.json?t=week&limit=100`

### 2.2 Thread JSON
Many Reddit thread pages can be retrieved in structured JSON by requesting the JSON representation (commonly via `.json` for thread pages). Use this to fetch the full comment tree for selected threads.

### 2.3 Rate limiting
Design around rate limits and throttling:
- Read and log rate limit headers when available.
- Backoff and retry on 429 responses.
- Use a descriptive User-Agent.
- Cache responses and avoid refetching unchanged threads when possible.

If you want less boilerplate, use PRAW which implements dynamic rate limiting using response headers.

### 2.4 Policy and responsible usage
Reddit's Data API Terms include restrictions related to ML and AI training. Treat this as an analytics and summarisation system, store minimal personal data, and avoid building user profiles.

---

## 3. Architecture
### 3.1 High-level pattern
Use a Bronze–Silver–Gold analytics stack plus a serving layer.

- **Bronze**: raw JSON payloads as collected (reproducibility)
- **Silver**: normalised relational tables for posts and comments
- **Gold**: enriched labels, embeddings, clusters, weekly aggregates
- **Serving**: API + dashboard with evidence traceability

### 3.2 Reference diagram (ASCII)
```
             +---------------------------+
             |   Reddit Listings API     |
             |   (new/top/search)        |
             +-------------+-------------+
                           |
                           v
                 +------------------+
                 |  Ingestion Job   |
                 |  - pagination    |
                 |  - rate limit    |
                 |  - caching       |
                 +--------+---------+
                          |
                          v
                 +------------------+
                 | Bronze Storage   |
                 | raw JSON blobs   |
                 +--------+---------+
                          |
                          v
                 +------------------+
                 | Normaliser       |
                 | - flatten tree   |
                 | - validate       |
                 +--------+---------+
                          |
                          v
                 +------------------+
                 | Silver Storage   |
                 | posts/comments   |
                 +--------+---------+
                          |
                          v
     +--------------------+--------------------+
     |                                         |
     v                                         v
+------------+                         +----------------+
| Pre-filter |                         | Enrichment     |
| rules or   |                         | - LLM schema   |
| classifier |                         | - entities     |
+------+-----+                         | - embeddings   |
       |                               | - clustering   |
       v                               +--------+-------+
+------------------+                            |
| Gold Analytics   |                            v
| themes, trends,  |                     +--------------+
| intent, evidence |                     | API + UI     |
+------------------+                     | dashboard    |
                                         +--------------+
```

---

## 4. Tooling options (choose a stack)
### 4.1 MVP stack (fastest to ship)
- Python
- httpx (or requests)
- DuckDB (local analytics DB)
- BERTopic for topic modelling
- Sentence-Transformers (SBERT embeddings)
- Streamlit for dashboard

Best for: fast demo, minimal ops.

### 4.2 Portfolio "production-style" stack
- Python + FastAPI
- Postgres + pgvector for embeddings search
- Prefect (or Dagster) for scheduled runs
- React dashboard (optional) or Streamlit
- Docker Compose for one-command run
- GitHub Actions for tests and linting

Best for: showing engineering depth and product delivery.

### 4.3 Reddit client choices
- Direct HTTP calls: maximum control, more code.
- PRAW: less boilerplate, built-in rate limit handling.

---

## 5. Data model
### 5.1 Core (Silver) tables
**posts**
- post_id (string)
- subreddit (string)
- title (text)
- body (text)
- created_utc (timestamp)
- score (int)
- num_comments (int)
- permalink (text)
- collected_at (timestamp)
- raw_blob_path (text, pointer to Bronze)

**comments**
- comment_id (string)
- post_id (string)
- parent_id (string, nullable)
- depth (int)
- body (text)
- created_utc (timestamp)
- score (int)
- collected_at (timestamp)

Optional: store `author` only if you have a strong reason. Prefer omitting or hashing.

### 5.2 Enrichment (Gold) tables
**signals**
- content_id (post_id or comment_id)
- is_question (bool)
- asks_recommendation (bool)
- mentions_cost (bool)
- mentions_platform (bool)
- signal_score (float)
- detected_keywords (json)

**intent_labels**
- content_id
- ukpf_stage (enum)
- intent_type (enum: question, rant, recommendation_request, comparison, success_story, warning_story)
- buying_intent_score (float 0–1)
- pain_point (text)
- suggested_features (json array)
- products_mentioned (json array)
- rationale (text, short)
- evidence_ids (json array of comment_ids)

**embeddings**
- content_id
- embedding (vector)

**clusters**
- cluster_id
- label (text)
- top_terms (json array)
- created_at

**cluster_membership**
- content_id
- cluster_id
- confidence (float)

**weekly_theme_stats**
- week_start (date)
- cluster_id
- count_posts
- count_comments
- growth_rate
- avg_buying_intent_score

---

## 6. Pipeline stages and techniques
### Stage A. Discover posts
Goal: collect thread URLs to process.

Technique options:
1) Incremental listing ingestion (recommended)
- Collect newest posts daily
- Keep a watermark (`after` token) per subreddit and feed

2) Top weekly ingestion
- Collect `top?t=week` each week
- Good for stable themes and high quality threads

3) Keyword targeting (boost intent)
- Search for terms like "ISA", "pension", "credit score", "broker", "APR", "Vanguard", "Trading 212"
- Use this as a filter, not the only method, to reduce bias

### Stage B. Fetch full threads
Goal: for selected posts, fetch the nested comment tree.

Technique options:
- Fetch JSON for thread page and parse comment listings
- Store raw payloads in Bronze for reproducibility

Selection rule (simple MVP):
- fetch threads where `num_comments >= 30` OR `score >= 50`
- plus a small keyword match for buying intent

### Stage C. Normalise and validate
Goal: convert nested JSON tree into flat relational records.

Key implementation techniques:
- Recursive traversal of comment tree
- Track depth and parent_id
- Strip or flag deleted/removed comments
- Validate required fields with Pydantic models

### Stage D. Pre-filter (save cost)
Goal: identify high-signal content before any LLM.

Option D1: Rules-based scoring
Create a "signal_score" from features like:
- question marks
- phrases: "what should I do", "anyone recommend", "best platform", "fees", "APR", "interest"
- currency patterns: "£", "percent", "APR"
- negative sentiment indicators (lightweight lexicon)

Option D2: Lightweight classifier (upgrade)
Label 300–800 examples and train:
- logistic regression with TF-IDF
- or a small transformer classifier

This shows ML fundamentals and typically reduces LLM volume by 70–90%.

### Stage E. Structured extraction with LLM
Goal: turn raw text into consistent, queryable labels.

Best practice: **schema-first extraction** with strict JSON validation.

Recommended output schema:
- ukpf_stage: Budgeting, Emergency Fund, Debt, Pension, ISA, Investing, Mortgage, Credit
- intent_type
- pain_point (one sentence)
- buying_intent_score (0–1)
- products_mentioned
- suggested_features
- evidence_quotes (short snippets)
- rationale (1–2 lines)

Quality techniques:
- Use few-shot examples from your own labelled set
- Constrain maximum evidence quote length
- Always include evidence IDs for traceability

### Stage F. Theme discovery and clustering
Goal: group similar pain points into themes.

Option F1: BERTopic (portfolio friendly)
- embeddings from Sentence-Transformers
- clustering (often HDBSCAN)
- topic representation via c-TF-IDF
Outputs interpretable topics with representative docs.

Option F2: Embeddings + HDBSCAN (custom)
- embed `pain_point` text
- HDBSCAN for clusters of varying density
- label clusters with top keywords from c-TF-IDF or TF-IDF

Baseline options:
- LDA or NMF on TF-IDF (good baseline, less semantic)

### Stage G. Trends
Goal: productise topics into time-aware insights.

Weekly metrics:
- theme volume (count)
- growth vs prior week
- intent mix per theme
- average buying intent per theme
- "new theme detection" when a cluster appears for the first time

### Stage H. Serving layer
Goal: let someone explore and export.

API endpoints (FastAPI):
- `/themes?week=YYYY-MM-DD&subreddit=...`
- `/theme/{cluster_id}`
- `/search?q=...`
- `/export?week=...`

UI (Streamlit or React):
- Theme table with growth arrows
- Evidence panel with representative threads and comment snippets
- Filters: week, stage, intent, subreddit
- Export as CSV or JSON

---

## 7. Evaluation plan (what makes it credible)
Most portfolio projects skip evaluation. Do not.

### 7.1 Label evaluation (LLM extraction)
Create a labelled test set of 200–400 items.
Measure:
- stage accuracy
- intent accuracy
- high vs low buying intent agreement

You can report:
- accuracy per label
- confusion matrix for stage
- human–model agreement rate

### 7.2 Topic evaluation
Measure:
- topic coherence proxies (top terms sanity check)
- stability across reruns for the same week
- coverage: percent assigned to a non-noise cluster

### 7.3 Regression tests
Create a "golden" sample of 20 threads.
Tests:
- schema validation must pass
- cluster count in expected range
- dashboard queries return non-empty results

---

## 8. Cost control techniques
- Pre-filter aggressively
- Cache LLM outputs by content hash
- Summarise per cluster, not per comment, at scale
- Store embeddings once and reuse
- Batch calls where your provider supports it

---

## 9. Responsible handling checklist
- Respect rate limits and implement retries
- Store minimal personal data, avoid profiling
- Provide deletion handling if content is removed
- Follow platform terms regarding ML and content usage
- Disclaimers: not financial advice, outputs are summaries of public discussion

---

## 10. What you can claim on your résumé after shipping
Skills demonstrated:
- API ingestion with pagination, rate limit handling, caching
- Data modelling and nested JSON normalisation
- NLP: embeddings, clustering, topic modelling
- LLM engineering: schema extraction, evaluation, guardrails
- Analytics engineering: weekly rollups, trend detection
- Dashboarding and stakeholder-ready reporting
- Docker and CI for reproducibility

Example bullet ideas:
- Built an end-to-end UK finance insights pipeline ingesting Reddit threads, normalising comment trees into relational storage, and extracting structured pain points and intent with evidence traceability.
- Implemented rate-limit aware ingestion with caching, retries, and incremental backfills; automated weekly reporting and a dashboard for theme exploration.
- Applied embeddings plus topic modelling (BERTopic or HDBSCAN-based clustering) to identify recurring themes and monitor trend shifts over time.
- Added evaluation harness with labelled data to quantify extraction accuracy and topic stability.

---

## 11. Vibe-coding build plan (milestones)
### Milestone 1: Data ingestion
- Collect new posts from r/UKPersonalFinance daily
- Store raw JSON to disk (Bronze)
- Store posts table (Silver)

### Milestone 2: Thread normalisation
- Fetch full thread JSON for top threads
- Flatten comments table
- Build a "thread viewer" page in Streamlit

### Milestone 3: Signal scoring
- Implement rules-based signal scoring
- Build a "high-signal threads" view

### Milestone 4: LLM extraction
- Add schema extraction for top N threads weekly
- Store intent_labels table (Gold)

### Milestone 5: Themes and trends
- Add embeddings
- Add BERTopic clusters and weekly aggregates
- Add "rising themes" and evidence panel

### Milestone 6: Polish and evaluation
- Add evaluation notebook and metrics
- Add Docker Compose and GitHub Actions
- Finish README, architecture diagram, screenshots

---

## 12. References (primary and high-quality)
- UKPersonalFinance Wiki and Flowchart:
  - https://ukpersonal.finance/
  - https://ukpersonal.finance/flowchart/
- Reddit Data API Terms:
  - https://redditinc.com/policies/data-api-terms
- Reddit API rate limiting discussion (background):
  - https://praw.readthedocs.io/en/stable/getting_started/ratelimits.html
- BERTopic documentation:
  - https://maartengr.github.io/BERTopic/index.html
- Sentence-BERT paper (Reimers and Gurevych, 2019):
  - https://arxiv.org/abs/1908.10084
- HDBSCAN paper and library:
  - Campello et al. (2013): https://link.springer.com/chapter/10.1007/978-3-642-37456-2_14
  - McInnes et al. (JOSS): https://www.theoj.org/joss-papers/joss.00205/10.21105.joss.00205.pdf
- pgvector:
  - https://github.com/pgvector/pgvector
