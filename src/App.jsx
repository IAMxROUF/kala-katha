import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Auth from './pages/Auth.jsx'
import Explore from './pages/Explore.jsx'
import CraftDetail from './pages/CraftDetail.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DocumentFlow from './pages/Document/index.jsx'
import DesignSystem from './pages/DesignSystem.jsx'
import NotFound from './pages/NotFound.jsx'
import RequireAuth from './components/RequireAuth.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/craft/:id" element={<CraftDetail />} />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/document/*"
          element={
            <RequireAuth role="artisan">
              <DocumentFlow />
            </RequireAuth>
          }
        />

        <Route path="/design-system" element={<DesignSystem />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  )
}
