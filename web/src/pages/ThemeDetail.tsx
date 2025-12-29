import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  ExternalLink, 
  MessageSquare, 
  ArrowUp,
  Layers,
  TrendingUp
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { api } from '../lib/api'

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[hsl(var(--card))] px-4 py-3 rounded-xl shadow-lg border border-[hsl(var(--border))]">
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{payload[0].value} posts</p>
    </div>
  )
}

export default function ThemeDetail() {
  const { id } = useParams()
  const clusterId = parseInt(id || '0', 10)
  
  const { data: theme, isLoading } = useQuery({
    queryKey: ['theme', clusterId],
    queryFn: () => api.getTheme(clusterId),
    enabled: !isNaN(clusterId),
  })

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in">
        <div className="h-6 w-32 bg-[hsl(var(--muted))] rounded-lg animate-pulse" />
        <div className="space-y-2">
          <div className="h-12 w-64 bg-[hsl(var(--muted))] rounded-lg animate-pulse" />
          <div className="h-6 w-48 bg-[hsl(var(--muted))] rounded-lg animate-pulse" />
        </div>
        <div className="card p-8 animate-pulse">
          <div className="h-48 bg-[hsl(var(--muted))] rounded-lg" />
        </div>
      </div>
    )
  }

  if (!theme) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mx-auto mb-6">
          <Layers className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
        </div>
        <h2 className="font-semibold text-xl mb-2">Theme not found</h2>
        <p className="text-[hsl(var(--muted-foreground))] mb-6">
          This theme may have been removed or doesn't exist.
        </p>
        <Link to="/themes" className="btn btn-primary">
          Back to themes
        </Link>
      </div>
    )
  }

  const cleanLabel = theme.label.replace(/^\d+_/, '').replace(/_/g, ' ')
  
  const chartData = theme.timeseries?.map(t => ({
    week: new Date(t.week).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    docs: t.docs,
  })) || []

  // Calculate growth from timeseries
  const recentWeeks = theme.timeseries?.slice(-4) || []
  const previousWeeks = theme.timeseries?.slice(-8, -4) || []
  const recentAvg = recentWeeks.length ? recentWeeks.reduce((s, w) => s + w.docs, 0) / recentWeeks.length : 0
  const prevAvg = previousWeeks.length ? previousWeeks.reduce((s, w) => s + w.docs, 0) / previousWeeks.length : 0
  const growth = prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg * 100) : 0

  return (
    <div className="space-y-12 animate-in">
      {/* Back button */}
      <Link 
        to="/themes" 
        className="inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All themes
      </Link>

      {/* Header */}
      <section className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center">
            <Layers className="w-7 h-7 text-[hsl(var(--muted-foreground))]" />
          </div>
          <div className="flex-1">
            <h1 className="display capitalize">{cleanLabel}</h1>
            <p className="text-xl text-[hsl(var(--muted-foreground))]">
              {theme.doc_count.toLocaleString()} posts discussing this topic
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="flex gap-12">
        <div>
          <p className="text-4xl font-semibold tracking-tight tabular-nums">
            {theme.doc_count.toLocaleString()}
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Total posts</p>
        </div>
        <div>
          <p className="text-4xl font-semibold tracking-tight tabular-nums">
            {theme.top_terms.length}
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Key terms</p>
        </div>
        {growth !== 0 && (
          <div>
            <p className={`text-4xl font-semibold tracking-tight tabular-nums ${
              growth > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
            }`}>
              {growth > 0 ? '+' : ''}{growth.toFixed(0)}%
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">4-week trend</p>
          </div>
        )}
      </section>

      {/* Key terms */}
      <section className="card p-8">
        <h2 className="section-title mb-6">Key Terms</h2>
        <div className="flex flex-wrap gap-2">
          {theme.top_terms.map((term, i) => (
            <span 
              key={term}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                i < 3 
                  ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))]' 
                  : 'badge'
              }`}
            >
              {term}
            </span>
          ))}
        </div>
      </section>

      {/* Weekly trend chart */}
      {chartData.length > 0 && (
        <section className="card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title">Activity Trend</h2>
              <p className="text-[hsl(var(--muted-foreground))] mt-1">Weekly discussion volume</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--muted))]">
              <TrendingUp className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <span className="text-sm font-medium">{chartData.length} weeks</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="themeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.1}/>
                    <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="week" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="docs" 
                  stroke="hsl(var(--foreground))" 
                  strokeWidth={2}
                  fill="url(#themeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Posts list */}
      <section className="card p-8">
        <h2 className="section-title mb-6">
          Posts 
          <span className="text-[hsl(var(--muted-foreground))] font-normal ml-2">
            {theme.posts.length}
          </span>
        </h2>
        <div className="space-y-1 stagger-children">
          {theme.posts.map((post) => (
            <a
              key={post.post_id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="list-item group"
            >
              <div className="flex flex-col items-center gap-0.5 text-[hsl(var(--muted-foreground))] min-w-[48px]">
                <ArrowUp className="w-4 h-4" />
                <span className="text-sm font-semibold tabular-nums">{post.score}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {post.title}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {post.num_comments}
                  </span>
                  {post.created_utc && (
                    <span>
                      {new Date(post.created_utc).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
