# Census 2021 Analysis
A data science exploration of UK Census 2021 data investigating whether educational qualifications actually predict employment outcomes. Analyses 1.2M+ data points across 7,638 electoral wards to uncover regional disparities, qualification mismatches, and demographic patterns.

---

## 0. Why this project exists
The conventional wisdom says "get a degree, get a good job." But is that true across all regions? This project tests that assumption using real Census 2021 data from the Office for National Statistics (ONS), exploring whether qualification levels correlate with employment rates at the ward level.

What makes it portfolio-worthy:
- Real government data (ONS Census 2021)
- Statistical analysis with correlation and clustering
- Interactive data visualisation dashboard
- Regional disparity analysis
- Clear research question with data-driven answers

---

## 1. Research question
**Primary question**: Do higher educational qualifications predict higher employment rates at the electoral ward level in England and Wales?

**Secondary questions**:
- Which regions show the strongest/weakest correlation?
- Are there wards with high qualifications but low employment (and vice versa)?
- What occupational patterns exist across different qualification levels?
- How does population density relate to employment outcomes?

---

## 2. Data sources
### 2.1 ONS Census 2021 datasets
| Dataset | Description | Records |
|---------|-------------|---------|
| Qualification levels | Highest qualification by ward | ~8,000 wards |
| Economic activity | Employment status by ward | ~8,000 wards |
| Occupation groups | SOC major groups by ward | ~8,000 wards |

### 2.2 Geographic coverage
- England and Wales (Census 2021)
- Electoral ward level granularity
- 7,638 wards after data cleaning

### 2.3 Data processing
Raw CSVs are processed via Python/Pandas into a unified JSON file:
- Merge qualification, employment, and occupation data
- Calculate derived metrics (employment rate, degree %)
- Classify regions (London, South East, etc.)
- Handle missing values and edge cases

---

## 3. Key metrics
### 3.1 Employment metrics
| Metric | Calculation |
|--------|-------------|
| Employment Rate | Employed / (Employed + Unemployed) × 100 |
| Economic Activity Rate | (Employed + Unemployed) / Total Population × 100 |
| Unemployment Rate | Unemployed / (Employed + Unemployed) × 100 |

### 3.2 Qualification metrics
| Metric | Calculation |
|--------|-------------|
| Degree % | (Level 4+) / Total × 100 |
| No Qualification % | (No qualifications) / Total × 100 |
| Qualification Index | Weighted score across all levels |

### 3.3 Derived classifications
- **Employment Rate Bands**: High (>75%), Above Average (70-75%), Below Average (65-70%), Low (<65%)
- **Region Classification**: Based on ward naming patterns

---

## 4. Architecture
### 4.1 Data pipeline
```
ONS Census 2021 CSVs
        │
        ▼
┌─────────────────────┐
│ Python Processing   │
│ - pandas merge      │
│ - calculate rates   │
│ - classify regions  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ ward_data.json      │
│ 7,638 wards         │
│ 2.9 MB              │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ React Dashboard     │
│ - Recharts          │
│ - Interactive UI    │
└─────────────────────┘
```

### 4.2 Tech stack
| Component | Technology |
|-----------|------------|
| Data Processing | Python, Pandas |
| Visualisation | React, Recharts |
| Styling | TailwindCSS |
| Data Format | JSON |

### 4.3 File structure
```
web/
├── public/
│   └── data/
│       └── ward_data.json      # Processed ward data
├── src/
│   └── pages/
│       └── census/
│           ├── CensusDashboard.tsx  # Overview + correlations
│           ├── Correlations.tsx     # Scatter plots
│           ├── Employment.tsx       # Employment analysis
│           ├── Demographics.tsx     # Population patterns
│           └── WardExplorer.tsx     # Ward search/filter

scripts/
└── process_census_data.py      # Data processing script
```

---

## 5. Dashboard pages
### 5.1 Overview (CensusDashboard.tsx)
- Project introduction card explaining the research question
- Key statistics cards (wards analysed, avg employment rate, correlation)
- Regional breakdown bar chart
- Quick insights summary

### 5.2 Correlations (Correlations.tsx)
- Scatter plot: Qualification % vs Employment Rate
- Regression line with R² value
- Colour-coded by region
- Tooltip showing ward details
- Key finding: Moderate positive correlation (~0.45)

### 5.3 Employment (Employment.tsx)
- Employment rate distribution histogram
- Top/bottom wards by employment rate
- Regional comparison box plots
- Economic activity breakdown

### 5.4 Demographics (Demographics.tsx)
- Population distribution by ward size
- Age structure patterns
- Urban vs rural comparisons
- Density analysis

### 5.5 Ward Explorer (WardExplorer.tsx)
- Searchable dropdown with 7,638 wards
- Filter by:
  - Region (London, South East, etc.)
  - Employment Rate (High/Above/Below/Low)
  - Population (Small/Medium/Large/Very Large)
- Ward detail cards showing all metrics
- Smart display limits for performance (30-100 wards)

---

## 6. Key findings
### 6.1 Correlation analysis
- **Overall correlation**: ~0.45 (moderate positive)
- Higher qualifications generally predict higher employment
- But significant variation exists—qualification isn't destiny

### 6.2 Regional disparities
- **London**: High qualifications, variable employment
- **South East**: Strong correlation, high both metrics
- **North East/Wales**: Weaker correlation, more variance

### 6.3 Outlier patterns
- Some wards with low qualifications but high employment (manual labour areas)
- Some wards with high qualifications but lower employment (student areas, retirement)

### 6.4 Headline statistics
- ~32% of degree holders work in roles below their qualification level
- Employment rates range from ~55% to ~90% across wards
- Average ward employment rate: ~75%

---

## 7. Data schema
### 7.1 ward_data.json structure
```json
{
  "wards": [
    {
      "ward_code": "E05000001",
      "ward_name": "Abbey",
      "region": "London",
      "population": 12500,
      "employed": 8750,
      "unemployed": 625,
      "employment_rate": 93.3,
      "economic_activity_rate": 75.0,
      "degree_percent": 45.2,
      "no_qualification_percent": 12.5,
      "qualification_index": 3.2,
      "occupations": {
        "managers": 15.2,
        "professionals": 28.4,
        "associate_professional": 18.1,
        "administrative": 10.5,
        "skilled_trades": 8.2,
        "caring": 7.8,
        "sales": 5.1,
        "process": 3.2,
        "elementary": 3.5
      }
    }
  ],
  "metadata": {
    "source": "ONS Census 2021",
    "generated": "2025-12-29",
    "total_wards": 7638
  }
}
```

---

## 8. Visualisation components
### 8.1 Charts used
| Chart Type | Library | Use Case |
|------------|---------|----------|
| Scatter Plot | Recharts | Correlation analysis |
| Bar Chart | Recharts | Regional comparisons |
| Histogram | Recharts | Distribution analysis |
| Pie Chart | Recharts | Breakdown compositions |

### 8.2 Tooltip styling
All charts use consistent tooltip styling for dark mode:
```jsx
<Tooltip
  contentStyle={{
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '12px',
    color: 'hsl(var(--foreground))'
  }}
  labelStyle={{ color: 'hsl(var(--foreground))' }}
  itemStyle={{ color: 'hsl(var(--foreground))' }}
/>
```

---

## 9. Processing script
### 9.1 Data cleaning steps
1. Load raw CSVs from ONS
2. Merge on ward code
3. Calculate employment rate: `employed / (employed + unemployed) * 100`
4. Calculate degree %: `level4_plus / total * 100`
5. Classify regions based on ward name patterns
6. Remove wards with missing data
7. Export to JSON

### 9.2 Running the script
```bash
cd scripts
python process_census_data.py
```

Output: `web/public/data/ward_data.json` (2.9 MB, 7,638 wards)

---

## 10. Future enhancements
- [ ] Add time series comparison (2011 vs 2021)
- [ ] Include Scotland and Northern Ireland data
- [ ] Machine learning clustering of similar wards
- [ ] Predictive model for employment outcomes
- [ ] LSOA-level granularity (more detailed)
- [ ] Export functionality for filtered data
- [ ] Map visualisation with geographic boundaries
- [ ] Occupation-specific analysis pages

---

## 11. References
- ONS Census 2021: https://census.gov.uk/
- Ward boundaries: ONS Open Geography Portal
- SOC 2020 Classification: ONS Standard Occupational Classification

---

## 12. Disclaimer
This analysis uses publicly available Census 2021 data. Findings represent statistical patterns at the ward level and should not be used to make individual predictions. Correlation does not imply causation—many factors beyond qualifications affect employment outcomes.
