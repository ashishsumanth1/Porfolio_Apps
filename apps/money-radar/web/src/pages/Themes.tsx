import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowUpRight, TrendingUp, Layers } from 'lucide-react'
import { api } from '../lib/api'

export default function Themes() {
  const { data: themes, isLoading } = useQuery({ 
    queryKey: ['themes'], 
    queryFn: api.getThemes 
  })
  const { data: trending } = useQuery({ 
    queryKey: ['trending'], 
    queryFn: () => api.getTrendingThemes(50) 
  })

  const trendingMap = new Map(trending?.map(t => [t.cluster_id, t]) || [])

  // Sort themes by doc count
  const sortedThemes = themes?.slice().sort((a, b) => b.doc_count - a.doc_count)

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in">
        <div className="space-y-2">
          <div className="h-12 w-48 bg-[hsl(var(--muted))] rounded-lg animate-pulse" />
          <div className="h-6 w-96 bg-[hsl(var(--muted))] rounded-lg animate-pulse" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 w-32 bg-[hsl(var(--muted))] rounded mb-4" />
              <div className="h-4 w-full bg-[hsl(var(--muted))] rounded mb-2" />
              <div className="h-4 w-3/4 bg-[hsl(var(--muted))] rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in">
      {/* Header */}
      <section className="space-y-4">
        <h1 className="display">Themes</h1>
        <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-2xl">
          {themes?.length || 0} AI-discovered topic clusters from community discussions.
          Explore each theme to understand specific pain points.
        </p>
      </section>

      {/* Stats row */}
      <section className="flex gap-12">
        <div>
          <p className="text-4xl font-semibold tracking-tight tabular-nums">
            {themes?.reduce((sum, t) => sum + t.doc_count, 0).toLocaleString()}
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Total posts</p>
        </div>
        <div>
          <p className="text-4xl font-semibold tracking-tight tabular-nums">
            {themes?.length}
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Themes</p>
        </div>
        <div>
          <p className="text-4xl font-semibold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
            {trending?.filter(t => t.avg_growth && t.avg_growth > 0).length || 0}
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Growing</p>
        </div>
      </section>

      {/* Theme grid */}
      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {sortedThemes?.map((theme) => {
          const trend = trendingMap.get(theme.cluster_id)
          const cleanLabel = theme.label.replace(/^\d+_/, '').replace(/_/g, ' ')
          
          return (
            <Link 
              key={theme.cluster_id}
              to={`/themes/${theme.cluster_id}`}
              className="card p-6 group hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center group-hover:bg-[hsl(var(--foreground))] transition-colors">
                  <Layers className="w-5 h-5 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--background))] transition-colors" />
                </div>
                {trend?.avg_growth !== null && trend?.avg_growth !== undefined && (
                  <div className={`flex items-center gap-1 text-sm font-medium tabular-nums ${
                    trend.avg_growth > 0 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : trend.avg_growth < 0 
                        ? 'text-red-500'
                        : 'text-[hsl(var(--muted-foreground))]'
                  }`}>
                    {trend.avg_growth > 0 && <TrendingUp className="w-4 h-4" />}
                    {trend.avg_growth > 0 ? '+' : ''}{trend.avg_growth.toFixed(0)}%
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-lg capitalize mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {cleanLabel}
              </h3>
              
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                {theme.doc_count.toLocaleString()} posts
              </p>

              {/* Top terms */}
              <div className="flex flex-wrap gap-1.5">
                {theme.top_terms.slice(0, 4).map((term) => (
                  <span 
                    key={term}
                    className="badge"
                  >
                    {term}
                  </span>
                ))}
                {theme.top_terms.length > 4 && (
                  <span className="badge">
                    +{theme.top_terms.length - 4}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))] mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View details</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </Link>
          )
        })}
      </section>

      {themes?.length === 0 && (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mx-auto mb-6">
            <Layers className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
          </div>
          <h3 className="font-semibold text-xl mb-2">No themes discovered</h3>
          <p className="text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
            Run clustering to automatically discover topic themes from collected posts.
          </p>
        </div>
      )}
    </div>
  )
}
