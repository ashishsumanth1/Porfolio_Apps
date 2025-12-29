import { Link } from 'react-router-dom'
import { 
  GraduationCap, 
  Briefcase, 
  Users, 
  TrendingUp,
  MapPin,
  ArrowRight,
  BarChart3,
  PieChart,
  Activity,
  Search
} from 'lucide-react'

const KEY_INSIGHTS = [
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: '56% Level 4+ Employed',
    description: 'Over half of employed individuals hold Level 4 qualifications or higher (degree, HND, professional qualifications)',
    color: 'text-blue-500'
  },
  {
    icon: <Briefcase className="w-6 h-6" />,
    title: '32% Qualification Mismatch',
    description: 'Nearly a third of Level 4 graduates work in roles below their qualification level',
    color: 'text-amber-500'
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: '3 Distinct Clusters',
    description: 'K-Means clustering reveals three employment patterns: High-Performing, Developing, and Challenged wards',
    color: 'text-emerald-500'
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: '93% vs 68% Employment',
    description: 'High-performing wards show 25% higher employment rates than low-performing counterparts',
    color: 'text-purple-500'
  }
]

const ANALYSIS_SECTIONS = [
  {
    id: 'correlations',
    title: 'Qualification-Occupation Correlations',
    description: 'Explore the relationship between educational qualifications and job types across UK electoral wards',
    icon: <BarChart3 className="w-8 h-8" />,
    path: '/projects/census-2021/correlations',
    metrics: ['Correlation Matrix', 'Scatter Analysis', 'Top Wards']
  },
  {
    id: 'employment',
    title: 'Employment Rate Analysis',
    description: 'Compare employment rates between high and low performing wards based on qualifications',
    icon: <PieChart className="w-8 h-8" />,
    path: '/projects/census-2021/employment',
    metrics: ['Ward Comparison', 'Qualification Impact', 'Demand-Supply Gap']
  },
  {
    id: 'demographics',
    title: 'Age Demographics',
    description: 'Analyse how age distribution affects employment patterns across different ward types',
    icon: <Activity className="w-8 h-8" />,
    path: '/projects/census-2021/demographics',
    metrics: ['Age Distribution', 'Working Age', 'Retirement Trends']
  },
  {
    id: 'wards',
    title: 'Ward Explorer',
    description: 'Search and explore employment vs qualification data for any specific UK electoral ward',
    icon: <Search className="w-8 h-8" />,
    path: '/projects/census-2021/wards',
    metrics: ['Individual Ward Data', 'National Comparison', 'Detailed Breakdown']
  }
]

const STATS = [
  { label: 'Electoral Wards', value: '8,441', icon: <MapPin className="w-5 h-5" /> },
  { label: 'Qualification Levels', value: '8', icon: <GraduationCap className="w-5 h-5" /> },
  { label: 'Occupation Categories', value: '10', icon: <Briefcase className="w-5 h-5" /> },
  { label: 'Data Points', value: '1.2M+', icon: <BarChart3 className="w-5 h-5" /> }
]

export default function CensusDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold mb-3">Census 2021 Analysis</h1>
        <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-3xl mb-4">
          Does higher education actually lead to better employment? This project analyses the UK Census 2021 
          to investigate the relationship between qualifications and job outcomes across England's electoral wards.
        </p>
        <div className="card p-4 bg-blue-500/5 border-blue-500/20 max-w-3xl">
          <h3 className="font-medium mb-2">📊 Project Overview</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
            Using official ONS Census 2021 data, I processed 1.2M+ data points covering qualification levels, 
            occupation categories, and economic activity status for 7,638 electoral wards. The analysis applies 
            K-Means clustering to identify patterns and reveals surprising findings about qualification-job mismatches.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="badge text-xs">Data Source: ONS Census 2021</span>
            <span className="badge text-xs">Masters Dissertation Project</span>
            <span className="badge text-xs">Python + React</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-[hsl(var(--muted-foreground))]">{stat.icon}</div>
              <span className="text-sm text-[hsl(var(--muted-foreground))]">{stat.label}</span>
            </div>
            <p className="text-3xl font-semibold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Key Insights */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Key Insights</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {KEY_INSIGHTS.map((insight, index) => (
            <div key={index} className="card p-6">
              <div className="flex items-start gap-4">
                <div className={`${insight.color} mt-1`}>{insight.icon}</div>
                <div>
                  <h3 className="font-semibold mb-1">{insight.title}</h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Analysis Sections */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Explore the Data</h2>
        <div className="grid lg:grid-cols-3 gap-6">
          {ANALYSIS_SECTIONS.map((section) => (
            <Link 
              key={section.id} 
              to={section.path}
              className="card p-6 group hover:border-blue-500/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-4">
                {section.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {section.title}
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                {section.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {section.metrics.map((metric) => (
                  <span key={metric} className="badge text-xs">{metric}</span>
                ))}
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                <span>View Analysis</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Data Sources */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold mb-3">Data Sources</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-1">Office for National Statistics (ONS)</h4>
            <p className="text-[hsl(var(--muted-foreground))]">
              Census 2021 data for England and Wales, covering qualifications, occupations, 
              economic activity, and age demographics at electoral ward level.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Analysis Methodology</h4>
            <p className="text-[hsl(var(--muted-foreground))]">
              Data processed with Python (Pandas, NumPy), visualised with Plotly and Recharts, 
              ML clustering performed using Scikit-learn's K-Means algorithm.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
