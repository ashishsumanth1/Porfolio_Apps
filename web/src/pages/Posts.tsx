import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  MessageSquare, 
  ExternalLink, 
  ArrowUp,
  Calendar,
  ChevronDown,
  Search,
  FileText
} from 'lucide-react'
import { api } from '../lib/api'

type SortField = 'created_utc' | 'reddit_score' | 'comment_count'
type SortOrder = 'asc' | 'desc'

export default function Posts() {
  const [sortBy, setSortBy] = useState<SortField>('created_utc')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [search, setSearch] = useState('')
  
  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', sortBy, sortOrder],
    queryFn: () => api.getPosts({ limit: 100, sort_by: sortBy, order: sortOrder }),
  })

  const filteredPosts = posts?.filter(p => 
    search === '' || 
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-12 animate-in">
      {/* Header */}
      <section className="space-y-4">
        <h1 className="display">Posts</h1>
        <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-2xl">
          Browse all collected discussions from r/UKPersonalFinance. 
          Search and sort to find specific topics.
        </p>
      </section>

      {/* Stats */}
      <section className="flex gap-12">
        <div>
          <p className="text-4xl font-semibold tracking-tight tabular-nums">
            {posts?.length.toLocaleString() ?? '—'}
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Total posts</p>
        </div>
        <div>
          <p className="text-4xl font-semibold tracking-tight tabular-nums">
            {filteredPosts?.length.toLocaleString() ?? '—'}
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Showing</p>
        </div>
      </section>

      {/* Search & Sort */}
      <section className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-full bg-[hsl(var(--muted))] border-0 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--foreground)/0.2)] transition-all text-sm"
          />
        </div>

        <div className="flex gap-2">
          <SortButton 
            label="Date" 
            active={sortBy === 'created_utc'} 
            order={sortBy === 'created_utc' ? sortOrder : null}
            onClick={() => handleSort('created_utc')}
          />
          <SortButton 
            label="Score" 
            active={sortBy === 'reddit_score'} 
            order={sortBy === 'reddit_score' ? sortOrder : null}
            onClick={() => handleSort('reddit_score')}
          />
          <SortButton 
            label="Comments" 
            active={sortBy === 'comment_count'} 
            order={sortBy === 'comment_count' ? sortOrder : null}
            onClick={() => handleSort('comment_count')}
          />
        </div>
      </section>

      {/* Posts list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
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
          {filteredPosts?.map((post) => (
            <a
              key={post.content_id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="list-item p-5 bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] group"
            >
              {/* Vote score */}
              <div className="w-12 h-12 rounded-xl bg-[hsl(var(--muted))] flex flex-col items-center justify-center shrink-0">
                <ArrowUp className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <span className="text-sm font-semibold tabular-nums">{post.reddit_score ?? 0}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                  {post.title}
                </h3>
                
                <div className="flex items-center gap-3 mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(post.created_utc)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {post.comment_count}
                  </span>
                  <span className="badge capitalize">
                    {post.content_type}
                  </span>
                </div>
              </div>

              <ExternalLink className="w-5 h-5 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </a>
          ))}
        </div>
      )}

      {filteredPosts?.length === 0 && !isLoading && (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
          </div>
          <h3 className="font-semibold text-xl mb-2">No posts found</h3>
          <p className="text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
            Try a different search term or clear your filters.
          </p>
        </div>
      )}
    </div>
  )
}

function SortButton({ 
  label, 
  active, 
  order, 
  onClick, 
}: { 
  label: string
  active: boolean
  order: SortOrder | null
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
        active
          ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))]'
          : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted)/0.7)]'
      }`}
    >
      {label}
      {active && (
        <ChevronDown className={`w-4 h-4 transition-transform ${order === 'asc' ? 'rotate-180' : ''}`} />
      )}
    </button>
  )
}
