import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Layers, 
  Sparkles, 
  FileText, 
  Moon, 
  Sun,
  Menu,
  X,
  ArrowLeft,
  TrendingUp,
  BarChart3
} from 'lucide-react'

interface NavItem {
  name: string
  path: string
}

interface LayoutProps {
  projectName?: string
  basePath?: string
  navItems?: NavItem[]
}

// Default Money Radar nav items
const defaultNavItems = [
  { name: 'Overview', path: '' },
  { name: 'Themes', path: '/themes' },
  { name: 'Signals', path: '/signals' },
  { name: 'Posts', path: '/posts' },
]

// Icons for nav items
const navIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Overview': LayoutDashboard,
  'Themes': Layers,
  'Signals': Sparkles,
  'Posts': FileText,
  'Correlations': BarChart3,
  'Employment': TrendingUp,
  'Demographics': LayoutDashboard,
}

export default function Layout({ projectName = 'Money Radar', basePath = '', navItems }: LayoutProps) {
  // Use provided navItems or default ones
  const items = navItems || defaultNavItems.map(item => ({
    name: item.name,
    path: item.path ? `${basePath}${item.path}` : basePath || '/'
  }))

  // Determine if this is the Census project based on the project name
  const isCensusProject = projectName.includes('Census')

  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    return false
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const prevPathRef = useRef(location.pathname)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      setMobileMenuOpen(false)
      prevPathRef.current = location.pathname
    }
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal top navbar */}
      <header className="sticky top-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Back to portfolio + Logo */}
            <div className="flex items-center gap-4">
              {basePath && (
                <Link 
                  to="/"
                  className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Portfolio</span>
                </Link>
              )}
              <NavLink to={basePath || '/'} className="flex items-center gap-3 group">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${isCensusProject ? 'from-blue-500 to-indigo-600' : 'from-emerald-500 to-teal-600'} flex items-center justify-center transition-transform group-hover:scale-105`}>
                  {isCensusProject ? (
                    <BarChart3 className="w-4 h-4 text-white" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="font-semibold text-lg tracking-tight hidden sm:block">
                  {projectName}
                </span>
              </NavLink>
            </div>

            {/* Desktop nav - pill style */}
            <nav className="hidden md:flex items-center p-1 rounded-full bg-[hsl(var(--muted))]">
              {items.map(({ name, path }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === basePath || path === '/'}
                  className={({ isActive }) =>
                    `px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm'
                        : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                    }`
                  }
                >
                  {name}
                </NavLink>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDark(!dark)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[hsl(var(--muted))] transition-colors"
                aria-label="Toggle theme"
              >
                {dark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-[hsl(var(--muted))] transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu - slide down */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
            mobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="px-6 pb-6 space-y-1">
            {basePath && (
              <Link
                to="/"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Portfolio
              </Link>
            )}
            {items.map(({ name, path }) => {
              const Icon = navIcons[name] || LayoutDashboard
              return (
                <NavLink
                  key={path}
                  to={path}
                  end={path === basePath || path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))]'
                        : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  {name}
                </NavLink>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main content with nice padding */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <Outlet />
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[hsl(var(--muted-foreground))]">
            <p>
              {isCensusProject ? 'UK Census 2021 Data Analysis' : 'Insights from r/UKPersonalFinance'}
            </p>
            <p className="font-medium">
              {isCensusProject ? 'Data sourced from ONS' : 'Not financial advice'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
