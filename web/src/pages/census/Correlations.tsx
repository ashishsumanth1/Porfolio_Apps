import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  Legend,
  ReferenceLine
} from 'recharts'
import { Info, TrendingUp, GraduationCap, Briefcase } from 'lucide-react'

// Scatter plot data - Qualifications vs Occupations by ward (sample)
const SCATTER_DATA = [
  { qualifications: 2500, occupations: 2300, ward: 'Westminster', cluster: 1 },
  { qualifications: 3200, occupations: 3100, ward: 'Kensington', cluster: 1 },
  { qualifications: 4100, occupations: 3900, ward: 'Camden', cluster: 1 },
  { qualifications: 1800, occupations: 1600, ward: 'Newham', cluster: 2 },
  { qualifications: 1200, occupations: 1100, ward: 'Barking', cluster: 2 },
  { qualifications: 2100, occupations: 2000, ward: 'Greenwich', cluster: 2 },
  { qualifications: 800, occupations: 750, ward: 'Knowsley', cluster: 3 },
  { qualifications: 950, occupations: 880, ward: 'Middlesbrough', cluster: 3 },
  { qualifications: 1100, occupations: 1000, ward: 'Hartlepool', cluster: 3 },
  { qualifications: 5200, occupations: 5000, ward: 'City of London', cluster: 1 },
  { qualifications: 2800, occupations: 2700, ward: 'Hackney', cluster: 2 },
  { qualifications: 3500, occupations: 3300, ward: 'Islington', cluster: 1 },
  { qualifications: 1500, occupations: 1400, ward: 'Lewisham', cluster: 2 },
  { qualifications: 700, occupations: 650, ward: 'Blackpool', cluster: 3 },
  { qualifications: 2000, occupations: 1900, ward: 'Manchester', cluster: 2 },
  { qualifications: 2600, occupations: 2500, ward: 'Leeds', cluster: 2 },
  { qualifications: 3800, occupations: 3600, ward: 'Edinburgh', cluster: 1 },
  { qualifications: 1300, occupations: 1200, ward: 'Bradford', cluster: 3 },
]

// Qualification distribution by employment status
const QUAL_EMPLOYMENT_DATA = [
  { level: 'No Qualifications', employed: 45, unemployed: 55 },
  { level: 'Level 1', employed: 58, unemployed: 42 },
  { level: 'Level 2', employed: 68, unemployed: 32 },
  { level: 'Level 3', employed: 76, unemployed: 24 },
  { level: 'Level 4+', employed: 88, unemployed: 12 },
  { level: 'Apprenticeship', employed: 82, unemployed: 18 },
]

// Top wards by qualification level
const TOP_WARDS = {
  level4: [
    { ward: 'City of London', count: 5200, employment: 94 },
    { ward: 'Westminster', count: 4800, employment: 92 },
    { ward: 'Kensington & Chelsea', count: 4500, employment: 91 },
    { ward: 'Camden', count: 4200, employment: 90 },
    { ward: 'Richmond upon Thames', count: 4000, employment: 93 },
  ],
  level1: [
    { ward: 'Knowsley', count: 1200, employment: 62 },
    { ward: 'Middlesbrough', count: 1150, employment: 64 },
    { ward: 'Blackpool', count: 1100, employment: 61 },
    { ward: 'Hartlepool', count: 1050, employment: 63 },
    { ward: 'Kingston upon Hull', count: 1000, employment: 65 },
  ]
}

const CLUSTER_COLORS = {
  1: 'hsl(142, 76%, 46%)', // Green - High performing
  2: 'hsl(45, 93%, 47%)',  // Amber - Medium
  3: 'hsl(0, 84%, 60%)',   // Red - Low performing
}

const CLUSTER_NAMES = {
  1: 'High Performing',
  2: 'Developing',
  3: 'Challenged'
}

export default function Correlations() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold mb-3">Qualification-Occupation Correlations</h1>
        <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-3xl">
          Analysing how educational attainment correlates with employment outcomes 
          and occupation types across UK electoral wards.
        </p>
      </div>

      {/* Key Finding */}
      <div className="card p-6 border-l-4 border-l-blue-500">
        <div className="flex items-start gap-4">
          <Info className="w-6 h-6 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">Key Finding</h3>
            <p className="text-[hsl(var(--muted-foreground))]">
              Level 4+ qualifications show a <strong>0.92 correlation</strong> with professional 
              occupations, while Level 1 qualifications correlate negatively (-0.56) with the same roles. 
              This represents the strongest qualification-occupation relationship in the dataset.
            </p>
          </div>
        </div>
      </div>

      {/* Scatter Plot */}
      <section className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-1">Qualifications vs Occupations by Ward</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Each point represents an electoral ward, colored by K-Means cluster assignment
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {Object.entries(CLUSTER_NAMES).map(([key, name]) => (
              <div key={key} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: CLUSTER_COLORS[parseInt(key) as 1 | 2 | 3] }}
                />
                <span className="text-[hsl(var(--muted-foreground))]">{name}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              type="number" 
              dataKey="qualifications" 
              name="Qualifications" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              label={{ value: 'Total Qualifications', position: 'bottom', offset: 40, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              type="number" 
              dataKey="occupations" 
              name="Occupations"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              label={{ value: 'Total Occupations', angle: -90, position: 'left', offset: 40, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value) => value !== undefined ? [value.toLocaleString()] : []}
              labelFormatter={(_, payload) => payload[0]?.payload?.ward || ''}
            />
            <ReferenceLine 
              segment={[{ x: 0, y: 0 }, { x: 6000, y: 5700 }]} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="5 5"
              strokeOpacity={0.5}
            />
            <Scatter name="Wards" data={SCATTER_DATA}>
              {SCATTER_DATA.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={CLUSTER_COLORS[entry.cluster as 1 | 2 | 3]}
                  fillOpacity={0.8}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <p className="text-xs text-[hsl(var(--muted-foreground))] text-center mt-4">
          Dashed line represents 1:1 ratio. Points above the line indicate more qualifications than jobs.
        </p>
      </section>

      {/* Qualification Impact on Employment */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-6">Employment Rate by Qualification Level</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={QUAL_EMPLOYMENT_DATA} layout="vertical" margin={{ left: 120 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              domain={[0, 100]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis 
              type="category" 
              dataKey="level"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              width={110}
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
              formatter={(value, name) => value !== undefined ? [`${value}%`, name === 'employed' ? 'Employed' : 'Unemployed'] : []}
            />
            <Legend />
            <Bar dataKey="employed" name="Employed" fill="hsl(142, 76%, 46%)" radius={[0, 4, 4, 0]} />
            <Bar dataKey="unemployed" name="Unemployed" fill="hsl(0, 84%, 60%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Top Wards Comparison */}
      <section className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-semibold">Top 5 Wards: Level 4+ Qualifications</h2>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
            Electoral wards with highest concentration of degree-level qualifications
          </p>
          <div className="space-y-3">
            {TOP_WARDS.level4.map((ward, idx) => (
              <div key={ward.ward} className="flex items-center justify-between p-3 bg-[hsl(var(--muted))] rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-medium">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{ward.ward}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">
                    {ward.count.toLocaleString()} people
                  </span>
                  <span className="badge bg-emerald-500/10 text-emerald-600">
                    {ward.employment}% employed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Top 5 Wards: Level 1 Qualifications</h2>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
            Electoral wards with highest concentration of basic qualifications (1-4 GCSEs)
          </p>
          <div className="space-y-3">
            {TOP_WARDS.level1.map((ward, idx) => (
              <div key={ward.ward} className="flex items-center justify-between p-3 bg-[hsl(var(--muted))] rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-medium">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{ward.ward}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">
                    {ward.count.toLocaleString()} people
                  </span>
                  <span className="badge bg-amber-500/10 text-amber-600">
                    {ward.employment}% employed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insights */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Analysis Insights</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Positive Correlations
            </h3>
            <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              <li>• Level 4+ qualifications strongly correlate with managerial and professional roles</li>
              <li>• Apprenticeship completers show 82% employment rate, outperforming Level 3 graduates</li>
              <li>• Administrative roles are accessible across all qualification levels</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
              Areas of Concern
            </h3>
            <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              <li>• 32% of Level 4 graduates work in roles requiring lower qualifications</li>
              <li>• Geographic clustering shows strong North-South divide in qualification levels</li>
              <li>• "No qualification" areas show 45% employment vs 88% in Level 4+ areas</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
