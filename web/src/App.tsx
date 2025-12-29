import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Portfolio from './pages/Portfolio'
import Dashboard from './pages/Dashboard'
import Themes from './pages/Themes'
import ThemeDetail from './pages/ThemeDetail'
import Signals from './pages/Signals'
import Posts from './pages/Posts'

// Census 2021 Pages
import CensusDashboard from './pages/census/CensusDashboard'
import Correlations from './pages/census/Correlations'
import Employment from './pages/census/Employment'
import Demographics from './pages/census/Demographics'
import WardExplorer from './pages/census/WardExplorer'

// Money Radar Layout wrapper
function MoneyRadarLayout() {
  return <Layout projectName="Money Radar" basePath="/projects/money-radar" />
}

// Census 2021 Layout wrapper
function Census2021Layout() {
  return (
    <Layout 
      projectName="Census 2021 Analysis" 
      basePath="/projects/census-2021"
      navItems={[
        { name: 'Overview', path: '/projects/census-2021' },
        { name: 'Correlations', path: '/projects/census-2021/correlations' },
        { name: 'Employment', path: '/projects/census-2021/employment' },
        { name: 'Demographics', path: '/projects/census-2021/demographics' },
        { name: 'Ward Explorer', path: '/projects/census-2021/wards' },
      ]}
    />
  )
}

export default function App() {
  return (
    <Routes>
      {/* Portfolio Home */}
      <Route index element={<Portfolio />} />
      
      {/* Money Radar Project */}
      <Route path="/projects/money-radar" element={<MoneyRadarLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="themes" element={<Themes />} />
        <Route path="themes/:id" element={<ThemeDetail />} />
        <Route path="signals" element={<Signals />} />
        <Route path="posts" element={<Posts />} />
      </Route>
      
      {/* Census 2021 Project */}
      <Route path="/projects/census-2021" element={<Census2021Layout />}>
        <Route index element={<CensusDashboard />} />
        <Route path="correlations" element={<Correlations />} />
        <Route path="employment" element={<Employment />} />
        <Route path="demographics" element={<Demographics />} />
        <Route path="wards" element={<WardExplorer />} />
      </Route>
    </Routes>
  )
}
