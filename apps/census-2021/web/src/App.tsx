import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import CensusDashboard from './pages/CensusDashboard'
import Correlations from './pages/Correlations'
import Employment from './pages/Employment'
import Demographics from './pages/Demographics'
import WardExplorer from './pages/WardExplorer'

const navItems = [
  { name: 'Overview', path: '/' },
  { name: 'Correlations', path: '/correlations' },
  { name: 'Employment', path: '/employment' },
  { name: 'Demographics', path: '/demographics' },
  { name: 'Ward Explorer', path: '/wards' },
]

export default function App() {
  return (
    <Routes>
      <Route element={<Layout projectName="Census 2021 Analysis" navItems={navItems} />}>
        <Route index element={<CensusDashboard />} />
        <Route path="correlations" element={<Correlations />} />
        <Route path="employment" element={<Employment />} />
        <Route path="demographics" element={<Demographics />} />
        <Route path="wards" element={<WardExplorer />} />
      </Route>
    </Routes>
  )
}
