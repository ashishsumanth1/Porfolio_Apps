const API_BASE = '/api'

export interface Stats {
  posts: number
  comments: number
  signals: number
  clusters: number
}

export interface Theme {
  cluster_id: number
  label: string
  top_terms: string[]
  doc_count: number
}

export interface ThemeDetail extends Theme {
  posts: {
    post_id: string
    title: string
    permalink: string
    score: number
    num_comments: number
    created_utc: string | null
  }[]
  timeseries: {
    week: string
    docs: number
    signal_sum: number
    avg_score: number | null
    growth_pct: number | null
  }[]
}

export interface Signal {
  content_id: string
  content_type: string
  signal_score: number
  title: string
  permalink: string
  is_question: boolean
  asks_recommendation: boolean
  mentions_cost: boolean
  mentions_platform: boolean
  reddit_score: number | null
  created_at: string | null
}

export interface TrendingTheme {
  cluster_id: number
  label: string
  total_docs: number
  avg_signal: number
  avg_growth: number | null
  trend_score: number
}

export interface WeeklySummary {
  week: string
  active_themes: number
  total_docs: number
  total_signal: number
  avg_reddit_score: number | null
}

export interface Post {
  content_id: string
  content_type: string
  title: string
  body: string | null
  permalink: string
  reddit_score: number | null
  comment_count: number
  created_utc: number
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

interface PostsParams {
  limit?: number
  sort_by?: 'created_utc' | 'reddit_score' | 'comment_count'
  order?: 'asc' | 'desc'
}

export const api = {
  getStats: () => fetchJSON<Stats>(`${API_BASE}/stats`),
  getThemes: () => fetchJSON<Theme[]>(`${API_BASE}/themes`),
  getTheme: (id: number) => fetchJSON<ThemeDetail>(`${API_BASE}/themes/${id}`),
  getSignals: (limit = 50, minScore = 0) => 
    fetchJSON<Signal[]>(`${API_BASE}/signals?limit=${limit}&min_score=${minScore}`),
  getTrendingThemes: (weeks = 4) => 
    fetchJSON<TrendingTheme[]>(`${API_BASE}/trends/themes?weeks=${weeks}`),
  getWeeklySummary: (weeks = 8) => 
    fetchJSON<WeeklySummary[]>(`${API_BASE}/trends/weekly?weeks=${weeks}`),
  getPosts: (params: PostsParams = {}) => {
    const { limit = 30, sort_by = 'created_utc', order = 'desc' } = params
    return fetchJSON<Post[]>(`${API_BASE}/posts?limit=${limit}&sort_by=${sort_by}&order=${order}`)
  },
}
