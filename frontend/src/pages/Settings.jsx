import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

function ProfileSettings() {
  const { user } = useAuth()
  return (
    <div className="panel panel-pad">
      <h3>Profile</h3>
      <div className="form-group">
        <label className="form-label">Full name</label>
        <input className="form-input" value={user?.full_name || ''} readOnly />
      </div>
      <div className="form-group">
        <label className="form-label">Email</label>
        <input className="form-input" value={user?.email || ''} readOnly />
      </div>
      <div className="form-group">
        <label className="form-label">Role</label>
        <input className="form-input" value={user?.role || ''} readOnly />
      </div>
      <p className="form-hint">Profile edits are managed by your station admin in this pilot.</p>
    </div>
  )
}

function OrganizationSettings() {
  return (
    <div className="panel panel-pad">
      <h3>Organization</h3>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Station and org setup is available after onboarding. Contact your admin to change seats or org name.
      </p>
      <div className="form-group" style={{ marginTop: 16 }}>
        <label className="form-label">Org name</label>
        <input className="form-input" defaultValue="ARGUS Pilot Station" />
      </div>
      <button type="button" className="btn btn-primary">Save</button>
    </div>
  )
}

function SecuritySettings() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="panel panel-pad">
      <h3>Security & appearance</h3>
      <div className="form-group">
        <label className="form-label">Theme</label>
        <select
          className="form-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        >
          <option value="light">Light (default)</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <p className="form-hint">
        Sessions use JWT. Sign out from the user menu to clear the local token.
      </p>
    </div>
  )
}

export function SettingsProfile() {
  return <ProfileSettings />
}

export function SettingsOrganization() {
  return <OrganizationSettings />
}

export function SettingsSecurity() {
  return <SecuritySettings />
}

export default function Settings() {
  const location = useLocation()
  const isRoot = location.pathname === '/app/settings'

  return (
    <div className="app-content narrow">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="page-subtitle">Account, organization, and security</p>
        </div>
      </div>

      <nav className="settings-nav">
        <NavLink to="/app/settings" end className={({ isActive }) => (isActive || isRoot ? 'active' : '')}>
          Profile
        </NavLink>
        <NavLink to="/app/settings/billing">Billing</NavLink>
        <NavLink to="/app/settings/organization">Organization</NavLink>
        <NavLink to="/app/settings/security">Security</NavLink>
      </nav>

      {isRoot ? <ProfileSettings /> : <Outlet />}
    </div>
  )
}
