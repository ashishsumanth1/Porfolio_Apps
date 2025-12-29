# UK Money Pain Point Radar (UKMPPR)

Reddit-powered "voice of customer" analytics pipeline for UK personal finance.

## MVP decisions (current)
- Stack: **FastAPI + Postgres (pgvector) + React/Vite + TailwindCSS**
- Subreddits: **r/UKPersonalFinance only** (MVP)
- Cadence: daily listing ingest; weekly aggregates
- Ingestion: HTTP JSON endpoints with backoff and caching (no OAuth in MVP)
- ML: BERTopic for theme clustering, sentence-transformers for embeddings
- LLM: **Ollama with Llama 3.2 1B** for local intent/pain point extraction

> This is an insights/summarisation tool. **Not financial advice.**

## Features
- 📥 **Data Ingestion**: Pull posts and comment threads from Reddit
- 🔍 **Signal Detection**: Rule-based scoring for pain points, questions, recommendations
- 🏷️ **Topic Clustering**: BERTopic-powered theme discovery (26 meaningful themes)
- 🧠 **LLM Extraction**: Local Llama 3.2 extracts UKPF stage, intent, pain points
- 📈 **Trend Analysis**: Weekly aggregates with growth metrics
- 📊 **Modern Dashboard**: React + TailwindCSS with dark mode

## Quickstart (Local Development)

### Prerequisites
- Python 3.13+
- Node.js 22+
- PostgreSQL 16+ (via Homebrew or Docker)
- Ollama (optional, for LLM extraction)

### 1. Setup Environment
```bash
# Clone and setup
cd /path/to/project
python -m venv .venv
source .venv/bin/activate
pip install -e .

# Create env file
cp .env.example .env
# Edit .env with your database credentials
```

### 2. Database Setup

**Option A: Local PostgreSQL (Homebrew)**
```bash
brew install postgresql@16
brew services start postgresql@16
createuser -s ukmppr
createdb ukmppr -O ukmppr
```

**Option B: Docker**
```bash
docker compose up -d db
```

### 3. Initialize & Ingest Data
```bash
# Create tables
python -m ukmppr db init

# Ingest posts (100 per page, 10 pages)
python -m ukmppr ingest listings --limit 100 --pages 10

# Fetch threads with comments
python -m ukmppr ingest threads --max-posts 50 --min-comments 5

# Score signals
python -m ukmppr score signals

# Run clustering
python -m ukmppr cluster run --limit 300

# Compute trends
python -m ukmppr trends compute --weeks 12
```

### 4. Launch Services

**Backend API**
```bash
uvicorn ukmppr.api.main:app --reload --port 8000
# API available at http://localhost:8000
```

**Frontend Dashboard**
```bash
cd web
npm install
npm run dev
# Dashboard at http://localhost:5173
```

### 5. LLM Extraction (Optional)

Install Ollama and pull Llama 3.2:
```bash
# Install Ollama (macOS)
brew install ollama

# Pull Llama 3.2 1B model (~1.3GB, fits in 3GB RAM)
ollama pull llama3.2:1b

# Run extraction on high-signal items
python -m ukmppr extract run --min-signal 0.5

# View extraction summary
python -m ukmppr extract summary
```

## CLI Reference

```bash
python -m ukmppr --help

# Database
python -m ukmppr db init           # Create/migrate tables

# Ingestion
python -m ukmppr ingest listings   # Pull post listings
python -m ukmppr ingest threads    # Fetch full threads with comments

# Scoring
python -m ukmppr score signals     # Compute signal scores

# Clustering
python -m ukmppr cluster run       # Run BERTopic clustering

# LLM Extraction
python -m ukmppr extract run       # Extract intents/pain points via Ollama
python -m ukmppr extract summary   # Show extraction stats by UKPF stage
python -m ukmppr extract show      # Show extracted items

# Trends
python -m ukmppr trends compute    # Compute weekly aggregates
python -m ukmppr trends show       # Show trending themes
python -m ukmppr trends summary    # Weekly activity summary
```

## Docker Deployment

One-command deployment:
```bash
# Start all services (db + api + web)
docker compose up -d

# With Ollama for LLM extraction
docker compose --profile llm up -d

# Run ingestion in container
docker compose exec api python -m ukmppr ingest listings --limit 100 --pages 10
```

Build images individually:
```bash
# Backend
docker build -t ukmppr-api .

# Frontend
docker build -t ukmppr-web ./web
```

## Project Structure

```
src/ukmppr/
├── cli.py              # Typer CLI entrypoint
├── db.py               # SQLAlchemy engine
├── schema.py           # DDL for all tables
├── settings.py         # Pydantic settings
├── reddit_client.py    # Reddit API client
├── ingest_listings.py  # Post listing ingestion
├── ingest_threads.py   # Thread/comment fetching
├── score_signals.py    # Signal scoring
├── clustering.py       # BERTopic integration
├── trends.py           # Weekly aggregates
├── llm_extraction.py   # Ollama LLM extraction
├── api/
│   └── main.py         # FastAPI REST API
└── evaluation.py       # Test harness

web/                    # React frontend
├── src/
│   ├── pages/          # Dashboard, Themes, Signals, Posts
│   ├── components/     # Layout, shared components
│   └── lib/            # API client, utilities
└── Dockerfile          # Production nginx build

tests/
├── test_api.py         # API endpoint tests
└── test_llm_extraction.py  # LLM extraction tests

.github/workflows/
└── ci.yml              # GitHub Actions CI pipeline
```

## Data Model

| Table | Description |
|-------|-------------|
| `posts` | Silver: normalized post data |
| `comments` | Silver: flattened comment trees |
| `signals` | Gold: rule-based signal scores |
| `clusters` | Gold: BERTopic themes |
| `cluster_membership` | Gold: post→cluster mapping |
| `weekly_theme_stats` | Gold: trend aggregates |
| `intent_labels` | Gold: LLM-extracted intents & pain points |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/stats` | Dashboard statistics |
| `GET /api/themes` | List all themes |
| `GET /api/themes/{id}` | Theme detail with posts |
| `GET /api/signals` | High-signal items |
| `GET /api/posts` | Browse posts |
| `GET /api/posts/{id}` | Post detail with comments |
| `GET /api/trends/weekly` | Weekly aggregates |
| `GET /api/trends/themes` | Trending themes |

## GitHub Actions CI

The CI pipeline runs on push/PR to main:
- **lint-backend**: Ruff check + format
- **lint-frontend**: ESLint + TypeScript check
- **test-backend**: pytest with PostgreSQL service
- **build-backend**: Docker image build
- **build-frontend**: Docker image build

## Backfill Instructions

To backfill historical data:

```bash
# Pull maximum posts from different time ranges
python -m ukmppr ingest listings --limit 100 --pages 50

# Fetch threads for high-engagement posts
python -m ukmppr ingest threads --max-posts 200 --min-comments 5 --min-score 10

# Re-score all content
python -m ukmppr score signals --force

# Re-cluster with larger dataset
python -m ukmppr cluster run --limit 500

# Recompute trends
python -m ukmppr trends compute --weeks 52
```

## Notes
- Bronze raw JSON is stored under `data/bronze/`
- Reddit rate limits: ~60 requests/minute for unauthenticated
- Use `--force` flags to reprocess already-processed items
- Dashboard auto-refreshes on page load
