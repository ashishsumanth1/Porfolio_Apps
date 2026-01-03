import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowUpRight, 
  TrendingUp, 
  Code2, 
  Sparkles,
  Github,
  Linkedin,
  Mail,
  BarChart3,
  Briefcase,
  GraduationCap,
  Moon,
  Sun
} from 'lucide-react'

interface Project {
  id: string
  title: string
  description: string
  tags: string[]
  status: 'live' | 'coming-soon'
  path: string
  externalUrl?: string
  gradient: string
  icon: React.ReactNode
  metrics?: { label: string; value: string }[]
}

const PROJECTS: Project[] = [
  {
    id: 'resume-council',
    title: 'Resume Council',
    description: 'A private LLM council that tailors resumes to a role description, runs peer ranking, and exports a polished DOCX. Built for fast, high-quality resume iterations with traceable model feedback.',
    tags: ['FastAPI', 'React', 'OpenRouter', 'LLM', 'DOCX'],
    status: 'live',
    path: '/projects/resume-council',
    externalUrl: 'https://frontend-production-7332.up.railway.app',
    gradient: 'from-blue-500 to-indigo-600',
    icon: <Briefcase className="w-8 h-8" />,
    metrics: [
      { label: 'Stages', value: '3' },
      { label: 'Export', value: 'DOCX' },
      { label: 'Mode', value: 'Private' }
    ]
  },
  {
    id: 'money-radar',
    title: 'Money Radar',
    description: 'An end-to-end NLP pipeline that scrapes 28K+ posts from r/UKPersonalFinance, identifies consumer pain points using BERTopic clustering and local LLMs (Ollama/Qwen), and surfaces actionable product opportunities. Built as a market research tool to help fintechs understand what UK consumers struggle with—from mortgage stress to HMRC confusion.',
    tags: ['Python', 'FastAPI', 'React', 'PostgreSQL', 'BERTopic', 'Ollama', 'LLM'],
    status: 'live',
    path: '/projects/money-radar',
    gradient: 'from-emerald-500 to-teal-600',
    icon: <TrendingUp className="w-8 h-8" />,
    metrics: [
      { label: 'Pain Points', value: '12.6K' },
      { label: 'Themes', value: '26' },
      { label: 'Posts Analysed', value: '28K+' }
    ]
  },
  {
    id: 'census-2021',
    title: 'Census 2021 Analysis',
    description: 'A data science exploration of the UK Census 2021, investigating whether educational qualifications actually predict employment outcomes. Analyses 1.2M+ data points across 8,000+ electoral wards to uncover regional disparities, qualification mismatches, and demographic patterns using K-Means clustering and correlation analysis. Key finding: 32% of degree holders work in roles below their qualification level.',
    tags: ['Python', 'Pandas', 'Scikit-learn', 'K-Means', 'React', 'ONS Data'],
    status: 'live',
    path: '/projects/census-2021',
    gradient: 'from-blue-500 to-indigo-600',
    icon: <BarChart3 className="w-8 h-8" />,
    metrics: [
      { label: 'Electoral Wards', value: '7,638' },
      { label: 'Data Points', value: '1.2M+' },
      { label: 'ML Clusters', value: '3' }
    ]
  },
  // Add more projects here as you build them
  // {
  //   id: 'project-2',
  //   title: 'Next Project',
  //   description: 'Coming soon...',
  //   tags: ['Tech Stack'],
  //   status: 'coming-soon',
  //   path: '/projects/next-project',
  //   gradient: 'from-purple-500 to-indigo-600',
  //   icon: <Code2 className="w-8 h-8" />,
  // }
]

function ProjectCard({ project }: { project: Project }) {
  const isLive = project.status === 'live'
  const isExternal = Boolean(project.externalUrl)
  
  if (isExternal) {
    return (
      <a
        href={project.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`card p-8 group relative overflow-hidden ${!isLive && 'opacity-60 cursor-not-allowed'}`}
      >
      {/* Gradient accent */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${project.gradient}`} />
      
      {/* Icon */}
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${project.gradient} flex items-center justify-center text-white mb-6`}>
        {project.icon}
      </div>
      
      {/* Status badge */}
      <div className="flex items-center gap-2 mb-4">
        {isLive ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live
          </span>
        ) : (
          <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
            Coming Soon
          </span>
        )}
      </div>
      
      {/* Title & Description */}
      <h3 className="text-2xl font-semibold mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {project.title}
      </h3>
      <p className="text-[hsl(var(--muted-foreground))] mb-6 line-clamp-3">
        {project.description}
      </p>
      
      {/* Metrics */}
      {project.metrics && (
        <div className="flex gap-6 mb-6">
          {project.metrics.map((metric) => (
            <div key={metric.label}>
              <p className="text-2xl font-semibold tabular-nums">{metric.value}</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{metric.label}</p>
            </div>
          ))}
        </div>
      )}
      
      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {project.tags.map((tag) => (
          <span key={tag} className="badge">
            {tag}
          </span>
        ))}
      </div>
      
      {/* CTA */}
        {isLive && (
          <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors">
            <span>Open App</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        )}
      </a>
    )
  }

  return (
    <Link
      to={isLive ? project.path : '#'}
      className={`card p-8 group relative overflow-hidden ${!isLive && 'opacity-60 cursor-not-allowed'}`}
    >
      {/* Gradient accent */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${project.gradient}`} />
      
      {/* Icon */}
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${project.gradient} flex items-center justify-center text-white mb-6`}>
        {project.icon}
      </div>
      
      {/* Status badge */}
      <div className="flex items-center gap-2 mb-4">
        {isLive ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live
          </span>
        ) : (
          <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
            Coming Soon
          </span>
        )}
      </div>
      
      {/* Title & Description */}
      <h3 className="text-2xl font-semibold mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {project.title}
      </h3>
      <p className="text-[hsl(var(--muted-foreground))] mb-6 line-clamp-3">
        {project.description}
      </p>
      
      {/* Metrics */}
      {project.metrics && (
        <div className="flex gap-6 mb-6">
          {project.metrics.map((metric) => (
            <div key={metric.label}>
              <p className="text-2xl font-semibold tabular-nums">{metric.value}</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{metric.label}</p>
            </div>
          ))}
        </div>
      )}
      
      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {project.tags.map((tag) => (
          <span key={tag} className="badge">
            {tag}
          </span>
        ))}
      </div>
      
      {/* CTA */}
      {isLive && (
        <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors">
          <span>Launch App</span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      )}
    </Link>
  )
}

export default function Portfolio() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    return false
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-transparent to-transparent dark:from-transparent">
      {/* Theme Toggle - Fixed position */}
      <button
        onClick={() => setDark(!dark)}
        className="fixed top-6 right-6 z-50 p-3 rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-lg hover:scale-105 transition-transform"
        aria-label="Toggle theme"
      >
        {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Hero Section */}
      <section className="pt-16 pb-8 lg:pt-20 lg:pb-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-4xl">
            <div className="flex flex-col gap-2 mb-6">
              <div className="inline-flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.6)]" />
                <h1 className="text-3xl font-semibold">Ashish Sumanth Banda</h1>
              </div>
              <div className="h-px w-24 bg-gradient-to-r from-blue-600 to-indigo-600" />
              <p className="text-lg text-blue-600 dark:text-[hsl(var(--muted-foreground))]">AI Engineer & Data Scientist</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">MSc Data Science · University of Greenwich</p>
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight mb-6">
              Building Accountable AI
              <br />
              <span className="text-slate-500 dark:text-[hsl(var(--muted-foreground))]">for Regulated Industries</span>
            </h2>
            
            <p className="text-xl text-slate-600 dark:text-[hsl(var(--muted-foreground))] mb-8 max-w-3xl">
              Data and AI systems for legal-tech and healthcare—where compliance matters and decisions must be defensible.
            </p>
            
            {/* Social links */}
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/ashishsumanth1" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/0.7)] transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="https://www.linkedin.com/in/ashishsumanth" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/0.7)] transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="mailto:ashishsumanth1@gmail.com"
                className="w-10 h-10 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/0.7)] transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>
      
      {/* Projects Section */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
            <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Featured Projects
            </h3>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-6">
            {PROJECTS.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            
            {/* Placeholder for next project */}
            <div className="card p-8 border-dashed flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-[hsl(var(--muted))] flex items-center justify-center mb-6">
                <Code2 className="w-8 h-8 text-blue-600 dark:text-[hsl(var(--muted-foreground))]" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-600 dark:text-[hsl(var(--muted-foreground))]">
                More Coming Soon
              </h3>
              <p className="text-slate-500 dark:text-[hsl(var(--muted-foreground))] max-w-xs">
                Always building, analysing, and experimenting with AI. Check back for more projects!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <Briefcase className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
            <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Experience
            </h3>
          </div>
          
          <div className="space-y-6">
            {/* VenRAAG */}
            <div className="card p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-xl font-semibold">AI Engineer</h4>
                  <p className="text-blue-600 dark:text-blue-400 font-medium">VenRAAG · Legal-Tech AI Startup</p>
                </div>
                <span className="text-sm text-[hsl(var(--muted-foreground))] whitespace-nowrap">Nov 2024 – Present</span>
              </div>
              <p className="text-[hsl(var(--muted-foreground))] mb-4">
                Building enterprise-grade legal AI that combines retrieval accuracy with multi-tenant security. 
                Designed the core RAG architecture using LangChain with recursive chunking that respects legal document structure 
                (definitions, clauses, case summaries). Built metadata-aware scoring to cut down on irrelevant retrievals.
              </p>
              <div className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
                <p>• Architected multi-tenant document vault with per-user access control and audit trails for compliance officers</p>
                <p>• Developed chained prompts handling edge cases—sparse context triggers clarification instead of guessing</p>
                <p>• Built debugging dashboards that surface chunk origins and retrieval rankings for non-technical stakeholders</p>
                <p>• Iteratively expanded document type coverage so most enterprise formats now work without manual tweaks</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {['LangChain', 'Supabase', 'pgvector', 'RAG', 'Multi-tenant', 'Python'].map(tag => (
                  <span key={tag} className="badge text-xs">{tag}</span>
                ))}
              </div>
            </div>

            {/* Elite CarePlus */}
            <div className="card p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-xl font-semibold">Data Administrator</h4>
                  <p className="text-emerald-600 dark:text-emerald-400 font-medium">Elite CarePlus · Health & Social Care</p>
                </div>
                <span className="text-sm text-[hsl(var(--muted-foreground))] whitespace-nowrap">Nov 2024 – Present</span>
              </div>
              <p className="text-[hsl(var(--muted-foreground))] mb-4">
                Central operational hub for a regulated domiciliary care provider. Designed GDPR-compliant filing systems 
                where audits become demonstrations of competence rather than firefighting exercises.
              </p>
              <div className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
                <p>• Built compliance dashboard flagging expiring visas, training certificates, and DBS checks before they become crises</p>
                <p>• Produce trend analyses on care visit frequency, missed appointments, and reassessment cycles using Excel/Power BI</p>
                <p>• Create chronological event maps for NHS case managers and social care panels during safeguarding reviews</p>
                <p>• Local authority partners now view our reports as reliable inputs to their own decision-making</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {['Excel', 'Power BI', 'GDPR', 'Compliance', 'Healthcare'].map(tag => (
                  <span key={tag} className="badge text-xs">{tag}</span>
                ))}
              </div>
            </div>

            {/* Croydon Voluntary Action */}
            <div className="card p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-xl font-semibold">Database Administrator</h4>
                  <p className="text-purple-600 dark:text-purple-400 font-medium">Croydon Voluntary Action · Non-profit Network</p>
                </div>
                <span className="text-sm text-[hsl(var(--muted-foreground))] whitespace-nowrap">Sep – Nov 2024</span>
              </div>
              <p className="text-[hsl(var(--muted-foreground))]">
                Data stewardship for South London non-profit organisations. Consolidated fragmented spreadsheets into structured 
                reports, reconciled job and volunteer opportunity listings, and automated monthly round-ups using MS 365. 
                Learned that good technology should amplify human effort rather than burden it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <GraduationCap className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
            <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Education
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h4 className="text-xl font-semibold mb-1">MSc Data Science</h4>
              <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">University of Greenwich, UK</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Capstone project on blockchain-based KYC verification. Coursework spanning big data architecture, 
                machine learning, data visualisation, and statistical modelling.
              </p>
            </div>
            <div className="card p-6">
              <h4 className="text-xl font-semibold mb-1">BSc Computer Science & Engineering</h4>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium mb-2">TKR College of Engineering, India</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Foundation in algorithms, data structures, software engineering, and computer architecture.
              </p>
            </div>
            <div className="card p-6 border-dashed">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-xl font-semibold">DevOps & MLOps</h4>
                <span className="badge text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">In Progress</span>
              </div>
              <p className="text-purple-600 dark:text-purple-400 font-medium mb-2">IBM Professional Certificate · Coursera</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Learning CI/CD pipelines, infrastructure as code, and cultural transformation for continuous delivery. 
                Covers Agile principles, microservices architecture, and automated deployment practices.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))] py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              © {new Date().getFullYear()} Ashish Sumanth Banda. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="https://github.com/ashishsumanth1" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                GitHub
              </a>
              <a href="https://www.linkedin.com/in/ashishsumanth" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                LinkedIn
              </a>
              <a href="mailto:ashishsumanth1@gmail.com" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
