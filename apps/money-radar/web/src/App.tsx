import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Themes from './pages/Themes'
import ThemeDetail from './pages/ThemeDetail'
import Signals from './pages/Signals'
import Posts from './pages/Posts'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout projectName="Money Radar" />}>
        <Route index element={<Dashboard />} />
        <Route path="themes" element={<Themes />} />
        <Route path="themes/:id" element={<ThemeDetail />} />
        <Route path="signals" element={<Signals />} />
        <Route path="posts" element={<Posts />} />
      </Route>
    </Routes>
  )
}
