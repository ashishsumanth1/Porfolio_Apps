import { useState, useMemo, useEffect } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { MapPin, GraduationCap, Briefcase, Users, TrendingUp, TrendingDown, Info, ChevronDown, Loader2, Filter, X } from 'lucide-react'

// Type for ward data
interface WardData {
  code: string
  name: string
  region: string
  level1: number
  level2: number
  level3: number
  level4: number
  noQual: number
  apprenticeship: number
  other: number
  managers: number
  professional: number
  associate: number
  admin: number
  skilled: number
  caring: number
  sales: number
  process: number
  elementary: number
  employed: number
  notEmployed: number
  population: number
}

// Calculate national averages
const NATIONAL_AVERAGES = {
  level1Pct: 12,
  level2Pct: 18,
  level3Pct: 20,
  level4Pct: 35,
  noQualPct: 8,
  apprenticeshipPct: 7,
  employmentRate: 75,
}

const QUALIFICATION_COLORS = {
  'No Qualification': 'hsl(0, 84%, 60%)',
  'Level 1': 'hsl(30, 90%, 55%)',
  'Level 2': 'hsl(45, 93%, 47%)',
  'Level 3': 'hsl(142, 76%, 46%)',
  'Level 4+': 'hsl(217, 91%, 60%)',
  'Apprenticeship': 'hsl(280, 80%, 60%)',
}

const OCCUPATION_COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(142, 76%, 46%)',
  'hsl(45, 93%, 47%)',
  'hsl(280, 80%, 60%)',
  'hsl(0, 84%, 60%)',
  'hsl(180, 70%, 45%)',
  'hsl(320, 70%, 55%)',
  'hsl(60, 70%, 50%)',
  'hsl(200, 70%, 50%)',
]

export default function WardExplorer() {
  const [allWards, setAllWards] = useState<WardData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWard, setSelectedWard] = useState<WardData | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filter states
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [employmentFilter, setEmploymentFilter] = useState<string>('all')
  const [populationFilter, setPopulationFilter] = useState<string>('all')

  // Load real data from JSON
  useEffect(() => {
    fetch('/data/ward_data.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load ward data')
        return res.json()
      })
      .then((data: WardData[]) => {
        setAllWards(data)
        setIsLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setIsLoading(false)
      })
  }, [])

  // Get unique regions for filter dropdown
  const regions = useMemo(() => {
    const uniqueRegions = [...new Set(allWards.map(w => w.region))].sort()
    return uniqueRegions
  }, [allWards])

  // Filter wards based on all filters
  const filteredWards = useMemo(() => {
    return allWards.filter(w => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        if (!w.name.toLowerCase().includes(query) && 
            !w.region.toLowerCase().includes(query) &&
            !w.code.toLowerCase().includes(query)) {
          return false
        }
      }
      
      // Region filter
      if (selectedRegion !== 'all' && w.region !== selectedRegion) {
        return false
      }
      
      // Employment rate filter
      const empRate = (w.employed + w.notEmployed) > 0 
        ? Math.round((w.employed / (w.employed + w.notEmployed)) * 100) 
        : 0
      if (employmentFilter !== 'all') {
        if (employmentFilter === 'high' && empRate < 85) return false
        if (employmentFilter === 'above' && (empRate < 75 || empRate >= 85)) return false
        if (employmentFilter === 'below' && (empRate < 65 || empRate >= 75)) return false
        if (employmentFilter === 'low' && empRate >= 65) return false
      }
      
      // Population filter
      if (populationFilter !== 'all') {
        if (populationFilter === 'small' && w.population >= 5000) return false
        if (populationFilter === 'medium' && (w.population < 5000 || w.population >= 10000)) return false
        if (populationFilter === 'large' && (w.population < 10000 || w.population >= 15000)) return false
        if (populationFilter === 'xlarge' && w.population < 15000) return false
      }
      
      return true
    })
  }, [allWards, searchQuery, selectedRegion, employmentFilter, populationFilter])

  // Check if any filters are active
  const hasActiveFilters = selectedRegion !== 'all' || employmentFilter !== 'all' || populationFilter !== 'all'

  // Clear all filters
  const clearFilters = () => {
    setSelectedRegion('all')
    setEmploymentFilter('all')
    setPopulationFilter('all')
    setSearchQuery('')
  }

  // Group wards by region for better organization
  const wardsByRegion = useMemo(() => {
    const grouped: Record<string, WardData[]> = {}
    filteredWards.forEach(ward => {
      if (!grouped[ward.region]) {
        grouped[ward.region] = []
      }
      grouped[ward.region].push(ward)
    })
    // Sort regions by ward count (most first) and wards within each region alphabetically
    const sortedRegions = Object.keys(grouped).sort((a, b) => grouped[b].length - grouped[a].length)
    const result: Record<string, WardData[]> = {}
    sortedRegions.forEach(region => {
      result[region] = grouped[region].sort((a, b) => a.name.localeCompare(b.name))
    })
    return result
  }, [filteredWards])

  const handleSelectWard = (ward: WardData) => {
    setSelectedWard(ward)
    setIsDropdownOpen(false)
  }

  // Calculate ward-specific data
  const wardData = useMemo(() => {
    if (!selectedWard) return null

    const totalQualifications = selectedWard.level1 + selectedWard.level2 + selectedWard.level3 + 
                                selectedWard.level4 + selectedWard.noQual + selectedWard.apprenticeship + selectedWard.other
    const totalOccupations = selectedWard.managers + selectedWard.professional + selectedWard.associate +
                            selectedWard.admin + selectedWard.skilled + selectedWard.caring +
                            selectedWard.sales + selectedWard.process + selectedWard.elementary
    const employmentRate = (selectedWard.employed + selectedWard.notEmployed) > 0 
      ? Math.round((selectedWard.employed / (selectedWard.employed + selectedWard.notEmployed)) * 100)
      : 0

    const qualificationData = [
      { name: 'No Qualification', value: selectedWard.noQual, pct: totalQualifications > 0 ? Math.round((selectedWard.noQual / totalQualifications) * 100) : 0 },
      { name: 'Level 1', value: selectedWard.level1, pct: totalQualifications > 0 ? Math.round((selectedWard.level1 / totalQualifications) * 100) : 0 },
      { name: 'Level 2', value: selectedWard.level2, pct: totalQualifications > 0 ? Math.round((selectedWard.level2 / totalQualifications) * 100) : 0 },
      { name: 'Level 3', value: selectedWard.level3, pct: totalQualifications > 0 ? Math.round((selectedWard.level3 / totalQualifications) * 100) : 0 },
      { name: 'Level 4+', value: selectedWard.level4, pct: totalQualifications > 0 ? Math.round((selectedWard.level4 / totalQualifications) * 100) : 0 },
      { name: 'Apprenticeship', value: selectedWard.apprenticeship, pct: totalQualifications > 0 ? Math.round((selectedWard.apprenticeship / totalQualifications) * 100) : 0 },
    ]

    const occupationData = [
      { name: 'Managers & Directors', value: selectedWard.managers, pct: totalOccupations > 0 ? Math.round((selectedWard.managers / totalOccupations) * 100) : 0 },
      { name: 'Professional', value: selectedWard.professional, pct: totalOccupations > 0 ? Math.round((selectedWard.professional / totalOccupations) * 100) : 0 },
      { name: 'Associate Professional', value: selectedWard.associate, pct: totalOccupations > 0 ? Math.round((selectedWard.associate / totalOccupations) * 100) : 0 },
      { name: 'Administrative', value: selectedWard.admin, pct: totalOccupations > 0 ? Math.round((selectedWard.admin / totalOccupations) * 100) : 0 },
      { name: 'Skilled Trades', value: selectedWard.skilled, pct: totalOccupations > 0 ? Math.round((selectedWard.skilled / totalOccupations) * 100) : 0 },
      { name: 'Caring & Leisure', value: selectedWard.caring, pct: totalOccupations > 0 ? Math.round((selectedWard.caring / totalOccupations) * 100) : 0 },
      { name: 'Sales & Service', value: selectedWard.sales, pct: totalOccupations > 0 ? Math.round((selectedWard.sales / totalOccupations) * 100) : 0 },
      { name: 'Process & Plant', value: selectedWard.process, pct: totalOccupations > 0 ? Math.round((selectedWard.process / totalOccupations) * 100) : 0 },
      { name: 'Elementary', value: selectedWard.elementary, pct: totalOccupations > 0 ? Math.round((selectedWard.elementary / totalOccupations) * 100) : 0 },
    ]

    // Comparison with national average
    const comparisonData = [
      { metric: 'Level 4+', ward: totalQualifications > 0 ? Math.round((selectedWard.level4 / totalQualifications) * 100) : 0, national: NATIONAL_AVERAGES.level4Pct },
      { metric: 'Level 3', ward: totalQualifications > 0 ? Math.round((selectedWard.level3 / totalQualifications) * 100) : 0, national: NATIONAL_AVERAGES.level3Pct },
      { metric: 'Level 2', ward: totalQualifications > 0 ? Math.round((selectedWard.level2 / totalQualifications) * 100) : 0, national: NATIONAL_AVERAGES.level2Pct },
      { metric: 'Level 1', ward: totalQualifications > 0 ? Math.round((selectedWard.level1 / totalQualifications) * 100) : 0, national: NATIONAL_AVERAGES.level1Pct },
      { metric: 'No Qual', ward: totalQualifications > 0 ? Math.round((selectedWard.noQual / totalQualifications) * 100) : 0, national: NATIONAL_AVERAGES.noQualPct },
      { metric: 'Employment', ward: employmentRate, national: NATIONAL_AVERAGES.employmentRate },
    ]

    return {
      qualificationData,
      occupationData,
      comparisonData,
      employmentRate,
      totalQualifications,
      totalOccupations,
    }
  }, [selectedWard])

  // Determine ward performance
  const wardPerformance = useMemo(() => {
    if (!wardData) return null
    const empDiff = wardData.employmentRate - NATIONAL_AVERAGES.employmentRate
    if (empDiff >= 10) return { label: 'High Performing', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
    if (empDiff >= 0) return { label: 'Above Average', color: 'text-blue-500', bg: 'bg-blue-500/10' }
    if (empDiff >= -10) return { label: 'Below Average', color: 'text-amber-500', bg: 'bg-amber-500/10' }
    return { label: 'Challenged', color: 'text-red-500', bg: 'bg-red-500/10' }
  }, [wardData])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-[hsl(var(--muted-foreground))]">Loading Census 2021 ward data...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500 mb-2">Failed to load ward data</p>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold mb-3">Ward Explorer</h1>
        <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-3xl">
          Explore employment vs qualification data for any electoral ward in England.
          Real Census 2021 data from the ONS.
        </p>
      </div>

      {/* Ward Selector */}
      <div className="card p-6">
        <label className="block text-sm font-medium mb-2">Select a Ward</label>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-left"
          >
            {selectedWard ? (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">{selectedWard.name}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{selectedWard.region}</p>
                </div>
              </div>
            ) : (
              <span className="text-[hsl(var(--muted-foreground))]">Choose an electoral ward...</span>
            )}
            <ChevronDown className={`w-5 h-5 text-[hsl(var(--muted-foreground))] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Dropdown List */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-lg overflow-hidden z-[100] max-h-[600px] flex flex-col">
              {/* Search Input */}
              <div className="p-3 border-b border-[hsl(var(--border))] sticky top-0 bg-[hsl(var(--card))] space-y-3">
                <input
                  type="text"
                  placeholder="Search by name, region, or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                
                {/* Filter Row */}
                <div className="flex flex-wrap gap-2">
                  {/* Region Filter */}
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="px-3 py-1.5 text-sm rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Regions</option>
                    {regions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                  
                  {/* Employment Rate Filter */}
                  <select
                    value={employmentFilter}
                    onChange={(e) => setEmploymentFilter(e.target.value)}
                    className="px-3 py-1.5 text-sm rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Employment Rates</option>
                    <option value="high">High (85%+)</option>
                    <option value="above">Above Avg (75-84%)</option>
                    <option value="below">Below Avg (65-74%)</option>
                    <option value="low">Low (&lt;65%)</option>
                  </select>
                  
                  {/* Population Filter */}
                  <select
                    value={populationFilter}
                    onChange={(e) => setPopulationFilter(e.target.value)}
                    className="px-3 py-1.5 text-sm rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Populations</option>
                    <option value="small">Small (&lt;5k)</option>
                    <option value="medium">Medium (5k-10k)</option>
                    <option value="large">Large (10k-15k)</option>
                    <option value="xlarge">Very Large (15k+)</option>
                  </select>
                  
                  {/* Clear Filters Button */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1.5 text-sm rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear
                    </button>
                  )}
                </div>
                
                {/* Filter Results Count */}
                <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                  <Filter className="w-3.5 h-3.5" />
                  <span>{filteredWards.length.toLocaleString()} wards match your filters</span>
                </div>
              </div>
              
              {/* Results */}
              <div className="overflow-y-auto flex-1">
                {filteredWards.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">
                    <p>No wards found matching your filters</p>
                    <button
                      onClick={clearFilters}
                      className="mt-2 text-blue-500 hover:underline text-sm"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  Object.entries(wardsByRegion).map(([region, wards]) => (
                    <div key={region}>
                      {/* Region Header */}
                      <div className="px-4 py-2 bg-[hsl(var(--muted))] sticky top-0 border-b border-[hsl(var(--border))]">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                          {region} ({wards.length})
                        </span>
                      </div>
                      {/* Limit display for performance - show more when filters narrow results */}
                      {wards.slice(0, filteredWards.length < 500 ? 100 : 30).map((ward) => {
                        const empRate = (ward.employed + ward.notEmployed) > 0 
                          ? Math.round((ward.employed / (ward.employed + ward.notEmployed)) * 100) 
                          : 0
                        const isSelected = selectedWard?.code === ward.code
                        return (
                          <button
                            key={ward.code}
                            onClick={() => handleSelectWard(ward)}
                            className={`w-full px-4 py-3 text-left hover:bg-[hsl(var(--muted))] transition-colors flex items-center justify-between ${
                              isSelected ? 'bg-blue-500/10' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <MapPin className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-blue-500' : 'text-[hsl(var(--muted-foreground))]'}`} />
                              <div className="min-w-0">
                                <span className={`block truncate ${isSelected ? 'font-medium text-blue-600 dark:text-blue-400' : ''}`}>{ward.name}</span>
                                <span className="text-xs text-[hsl(var(--muted-foreground))]">Pop: {ward.population.toLocaleString()}</span>
                              </div>
                            </div>
                            <span className={`text-sm px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                              empRate >= 85 ? 'bg-emerald-500/10 text-emerald-600' :
                              empRate >= 75 ? 'bg-blue-500/10 text-blue-600' :
                              empRate >= 65 ? 'bg-amber-500/10 text-amber-600' :
                              'bg-red-500/10 text-red-600'
                            }`}>
                              {empRate}%
                            </span>
                          </button>
                        )
                      })}
                      {wards.length > (filteredWards.length < 500 ? 100 : 30) && (
                        <div className="px-4 py-2 text-xs text-[hsl(var(--muted-foreground))] text-center bg-[hsl(var(--muted))]/50">
                          +{wards.length - (filteredWards.length < 500 ? 100 : 30)} more — use filters above to narrow
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Stats summary */}
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-3">
          {hasActiveFilters ? (
            <span>{filteredWards.length.toLocaleString()} wards matching filters (of {allWards.length.toLocaleString()} total)</span>
          ) : (
            <span>{allWards.length.toLocaleString()} electoral wards available across {regions.length} regions</span>
          )}
        </p>
      </div>

      {/* Ward Data Display */}
      {selectedWard && wardData && wardPerformance && (
        <>
          {/* Ward Header */}
          <div className="card p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-6 h-6 text-blue-500" />
                  <h2 className="text-2xl font-semibold">{selectedWard.name}</h2>
                </div>
                <p className="text-[hsl(var(--muted-foreground))]">
                  {selectedWard.region} • Code: {selectedWard.code}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full ${wardPerformance.bg}`}>
                <span className={`font-medium ${wardPerformance.color}`}>
                  {wardPerformance.label}
                </span>
              </div>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Population (16+)</span>
              </div>
              <p className="text-3xl font-semibold">{selectedWard.population.toLocaleString()}</p>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-2">
                {wardData.employmentRate >= NATIONAL_AVERAGES.employmentRate ? (
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Employment Rate</span>
              </div>
              <p className="text-3xl font-semibold">{wardData.employmentRate}%</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                National: {NATIONAL_AVERAGES.employmentRate}%
              </p>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-5 h-5 text-emerald-500" />
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Employed</span>
              </div>
              <p className="text-3xl font-semibold">{selectedWard.employed.toLocaleString()}</p>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Level 4+ (Degree)</span>
              </div>
              <p className="text-3xl font-semibold">
                {wardData.qualificationData.find(q => q.name === 'Level 4+')?.pct}%
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Qualification Distribution */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Qualification Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={wardData.qualificationData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, pct }) => `${pct}%`}
                  >
                    {wardData.qualificationData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={QUALIFICATION_COLORS[entry.name as keyof typeof QUALIFICATION_COLORS] || '#888'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => value.toLocaleString()}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.5rem',
                      color: 'hsl(var(--foreground))',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Comparison with National */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Ward vs National Average
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={wardData.comparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="metric" width={80} />
                  <Tooltip 
                    formatter={(value: number) => `${value}%`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.5rem',
                      color: 'hsl(var(--foreground))',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Bar dataKey="ward" name={selectedWard.name} fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="national" name="National" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Occupation Distribution */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Occupation Distribution
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={wardData.occupationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }} 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [value.toLocaleString(), name === 'value' ? 'Count' : name]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.5rem',
                    color: 'hsl(var(--foreground))',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="value" name="Employed" radius={[4, 4, 0, 0]}>
                  {wardData.occupationData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={OCCUPATION_COLORS[index % OCCUPATION_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Info Note */}
          <div className="card p-4 bg-blue-500/5 border-blue-500/20">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[hsl(var(--muted-foreground))]">
                <p className="font-medium text-[hsl(var(--foreground))] mb-1">About this data</p>
                <p>
                  Data sourced from Census 2021 (Office for National Statistics). 
                  Population figures represent usual residents aged 16 and over.
                  Qualification levels follow UK educational framework (Level 4+ = Degree level or above).
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Initial State - No ward selected */}
      {!selectedWard && (
        <div className="card p-12 text-center">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-[hsl(var(--muted-foreground))] opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Select a Ward to Begin</h3>
          <p className="text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
            Choose an electoral ward from the dropdown above to explore Census 2021 data 
            on employment and qualifications. Try searching for "Greenwich" or "Manchester".
          </p>
        </div>
      )}
    </div>
  )
}
