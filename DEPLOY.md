# Deploying UK Money Pain Point Radar to Railway

## Quick Deploy Steps

### 1. Create Railway Account & Project
1. Go to [railway.app](https://railway.app) and sign up (free with GitHub)
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub account and select this repo

### 2. Add PostgreSQL Database
1. In your Railway project, click "+ New" → "Database" → "PostgreSQL"
2. Wait for it to provision
3. Click on the database → "Connect" → Copy the `DATABASE_URL`

### 3. Import Your Data
After PostgreSQL is created, restore your data:

```bash
# Get your Railway DATABASE_URL from the dashboard
export DATABASE_URL="postgresql://..."

# Restore the backup (run from project root)
pg_restore --no-owner --no-privileges -d "$DATABASE_URL" data/export/ukmppr_backup.dump
```

### 4. Configure Environment Variables
In Railway, go to your web service → Variables → Add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | (auto-linked from PostgreSQL service) |
| `GROQ_API_KEY` | Your Groq API key |
| `LLM_PROVIDER` | `groq` |
| `PORT` | `8000` |

### 5. Deploy
Railway will auto-deploy when you push to GitHub. The app will:
- Build the React frontend
- Build the Python backend
- Serve both from a single container

### 6. Access Your App
After deployment, Railway provides a URL like:
`https://your-app.up.railway.app`

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `GROQ_API_KEY` | For LLM | Groq API key for extractions |
| `LLM_PROVIDER` | No | `groq` or `ollama` (default: groq) |
| `PORT` | No | Server port (Railway sets this) |

## Cost Estimate
- **Railway Free Tier**: $5 credit/month
  - Usually enough for a portfolio app with moderate traffic
  - PostgreSQL included
  
## Troubleshooting

### Database Connection Failed
- Check DATABASE_URL is correctly linked to PostgreSQL service
- Ensure database has been restored with data

### 502 Bad Gateway
- Check deployment logs in Railway dashboard
- Verify PORT environment variable is set

### LLM Extraction Not Working
- Verify GROQ_API_KEY is set correctly
- Check Groq dashboard for rate limits
