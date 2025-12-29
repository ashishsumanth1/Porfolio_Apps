# Portfolio Application
A modern, responsive portfolio web application showcasing data science and AI engineering projects. Built with React, TypeScript, and TailwindCSS, featuring dark/light mode, smooth navigation, and project dashboards with live data visualisations.

---

## 0. Why this project exists
Every data professional needs a portfolio that demonstrates not just technical ability, but the capacity to build polished, user-facing products. This isn't a static CV site—it's a living application that hosts interactive dashboards for real projects.

What makes it portfolio-worthy:
- Full-stack React application with TypeScript
- Modern UI/UX with responsive design and theme switching
- Hosts multiple live project dashboards (Money Radar, Census 2021)
- Professional presentation with clean, Apple-inspired aesthetics
- Real data integration via REST APIs and static JSON

---

## 1. Scope and features
### 1.1 Core pages
- **Portfolio Home** (`/`): Hero section, featured projects grid, experience, education
- **Money Radar Dashboard** (`/projects/money-radar/*`): NLP analytics project
- **Census 2021 Dashboard** (`/projects/census-2021/*`): Data science exploration

### 1.2 Key features
- Dark/light theme toggle with system preference detection and localStorage persistence
- Responsive design for mobile, tablet, and desktop
- Smooth page transitions and hover animations
- Live project status indicators
- Social links (GitHub, LinkedIn, Email)
- Professional monogram branding (AB)

### 1.3 Design philosophy
- Clean, minimal aesthetic inspired by Apple's design language
- Generous whitespace and clear visual hierarchy
- Subtle gradients and shadows for depth
- Consistent colour palette across light and dark modes
- Projects visible above the fold to encourage exploration

---

## 2. Architecture
### 2.1 Tech stack
| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| Language | TypeScript |
| Styling | TailwindCSS + CSS Variables |
| Routing | React Router v6 |
| Charts | Recharts |
| Icons | Lucide React |
| Build | Vite |
| Package Manager | npm |

### 2.2 Project structure
```
web/
├── src/
│   ├── components/
│   │   └── Layout.tsx          # Shared layout with nav and theme
│   ├── pages/
│   │   ├── Portfolio.tsx       # Main portfolio page
│   │   ├── Dashboard.tsx       # Money Radar overview
│   │   ├── Themes.tsx          # Money Radar themes
│   │   ├── Signals.tsx         # Money Radar signals
│   │   ├── Posts.tsx           # Money Radar posts
│   │   └── census/
│   │       ├── CensusDashboard.tsx
│   │       ├── Correlations.tsx
│   │       ├── Employment.tsx
│   │       ├── Demographics.tsx
│   │       └── WardExplorer.tsx
│   ├── styles/
│   │   └── globals.css         # CSS variables and base styles
│   ├── App.tsx                 # Router configuration
│   └── main.tsx                # Entry point
├── public/
│   └── data/
│       └── ward_data.json      # Census 2021 ward data (7,638 wards)
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

### 2.3 Routing structure
```
/                           → Portfolio.tsx
/projects/money-radar       → Dashboard.tsx (via Layout)
/projects/money-radar/themes → Themes.tsx
/projects/money-radar/signals → Signals.tsx
/projects/money-radar/posts  → Posts.tsx
/projects/census-2021       → CensusDashboard.tsx (via Layout)
/projects/census-2021/correlations → Correlations.tsx
/projects/census-2021/employment → Employment.tsx
/projects/census-2021/demographics → Demographics.tsx
/projects/census-2021/wards → WardExplorer.tsx
```

---

## 3. Theming system
### 3.1 CSS variables approach
Theme colours are defined using HSL CSS variables for maximum flexibility:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --border: 214.3 31.8% 91.4%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

### 3.2 Theme toggle implementation
```typescript
const [dark, setDark] = useState(() => {
  return localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && 
     window.matchMedia('(prefers-color-scheme: dark)').matches)
})

useEffect(() => {
  document.documentElement.classList.toggle('dark', dark)
  localStorage.setItem('theme', dark ? 'dark' : 'light')
}, [dark])
```

### 3.3 Light mode enhancements
- Subtle blue gradient background (`from-blue-50/50`)
- Blue accent on monogram and subtitle
- Warmer slate tones for text hierarchy
- Soft shadows with colour tints

---

## 4. Components
### 4.1 Layout component
Shared wrapper for project dashboards providing:
- Glass-effect sticky header
- Project navigation tabs
- Back to portfolio link
- Theme toggle
- Responsive mobile menu

### 4.2 ProjectCard component
Reusable card for displaying projects:
- Gradient accent bar and icon
- Live/coming soon status badge
- Metrics display (posts analysed, themes, etc.)
- Technology tags
- Hover animations

### 4.3 Card styles
```css
.card {
  @apply bg-[hsl(var(--card))] 
         border border-[hsl(var(--border))] 
         rounded-2xl 
         transition-all duration-200;
}

.card:hover {
  @apply shadow-lg 
         border-[hsl(var(--border)/0.5)] 
         -translate-y-1;
}
```

---

## 5. Data integration
### 5.1 Money Radar API
The Money Radar project connects to a FastAPI backend:

| Endpoint | Description |
|----------|-------------|
| `/api/stats` | Dashboard metrics |
| `/api/clusters` | Theme clusters |
| `/api/signals` | Pain point signals |
| `/api/posts` | Post listings with pagination |

### 5.2 Census 2021 static data
Ward data is loaded from a static JSON file (`ward_data.json`):
- 7,638 electoral wards across UK
- Population, employment rate, qualification levels
- Region classification
- Generated from ONS Census 2021 CSVs

---

## 6. Sections breakdown
### 6.1 Hero section
- Professional monogram (AB) with gradient
- Name, title, university
- Tagline: "Building Accountable AI for Regulated Industries"
- Description paragraph
- Social links (GitHub, LinkedIn, Email)

### 6.2 Featured projects
- Grid layout (2 columns on desktop)
- Live project cards with metrics
- "Coming Soon" placeholder card with dashed border

### 6.3 Experience section
- VenRAAG (AI Engineer) - Legal-tech AI
- Elite CarePlus (Data Administrator) - Healthcare
- Croydon Voluntary Action (Database Administrator) - Non-profit
- Technology tags per role

### 6.4 Education section
- MSc Data Science - University of Greenwich
- BSc Computer Science & Engineering - TKR College
- DevOps & MLOps - IBM/Coursera (In Progress)

### 6.5 Footer
- Copyright notice
- Quick links to GitHub, LinkedIn, Contact

---

## 7. Performance considerations
### 7.1 Optimisations
- Vite for fast HMR and optimised builds
- Code splitting via React Router lazy loading (optional)
- Static JSON for Census data (no API latency)
- CSS variables for instant theme switching (no re-render)

### 7.2 Accessibility
- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Sufficient colour contrast in both themes

---

## 8. Deployment
### 8.1 Development
```bash
cd web
npm install
npm run dev
```

### 8.2 Production build
```bash
npm run build
npm run preview
```

### 8.3 Hosting options
- Vercel (recommended for React apps)
- Netlify
- GitHub Pages
- Cloudflare Pages

---

## 9. Future enhancements
- [ ] Add more projects as they're built
- [ ] Blog section for technical writing
- [ ] Contact form with email integration
- [ ] Analytics (Plausible or Umami for privacy)
- [ ] PDF CV download
- [ ] Project filtering by technology
- [ ] Animated page transitions with Framer Motion
