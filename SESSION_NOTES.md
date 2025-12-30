# Session Notes

A running log of development sessions and key decisions for the Portfolio project.

---

## Session: 30 December 2025

### Project Overview Recap

**Portfolio Application** - A full-stack portfolio website hosting two main data science projects.

#### Project 1: UK Money Pain Point Radar (UKMPPR)
An NLP-powered market research tool that discovers consumer pain points from UK personal finance discussions.

**What it does:**
- Scrapes Reddit (r/UKPersonalFinance) - 28K+ posts/comments collected
- Clusters discussions using BERTopic + HDBSCAN → discovered 26 consumer pain point themes
- Extracts pain points using local LLM (Ollama + Llama 3.2/Qwen) - zero API cost
- Serves insights via FastAPI REST API + React dashboard

**Key CLI commands:**
```bash
python -m ukmppr db init           # Create/migrate tables
python -m ukmppr ingest listings   # Pull post listings
python -m ukmppr ingest threads    # Fetch full threads with comments
python -m ukmppr score signals     # Compute signal scores
python -m ukmppr cluster run       # Run BERTopic clustering
python -m ukmppr extract run       # Extract intents/pain points via Ollama
python -m ukmppr trends compute    # Compute weekly aggregates
```

#### Project 2: Census 2021 Analysis
- UK demographic data visualization
- 7,638 electoral wards with population, employment rate, qualification levels
- Correlation analysis, employment trends, ward explorer

---

### Tech Stack Summary

| Layer | Tech |
|-------|------|
| **Backend** | Python, FastAPI, PostgreSQL (pgvector), SQLAlchemy |
| **ML/NLP** | BERTopic, sentence-transformers, Ollama LLM |
| **Frontend** | React, TypeScript, Vite, TailwindCSS, TanStack Query, Recharts |
| **Infra** | Docker, Docker Compose, GitHub Actions CI/CD |

---

### Routes

| Path | Description |
|------|-------------|
| `/` | Portfolio home |
| `/projects/money-radar` | Money Radar dashboard |
| `/projects/money-radar/themes` | Topic clusters |
| `/projects/money-radar/signals` | Pain point signals |
| `/projects/money-radar/posts` | Post browser |
| `/projects/census-2021` | Census dashboard |
| `/projects/census-2021/correlations` | Correlation analysis |
| `/projects/census-2021/employment` | Employment data |
| `/projects/census-2021/demographics` | Demographics |
| `/projects/census-2021/wards` | Ward explorer |

---

### API Endpoints (Money Radar)

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/stats` | Dashboard statistics |
| `GET /api/themes` | List all themes |
| `GET /api/themes/{id}` | Theme detail with posts |
| `GET /api/signals` | High-signal items |
| `GET /api/posts` | Browse posts |
| `GET /api/trends/weekly` | Weekly aggregates |
| `GET /api/trends/themes` | Trending themes |

---

### Notes from This Session
- Reviewed full project architecture
- Created this SESSION_NOTES.md for future reference

---

## Future Sessions

<!-- Add new sessions below this line -->
