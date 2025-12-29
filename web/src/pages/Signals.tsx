import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Sparkles,
  CircleDot,
  ArrowUpRight
} from 'lucide-react'
import { api } from '../lib/api'

const FILTERS = [
  { key: 'all', label: 'All Signals' },
  { key: 'questions', label: 'Questions' },
  { key: 'recommendations', label: 'Seeking Advice' },
  { key: 'cost', label: 'Cost Related' },
  { key: 'platform', label: 'Platform' },
]

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 0.8 
    ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' 
    : score >= 0.5 
      ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'

  return (
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <span className="text-sm font-semibold tabular-nums">{score.toFixed(1)}</span>
    </div>
  )
}

export default function Signals() {
  const [minScore, setMinScore] = useState(0)
  const [activeFilter, setActiveFilter] = useState('all')
  
  const { data: signals, isLoading } = useQuery({
    queryKey: ['signals', minScore],
    queryFn: () => api.getSignals(100, minScore),
  })

  const filteredSignals = signals?.filter(s => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'questions') return s.is_question === true
    if (activeFilter === 'recommendations') return s.asks_recommendation === true
    if (activeFilter === 'cost') return s.mentions_cost === true
    if (activeFilter === 'platform') return s.mentions_platform === true
    return true
  })

  // Calculate filter counts
  const filterCounts = {
    all: signals?.length ?? 0,
    questions: signals?.filter(s => s.is_question === true).length ?? 0,
    recommendations: signals?.filter(s => s.asks_recommendation === true).length ?? 0,
    cost: signals?.filter(s => s.mentions_cost === true).length ?? 0,
    platform: signals?.filter(s => s.mentions_platform === true).length ?? 0,
  }

  const highSignalCount = signals?.filter(s => s.signal_score >= 0.8).length ?? 0

  return (
    <div className="space-y-12 animate-in">
      {/* Header */}
      <section className="space-y-4">
        <h1 className="display">Signals</h1>
        <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-2xl">
          Content scored by pain point indicators. Higher scores mean stronger 
          problem signals worth exploring.
        </p>
      </section>

      {/* Stats */}
      <section className="flex gap-12">
        <div>
          <p className="text-4xl font-semibold tracking-tight tabular-nums">
            {signals?.length.toLocaleString() ?? '—'}
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Total signals</p>
        </div>
        <div>
          <p className="text-4xl font-semibold tracking-tight tabular-nums text-orange-600 dark:text-orange-400">
            {highSignalCount}
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">High signal (0.8+)</p>
        </div>
        <div>
          <p className="text-4xl font-semibold tracking-tight tabular-nums">
            {signals?.length ? (signals.reduce((sum, s) => sum + s.signal_score, 0) / signals.length).toFixed(2) : '—'}
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Average score</p>
        </div>
      </section>

      {/* Filters */}
      <section className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === key
                    ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))]'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted)/0.7)]'
                }`}
              >
                {label}
                <span className="ml-1.5 tabular-nums opacity-60">
                  {filterCounts[key as keyof typeof filterCounts]}
                </span>
              </button>
            ))}
          </div>
          
          {/* Score slider */}
          <div className="flex items-center gap-4 lg:ml-auto">
            <span className="text-sm text-[hsl(var(--muted-foreground))]">Min score</span>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[hsl(var(--muted))]">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={minScore}
                onChange={(e) => setMinScore(parseFloat(e.target.value))}
                className="w-24 accent-[hsl(var(--foreground))] h-1"
              />
              <span className="text-sm font-semibold tabular-nums w-8">{minScore.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Results count */}
      <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
        <CircleDot className="w-4 h-4" />
        <span>Showing {filteredSignals?.length ?? 0} results</span>
      </div>

      {/* Signals list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--muted))]" />
                <div className="flex-1">
                  <div className="h-5 w-3/4 bg-[hsl(var(--muted))] rounded mb-2" />
                  <div className="h-4 w-1/4 bg-[hsl(var(--muted))] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {filteredSignals?.map((signal) => (
            <a
              key={signal.content_id}
              href={signal.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="list-item p-5 bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] group"
            >
              <ScoreBadge score={signal.signal_score} />

              <div className="flex-1 min-w-0">
                <h3 className="font-medium line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {signal.title}
                </h3>
                
                <div className="flex items-center gap-3 mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  <span className="capitalize">{signal.content_type}</span>
                  {signal.reddit_score !== null && (
                    <>
                      <span>•</span>
                      <span className="tabular-nums">↑ {signal.reddit_score}</span>
                    </>
                  )}
                  <span>•</span>
                  <div className="flex gap-1.5">
                    {signal.is_question && <span className="badge">Question</span>}
                    {signal.asks_recommendation && <span className="badge">Advice</span>}
                    {signal.mentions_cost && <span className="badge">Cost</span>}
                    {signal.mentions_platform && <span className="badge">Platform</span>}
                  </div>
                </div>
              </div>

              <ArrowUpRight className="w-5 h-5 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </a>
          ))}
        </div>
      )}

      {filteredSignals?.length === 0 && !isLoading && (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
          </div>
          <h3 className="font-semibold text-xl mb-2">No signals found</h3>
          <p className="text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
            Try adjusting the filters or lowering the minimum score threshold.
          </p>
        </div>
      )}
    </div>
  )
}
