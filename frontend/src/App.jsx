import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Pricing from './pages/Pricing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Ask from './pages/Ask'
import See from './pages/See'
import Predict from './pages/Predict'
import Reports from './pages/Reports'
import Cases from './pages/Cases'
import Insights from './pages/Insights'
import Notifications from './pages/Notifications'
import Settings, {
  SettingsOrganization,
  SettingsProfile,
  SettingsSecurity,
} from './pages/Settings'
import Billing from './pages/Billing'
import Admin, { AdminAudit, AdminHealth, AdminUsers } from './pages/Admin'
import Help from './pages/Help'

function Verify() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-wordmark">ARGUS</div>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>
            Email verification is enabled for self-serve signup. Pilot demo accounts are pre-verified —{' '}
            <a href="/login">sign in</a> to continue.
          </p>
        </div>
      </div>
    </div>
  )
}

function Onboarding() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-wordmark">ARGUS</div>
          <h2 style={{ marginTop: 16 }}>Station setup</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Your org is ready for the pilot. Open Ask to start querying audited case records.
          </p>
          <a href="/app/ask" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>
            Enter ARGUS
          </a>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/onboarding" element={<Onboarding />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="ask" replace />} />
        <Route path="ask" element={<Ask />} />
        <Route path="see" element={<See />} />
        <Route
          path="predict"
          element={
            <ProtectedRoute roles={['analyst', 'admin']}>
              <Predict />
            </ProtectedRoute>
          }
        />
        <Route path="reports" element={<Reports />} />
        <Route path="transactions" element={<Cases />} />
        <Route path="insights" element={<Insights />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />}>
          <Route path="profile" element={<SettingsProfile />} />
          <Route path="billing" element={<Billing />} />
          <Route path="organization" element={<SettingsOrganization />} />
          <Route path="security" element={<SettingsSecurity />} />
        </Route>
        <Route path="billing" element={<Billing />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <Admin />
            </ProtectedRoute>
          }
        >
          <Route path="users" element={<AdminUsers />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="health" element={<AdminHealth />} />
        </Route>
        <Route path="help" element={<Help />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
