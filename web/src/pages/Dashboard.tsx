import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  TrendingUp,
  MessageCircle,
  Sparkles,
  Layers
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

// Large metric display - Apple style
function MetricCard({ 
  label, 
  value, 
  subtitle,
  trend,
}: { 
  label: string
  value: number | string
  subtitle?: string
  trend?: number
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
      <div className="flex items-baseline gap-3">
        <span className="text-4xl sm:text-5xl font-semibold tracking-tight tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {trend !== undefined && trend !== 0 && (
          <span className={`flex items-center gap-0.5 text-sm font-medium ${
            trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
          }`}>
            {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</p>
      )}
    </div>
  )
}

// Trending theme row - minimal
function ThemeRow({ 
  rank,
  label, 
  count, 
  growth,
  clusterId
}: { 
  rank: number
  label: string
  count: number
  growth: number | null
  clusterId: number
}) {
  const cleanLabel = label.replace(/^\d+_/, '').replace(/_/g, ' ')
  
  return (
    <Link 
      to={`/themes/${clusterId}`}
      className="list-item group"
    >
      <span className="w-6 text-sm font-medium text-[hsl(var(--muted-foreground))] tabular-nums">
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium capitalize truncate">{cleanLabel}</p>
      </div>
      <span className="text-sm text-[hsl(var(--muted-foreground))] tabular-nums">
        {count.toLocaleString()}
      </span>
      {growth !== null && (
        <span className={`text-sm font-medium w-16 text-right tabular-nums ${
          growth > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
          growth < 0 ? 'text-red-500' : 'text-[hsl(var(--muted-foreground))]'
        }`}>
          {growth > 0 ? '+' : ''}{growth.toFixed(0)}%
        </span>
      )}
      <ArrowUpRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  )
}

// Signal preview card
function SignalPreview({ 
  title, 
  score, 
  permalink,
  type
}: { 
  title: string
  score: number
  permalink: string
  type: string
}) {
  return (
    <a 
      href={permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="list-item group"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        score >= 0.8 ? 'bg-orange-100 dark:bg-orange-900/30' : 
        score >= 0.5 ? 'bg-amber-100 dark:bg-amber-900/30' : 
        'bg-[hsl(var(--muted))]'
      }`}>
        <span className={`text-sm font-semibold tabular-nums ${
          score >= 0.8 ? 'text-orange-600 dark:text-orange-400' : 
          score >= 0.5 ? 'text-amber-600 dark:text-amber-400' : 
          'text-[hsl(var(--muted-foreground))]'
        }`}>
          {score.toFixed(1)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </p>
        <p className="text-sm text-[hsl(var(--muted-foreground))] capitalize">{type}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </a>
  )
}

// Custom tooltip for chart
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[hsl(var(--card))] px-4 py-3 rounded-xl shadow-lg border border-[hsl(var(--border))]">
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{payload[0].value.toLocaleString()}</p>
    </div>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({ 
    queryKey: ['stats'], 
    queryFn: api.getStats 
  })
  const { data: trending } = useQuery({ 
    queryKey: ['trending'], 
    queryFn: () => api.getTrendingThemes(8) 
  })
  const { data: weekly } = useQuery({ 
    queryKey: ['weekly'], 
    queryFn: () => api.getWeeklySummary(12) 
  })
  const { data: signals } = useQuery({ 
    queryKey: ['signals'], 
    queryFn: () => api.getSignals(8, 0.5) 
  })

  const chartData = weekly?.slice().reverse().map(w => ({
    week: new Date(w.week).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    value: w.total_docs,
  })) || []

  return (
    <div className="space-y-16 animate-in">
      {/* Hero Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="display">
            Money Radar
          </h1>
          <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-2xl">
            An NLP-powered market research tool that discovers consumer pain points from UK personal finance discussions.
          </p>
        </div>

        {/* Project Overview Card */}
        <div className="card p-4 bg-emerald-500/5 border-emerald-500/20 max-w-3xl">
          <h3 className="font-medium mb-2">🎯 What is this?</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
            I built an end-to-end pipeline that scrapes Reddit's r/UKPersonalFinance, runs BERTopic clustering 
            to identify discussion themes, then uses a local LLM (Ollama + Qwen) to extract specific pain points 
            and frustrations. The goal: surface real product opportunities that fintechs might be missing.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="badge text-xs">Reddit PRAW API</span>
            <span className="badge text-xs">BERTopic Clustering</span>
            <span className="badge text-xs">Ollama/Qwen LLM</span>
            <span className="badge text-xs">PostgreSQL</span>
            <span className="badge text-xs">FastAPI + React</span>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            Live data from r/UKPersonalFinance
          </span>
        </div>
      </section>

      {/* Key Metrics */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <MetricCard 
            label="Discussions" 
            value={statsLoading ? '—' : stats?.posts || 0}
            subtitle="Total posts analysed"
          />
          <MetricCard 
            label="Responses" 
            value={statsLoading ? '—' : stats?.comments || 0}
            subtitle="Community comments"
          />
          <MetricCard 
            label="Signals" 
            value={statsLoading ? '—' : stats?.signals || 0}
            subtitle="Pain points detected"
          />
          <MetricCard 
            label="Themes" 
            value={statsLoading ? '—' : stats?.clusters || 0}
            subtitle="Topics clustered"
          />
        </div>
      </section>

      {/* Activity Chart */}
      <section className="card p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="section-title">Activity</h2>
            <p className="text-[hsl(var(--muted-foreground))] mt-1">Weekly discussion volume</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--muted))]">
            <TrendingUp className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <span className="text-sm font-medium">12 weeks</span>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
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
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--foreground))" 
                strokeWidth={2}
                fill="url(#gradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Two Column Layout */}
      <section className="grid lg:grid-cols-2 gap-8">
        {/* Trending Themes */}
        <div className="card p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center">
                <Layers className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Trending Themes</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Top discussion topics</p>
              </div>
            </div>
            <Link 
              to="/themes" 
              className="text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-1 stagger-children">
            {trending?.slice(0, 6).map((theme, i) => (
              <ThemeRow
                key={theme.cluster_id}
                rank={i + 1}
                label={theme.label}
                count={theme.total_docs}
                growth={theme.avg_growth}
                clusterId={theme.cluster_id}
              />
            ))}
          </div>
        </div>

        {/* Top Signals */}
        <div className="card p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Pain Points</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">High-signal discussions</p>
              </div>
            </div>
            <Link 
              to="/signals" 
              className="text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-1 stagger-children">
            {signals?.slice(0, 5).map((signal) => (
              <SignalPreview
                key={signal.content_id}
                title={signal.title}
                score={signal.signal_score}
                permalink={signal.permalink}
                type={signal.content_type}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Insight Banner */}
      <section className="card p-8 bg-gradient-to-br from-[hsl(var(--muted))] to-[hsl(var(--background))]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--foreground))] flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-[hsl(var(--background))]" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Discover Opportunities</h3>
              <p className="text-[hsl(var(--muted-foreground))]">
                Browse themes to find underserved pain points
              </p>
            </div>
          </div>
          <Link 
            to="/themes"
            className="btn btn-primary"
          >
            Explore Themes
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
