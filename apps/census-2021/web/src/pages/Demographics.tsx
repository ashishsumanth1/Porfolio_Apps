import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  ComposedChart,
  Line,
  Area
} from 'recharts'
import { Users, TrendingUp, TrendingDown, Info, Baby, UserCheck, UserX } from 'lucide-react'

// Age distribution in low employment wards
const LOW_EMPLOYMENT_AGE = [
  { age: '15 and under', count: 4200, percentage: 18 },
  { age: '16 to 24', count: 3100, percentage: 13 },
  { age: '25 to 34', count: 2800, percentage: 12 },
  { age: '35 to 49', count: 4500, percentage: 19 },
  { age: '50 to 64', count: 4800, percentage: 20 },
  { age: '65 and over', count: 4100, percentage: 18 },
]

// Age distribution in high employment wards
const HIGH_EMPLOYMENT_AGE = [
  { age: '15 and under', count: 3800, percentage: 14 },
  { age: '16 to 24', count: 4200, percentage: 15 },
  { age: '25 to 34', count: 6200, percentage: 23 },
  { age: '35 to 49', count: 6800, percentage: 25 },
  { age: '50 to 64', count: 4100, percentage: 15 },
  { age: '65 and over', count: 2200, percentage: 8 },
]

// Comparative age distribution for radar chart
const COMPARATIVE_AGE = [
  { category: '15 and under', highWards: 14, lowWards: 18 },
  { category: '16 to 24', highWards: 15, lowWards: 13 },
  { category: '25 to 34', highWards: 23, lowWards: 12 },
  { category: '35 to 49', highWards: 25, lowWards: 19 },
  { category: '50 to 64', highWards: 15, lowWards: 20 },
  { category: '65 and over', highWards: 8, lowWards: 18 },
]

// Employment rate by age group
const EMPLOYMENT_BY_AGE = [
  { age: '16-24', employed: 58, unemployed: 42 },
  { age: '25-34', employed: 82, unemployed: 18 },
  { age: '35-49', employed: 86, unemployed: 14 },
  { age: '50-64', employed: 72, unemployed: 28 },
]

// Dependency ratio trends
const DEPENDENCY_TREND = [
  { ward: 'Top 10%', young: 14, old: 8, working: 78 },
  { ward: 'Top 25%', young: 15, old: 10, working: 75 },
  { ward: 'Median', young: 17, old: 15, working: 68 },
  { ward: 'Bottom 25%', young: 18, old: 17, working: 65 },
  { ward: 'Bottom 10%', young: 18, old: 18, working: 64 },
]

export default function Demographics() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold mb-3">Age Demographics Analysis</h1>
        <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-3xl">
          Understanding how age distribution affects employment patterns and 
          economic activity across UK electoral wards.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-5 h-5 text-emerald-500" />
            <span className="text-sm text-[hsl(var(--muted-foreground))]">Working Age (High)</span>
          </div>
          <p className="text-3xl font-semibold">78%</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">In top performing wards</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <UserX className="w-5 h-5 text-red-500" />
            <span className="text-sm text-[hsl(var(--muted-foreground))]">Working Age (Low)</span>
          </div>
          <p className="text-3xl font-semibold">64%</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">In low performing wards</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-[hsl(var(--muted-foreground))]">Peak Age (High)</span>
          </div>
          <p className="text-3xl font-semibold">35-49</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">25% of population</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Baby className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-[hsl(var(--muted-foreground))]">Dependency Ratio</span>
          </div>
          <p className="text-3xl font-semibold">36%</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">In low performing wards</p>
        </div>
      </div>

      {/* Key Finding */}
      <div className="card p-6 border-l-4 border-l-indigo-500">
        <div className="flex items-start gap-4">
          <Info className="w-6 h-6 text-indigo-500 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">Key Demographic Finding</h3>
            <p className="text-[hsl(var(--muted-foreground))]">
              High-employment wards have <strong>14% more working-age population</strong> (78% vs 64%) 
              and significantly fewer residents aged 65+ (8% vs 18%). The 25-49 age bracket dominates 
              high-performing areas, comprising <strong>48% of the population</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Age Distribution Comparison */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-semibold">High Employment Wards</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={HIGH_EMPLOYMENT_AGE} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="age"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
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
                formatter={(value) => value !== undefined ? [`${value}%`, 'Percentage'] : []}
              />
              <Bar dataKey="percentage" fill="hsl(142, 76%, 46%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center mt-2">
            Peak at 35-49 (25%) with strong 25-34 presence (23%)
          </p>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-semibold">Low Employment Wards</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={LOW_EMPLOYMENT_AGE} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="age"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
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
                formatter={(value) => value !== undefined ? [`${value}%`, 'Percentage'] : []}
              />
              <Bar dataKey="percentage" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center mt-2">
            Higher elderly population (18%) and more even distribution
          </p>
        </section>
      </div>

      {/* Radar Comparison */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-6">Age Distribution Comparison: Radar View</h2>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={COMPARATIVE_AGE} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis 
              dataKey="category" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 30]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <Radar
              name="High Employment Wards"
              dataKey="highWards"
              stroke="hsl(142, 76%, 46%)"
              fill="hsl(142, 76%, 46%)"
              fillOpacity={0.3}
            />
            <Radar
              name="Low Employment Wards"
              dataKey="lowWards"
              stroke="hsl(0, 84%, 60%)"
              fill="hsl(0, 84%, 60%)"
              fillOpacity={0.3}
            />
            <Legend />
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
          </RadarChart>
        </ResponsiveContainer>
      </section>

      {/* Employment by Age Group */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-2">Employment Rate by Age Group</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
          How employment rates vary across different age brackets (working age only)
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={EMPLOYMENT_BY_AGE} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              domain={[0, 100]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis 
              type="category" 
              dataKey="age"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              width={70}
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
              formatter={(value, name) => value !== undefined ? [`${value}%`, name === 'employed' ? 'Employed' : 'Not Employed'] : []}
            />
            <Legend />
            <Bar dataKey="employed" name="Employed" stackId="a" fill="hsl(142, 76%, 46%)" />
            <Bar dataKey="unemployed" name="Not Employed" stackId="a" fill="hsl(0, 84%, 60%)" />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-[hsl(var(--muted-foreground))] text-center mt-2">
          Peak employment in 35-49 age group (86%), lowest in 16-24 (58%)
        </p>
      </section>

      {/* Working Age vs Dependent Population */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-6">Working Age vs Dependent Population</h2>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={DEPENDENCY_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="ward"
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
              formatter={(value) => value !== undefined ? [`${value}%`] : []}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="working" 
              name="Working Age (16-64)"
              fill="hsl(217, 91%, 60%)" 
              stroke="hsl(217, 91%, 60%)"
              fillOpacity={0.3}
            />
            <Bar dataKey="young" name="Young Dependents (0-15)" fill="hsl(45, 93%, 47%)" barSize={30} />
            <Bar dataKey="old" name="Elderly Dependents (65+)" fill="hsl(280, 80%, 60%)" barSize={30} />
            <Line 
              type="monotone" 
              dataKey="working" 
              stroke="hsl(217, 91%, 60%)" 
              strokeWidth={2}
              dot={{ fill: 'hsl(217, 91%, 60%)', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      {/* Insights Grid */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            What High-Employment Wards Have
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
              <span className="text-[hsl(var(--muted-foreground))]">
                <strong className="text-[hsl(var(--foreground))]">Young professionals (25-34): 23%</strong> — 
                11 percentage points higher than low-employment wards
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
              <span className="text-[hsl(var(--muted-foreground))]">
                <strong className="text-[hsl(var(--foreground))]">Prime working age (35-49): 25%</strong> — 
                Career-established population driving economic output
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
              <span className="text-[hsl(var(--muted-foreground))]">
                <strong className="text-[hsl(var(--foreground))]">Low elderly population: 8%</strong> — 
                Less than half compared to challenged wards
              </span>
            </li>
          </ul>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Challenges in Low-Employment Wards
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
              <span className="text-[hsl(var(--muted-foreground))]">
                <strong className="text-[hsl(var(--foreground))]">High elderly population: 18%</strong> — 
                More pensioners reduce economic activity rates
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
              <span className="text-[hsl(var(--muted-foreground))]">
                <strong className="text-[hsl(var(--foreground))]">36% dependency ratio</strong> — 
                More non-working individuals per employed person
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
              <span className="text-[hsl(var(--muted-foreground))]">
                <strong className="text-[hsl(var(--foreground))]">Youth underemployment</strong> — 
                16-24 age group has only 58% employment rate
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Policy Implications */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Policy Implications</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-500/10 rounded-lg">
            <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">Youth Employment</h4>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Focus on 16-24 age group which has lowest employment rates. Apprenticeships 
              and internship programs could bridge the gap.
            </p>
          </div>
          <div className="p-4 bg-purple-500/10 rounded-lg">
            <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-2">Ageing Population</h4>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Wards with high elderly populations need economic stimulus and flexible 
              work opportunities for older residents.
            </p>
          </div>
          <div className="p-4 bg-emerald-500/10 rounded-lg">
            <h4 className="font-medium text-emerald-600 dark:text-emerald-400 mb-2">Working Age Retention</h4>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Incentivize 25-49 population to stay in challenged areas through job 
              creation and improved local infrastructure.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
