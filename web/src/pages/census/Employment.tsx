import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Info } from 'lucide-react'

// Employment rate comparison data
const EMPLOYMENT_COMPARISON = [
  { category: 'High Qualification Wards', rate: 93, fill: 'hsl(142, 76%, 46%)' },
  { category: 'National Average', rate: 78, fill: 'hsl(217, 91%, 60%)' },
  { category: 'Low Qualification Wards', rate: 68, fill: 'hsl(0, 84%, 60%)' },
]

// Demand-Supply gap by qualification level
const DEMAND_SUPPLY_GAP = [
  { level: 'Level 4+', supply: 56, demand: 42, gap: -14 },
  { level: 'Level 3', supply: 18, demand: 22, gap: 4 },
  { level: 'Level 2', supply: 15, demand: 20, gap: 5 },
  { level: 'Level 1', supply: 8, demand: 12, gap: 4 },
  { level: 'No Qualification', supply: 3, demand: 4, gap: 1 },
]

// Ward performance distribution
const WARD_DISTRIBUTION = [
  { name: 'High Performing (>85%)', value: 2456, fill: 'hsl(142, 76%, 46%)' },
  { name: 'Average (70-85%)', value: 4128, fill: 'hsl(45, 93%, 47%)' },
  { name: 'Challenged (<70%)', value: 1857, fill: 'hsl(0, 84%, 60%)' },
]

// Employment rate trend by qualification level
const EMPLOYMENT_BY_QUAL = [
  { qualification: 'No Qual', topWards: 52, bottomWards: 38 },
  { qualification: 'Level 1', topWards: 65, bottomWards: 51 },
  { qualification: 'Level 2', topWards: 76, bottomWards: 60 },
  { qualification: 'Level 3', topWards: 84, bottomWards: 68 },
  { qualification: 'Level 4+', topWards: 94, bottomWards: 78 },
  { qualification: 'Apprentice', topWards: 88, bottomWards: 72 },
]

// Classroom vs Apprenticeship
const QUALIFICATION_TYPE = [
  { name: 'Classroom-based', value: 87, fill: 'hsl(217, 91%, 60%)' },
  { name: 'Apprenticeship-based', value: 13, fill: 'hsl(45, 93%, 47%)' },
]

// Top performing sectors
const TOP_SECTORS = [
  { sector: 'Professional Occupations', employed: 92, gap: '+12%' },
  { sector: 'Managers & Directors', employed: 89, gap: '+8%' },
  { sector: 'Associate Professional', employed: 85, gap: '+5%' },
  { sector: 'Administrative', employed: 78, gap: '0%' },
  { sector: 'Skilled Trades', employed: 76, gap: '-2%' },
  { sector: 'Caring Services', employed: 72, gap: '-6%' },
  { sector: 'Sales & Customer Service', employed: 68, gap: '-10%' },
  { sector: 'Process Operatives', employed: 65, gap: '-13%' },
  { sector: 'Elementary Occupations', employed: 58, gap: '-20%' },
]

export default function Employment() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold mb-3">Employment Rate Analysis</h1>
        <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-3xl">
          Comparing employment outcomes between high and low performing wards, 
          and analysing the demand-supply gap across qualification levels.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-sm text-[hsl(var(--muted-foreground))]">Top Ward Rate</span>
          </div>
          <p className="text-3xl font-semibold text-emerald-500">93%</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Employment rate</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <span className="text-sm text-[hsl(var(--muted-foreground))]">Bottom Ward Rate</span>
          </div>
          <p className="text-3xl font-semibold text-red-500">68%</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Employment rate</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-[hsl(var(--muted-foreground))]">Gap</span>
          </div>
          <p className="text-3xl font-semibold">25%</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Difference</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-[hsl(var(--muted-foreground))]">National Average</span>
          </div>
          <p className="text-3xl font-semibold">78%</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Employment rate</p>
        </div>
      </div>

      {/* Key Finding */}
      <div className="card p-6 border-l-4 border-l-amber-500">
        <div className="flex items-start gap-4">
          <Info className="w-6 h-6 text-amber-500 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">Demand-Supply Mismatch</h3>
            <p className="text-[hsl(var(--muted-foreground))]">
              There's a <strong>14% oversupply</strong> of Level 4+ qualified individuals compared to 
              available jobs requiring that qualification level. Meanwhile, Level 2-3 roles show a 
              <strong> 4-5% demand surplus</strong>, indicating opportunities for vocational training.
            </p>
          </div>
        </div>
      </div>

      {/* Employment Comparison */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-6">Employment Rate Comparison</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={EMPLOYMENT_COMPARISON} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
              <XAxis 
                type="number" 
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                type="category" 
                dataKey="category"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                width={180}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value) => value !== undefined ? [`${value}%`, 'Employment Rate'] : []}
              />
              <Bar dataKey="rate" radius={[0, 8, 8, 0]}>
                {EMPLOYMENT_COMPARISON.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-6">Ward Performance Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={WARD_DISTRIBUTION}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {WARD_DISTRIBUTION.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value) => value !== undefined ? [value.toLocaleString(), 'Wards'] : []}
              />
              <Legend 
                verticalAlign="bottom"
                formatter={(value) => <span className="text-sm text-[hsl(var(--foreground))]">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </section>
      </div>

      {/* Demand Supply Gap */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-2">Demand vs Supply by Qualification Level</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
          Comparing the percentage of qualified individuals (supply) vs jobs requiring that qualification (demand)
        </p>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={DEMAND_SUPPLY_GAP} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="level"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value, name) => value !== undefined ? [`${value}%`, name === 'supply' ? 'Supply (Qualified)' : 'Demand (Jobs)'] : []}
            />
            <Legend />
            <Bar dataKey="supply" name="Supply (Qualified)" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="demand" name="Demand (Jobs)" fill="hsl(142, 76%, 46%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Employment by Qualification - Top vs Bottom Wards */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-2">Employment Rate: Top vs Bottom Wards</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
          How employment rates differ by qualification level in high vs low performing wards
        </p>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={EMPLOYMENT_BY_QUAL}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="qualification"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
              domain={[30, 100]}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value, name) => value !== undefined ? [`${value}%`, name === 'topWards' ? 'Top 1000 Wards' : 'Bottom 1000 Wards'] : []}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="topWards" 
              name="Top 1000 Wards"
              stroke="hsl(142, 76%, 46%)" 
              fill="hsl(142, 76%, 46%)"
              fillOpacity={0.3}
            />
            <Area 
              type="monotone" 
              dataKey="bottomWards" 
              name="Bottom 1000 Wards"
              stroke="hsl(0, 84%, 60%)" 
              fill="hsl(0, 84%, 60%)"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      {/* Qualification Type Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-6">Qualification Type Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={QUALIFICATION_TYPE}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
                labelLine={true}
              >
                {QUALIFICATION_TYPE.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value) => value !== undefined ? [`${value}%`, 'Percentage'] : []}
              />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center">
            87% of UK qualifications are classroom-based, with only 13% from apprenticeships
          </p>
        </section>

        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Employment by Occupation</h2>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {TOP_SECTORS.map((sector) => (
              <div key={sector.sector} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{sector.sector}</span>
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">{sector.employed}%</span>
                  </div>
                  <div className="h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${sector.employed}%`,
                        backgroundColor: sector.employed >= 78 ? 'hsl(142, 76%, 46%)' : 
                                        sector.employed >= 70 ? 'hsl(45, 93%, 47%)' : 'hsl(0, 84%, 60%)'
                      }}
                    />
                  </div>
                </div>
                <span className={`text-xs font-medium w-12 text-right ${
                  sector.gap.startsWith('+') ? 'text-emerald-500' : 
                  sector.gap === '0%' ? 'text-[hsl(var(--muted-foreground))]' : 'text-red-500'
                }`}>
                  {sector.gap}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-4">
            Gap column shows deviation from national average (78%)
          </p>
        </section>
      </div>

      {/* Key Takeaways */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Key Takeaways</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 bg-emerald-500/10 rounded-lg">
            <h3 className="font-medium text-emerald-600 dark:text-emerald-400 mb-2">Strengths</h3>
            <ul className="space-y-1 text-sm text-[hsl(var(--muted-foreground))]">
              <li>• 56% hold Level 4+ qualifications</li>
              <li>• Top wards achieve 93% employment</li>
              <li>• Professional sectors show strong growth</li>
            </ul>
          </div>
          <div className="p-4 bg-amber-500/10 rounded-lg">
            <h3 className="font-medium text-amber-600 dark:text-amber-400 mb-2">Challenges</h3>
            <ul className="space-y-1 text-sm text-[hsl(var(--muted-foreground))]">
              <li>• 25% gap between top/bottom wards</li>
              <li>• Level 4+ supply exceeds demand by 14%</li>
              <li>• Elementary occupations lag at 58%</li>
            </ul>
          </div>
          <div className="p-4 bg-blue-500/10 rounded-lg">
            <h3 className="font-medium text-blue-600 dark:text-blue-400 mb-2">Opportunities</h3>
            <ul className="space-y-1 text-sm text-[hsl(var(--muted-foreground))]">
              <li>• Level 2-3 roles have demand surplus</li>
              <li>• Apprenticeships show 82% employment</li>
              <li>• Vocational training can bridge gaps</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
