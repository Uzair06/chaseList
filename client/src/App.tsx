import { Navigate, Outlet, Route, Routes, Link } from 'react-router-dom'
import { useAuth } from './auth-context.ts'
import { AppLayout } from './components/AppLayout.tsx'
import { Spinner } from './components/ui.tsx'
import { AuthPage } from './pages/AuthPages.tsx'
import { ClientDetailPage } from './pages/ClientDetailPage.tsx'
import { ClientFormPage } from './pages/ClientFormPage.tsx'
import { ClientsPage } from './pages/ClientsPage.tsx'
import { DashboardPage } from './pages/DashboardPage.tsx'
import { LandingPage } from './pages/LandingPage.tsx'
import { RequestDetailPage } from './pages/RequestDetailPage.tsx'
import { RequestFormPage } from './pages/RequestFormPage.tsx'
import { RequestStartPage } from './pages/RequestStartPage.tsx'
import { RequestsPage } from './pages/RequestsPage.tsx'
import { UploadPage } from './pages/UploadPage.tsx'

function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner label="Loading your workspace" />
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

function NotFoundPage() {
  return <main className="flex min-h-screen flex-col items-center justify-center bg-[#f7f9fb] px-5 text-center"><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#19875b]">404 · Page not found</p><h1 className="mt-3 text-3xl font-medium tracking-[-.04em] text-[#223149]">That page isn’t here.</h1><p className="mt-2 text-sm text-[#83909e]">The link may have moved or expired.</p><Link to="/" className="mt-6 rounded-lg bg-[#19875b] px-4 py-2.5 text-sm font-medium text-white">Go to ChaseList</Link></main>
}

function App() {
  const { user } = useAuth()
  return <Routes>
    <Route path="/" element={user ? <Navigate to="/app/dashboard" replace /> : <LandingPage />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/upload/:token" element={<UploadPage />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/new" element={<ClientFormPage />} />
        <Route path="clients/:clientId/edit" element={<ClientFormPage />} />
        <Route path="clients/:clientId/requests/new" element={<RequestFormPage />} />
        <Route path="clients/:clientId" element={<ClientDetailPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="requests/new" element={<RequestStartPage />} />
        <Route path="requests/:requestId" element={<RequestDetailPage />} />
      </Route>
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
}

export default App
