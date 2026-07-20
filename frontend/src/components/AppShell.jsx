import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MessageSquare,
  Moon,
  Settings,
  Shield,
  Sun,
  TrendingUp,
  FileText,
  Lightbulb,
  Briefcase,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCrossLink } from '../context/CrossLinkContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../api/client'

const FACES = [
  { to: '/app/ask', label: 'Ask', icon: MessageSquare },
  { to: '/app/see', label: 'See', icon: Map },
  { to: '/app/predict', label: 'Predict', icon: TrendingUp, roles: ['analyst', 'admin'] },
]

const SECONDARY = [
  { to: '/app/reports', label: 'Reports', icon: FileText },
  { to: '/app/transactions', label: 'Cases', icon: Briefcase },
  { to: '/app/insights', label: 'Insights', icon: Lightbulb },
]

const TITLES = {
  '/app/ask': 'Ask',
  '/app/see': 'See',
  '/app/predict': 'Predict',
  '/app/reports': 'Reports',
  '/app/transactions': 'Cases',
  '/app/insights': 'Insights',
  '/app/notifications': 'Notifications',
  '/app/settings': 'Settings',
  '/app/settings/profile': 'Profile',
  '/app/settings/billing': 'Billing',
  '/app/settings/organization': 'Organization',
  '/app/settings/security': 'Security',
  '/app/billing': 'Billing',
  '/app/admin': 'Admin',
  '/app/admin/users': 'Users',
  '/app/admin/audit': 'Audit',
  '/app/admin/health': 'Health',
  '/app/help': 'Help',
}

export default function AppShell() {
  const { user, logout, canPredict, isAdmin } = useAuth()
  const { pin, resolved, clearPin } = useCrossLink()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const menuRef = useRef(null)

  useEffect(() => {
    setSidebarOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    let cancelled = false
    api
      .notifications()
      .then((rows) => {
        if (!cancelled && Array.isArray(rows)) {
          setUnread(rows.filter((n) => !n.read).length)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [location.pathname])

  useEffect(() => {
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const title =
    TITLES[location.pathname] ||
    Object.entries(TITLES).find(([k]) => location.pathname.startsWith(k))?.[1] ||
    'ARGUS'

  const initials = (user?.full_name || user?.email || 'U')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const faces = FACES.filter((f) => !f.roles || f.roles.includes(user?.role))

  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link to="/app/ask" className="sidebar-brand">
          <div className="brand-mark" aria-hidden>
            <span /><span /><span />
          </div>
          <span className="brand-wordmark">ARGUS</span>
        </Link>

        <nav className="sidebar-nav" aria-label="Primary">
          <div className="sidebar-section-label">Faces</div>
          {faces.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} strokeWidth={1.5} />
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="sidebar-section-label">Workspace</div>
          {SECONDARY.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} strokeWidth={1.5} />
              <span>{label}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="sidebar-section-label">Admin</div>
              <NavLink
                to="/app/admin"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Shield size={18} strokeWidth={1.5} />
                <span>Admin</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/app/settings"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Settings size={18} strokeWidth={1.5} />
            <span>Settings</span>
          </NavLink>
          <NavLink
            to="/app/help"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <HelpCircle size={18} strokeWidth={1.5} />
            <span>Help</span>
          </NavLink>
          <button type="button" className="nav-link" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="app-main-wrap">
        <header className="app-topbar">
          <button
            type="button"
            className="icon-btn menu-toggle"
            aria-label="Open menu"
            onClick={() => setSidebarOpen((o) => !o)}
          >
            {sidebarOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>

          <div className="topbar-title">{title}</div>

          {(pin || resolved) && (
            <div className="crosslink-chips">
              {resolved?.zone_id && (
                <span className="chip">
                  Zone <code className="mono">{resolved.zone_id}</code>
                  <button type="button" className="chip-clear" onClick={clearPin} aria-label="Clear pin">
                    <X size={12} />
                  </button>
                </span>
              )}
              {(resolved?.case_ref || pin?.case_ref) && (
                <span className="chip">
                  Case <code className="mono">{resolved?.case_ref || pin?.case_ref}</code>
                  <button type="button" className="chip-clear" onClick={clearPin} aria-label="Clear pin">
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
          )}

          <Link to="/app/notifications" className="icon-btn" aria-label="Notifications">
            <Bell size={18} strokeWidth={1.5} />
            {unread > 0 && <span className="notif-dot" />}
          </Link>

          <div className="user-menu" ref={menuRef}>
            <button
              type="button"
              className="user-menu-btn"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
            >
              <span className="avatar">{initials}</span>
              <span className="hide-mobile" style={{ fontSize: 13 }}>
                {user?.full_name || user?.email}
              </span>
            </button>
            {menuOpen && (
              <div className="dropdown">
                <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  <div>{user?.email}</div>
                  <span className="badge" style={{ marginTop: 4 }}>{user?.role}</span>
                </div>
                <Link to="/app/settings">Settings</Link>
                <Link to="/app/billing">Billing</Link>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <LogOut size={14} /> Sign out
                  </span>
                </button>
              </div>
            )}
          </div>
        </header>

        <Outlet />
      </div>

      <nav className="mobile-faces" aria-label="Faces">
        {faces.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <Icon size={20} strokeWidth={1.5} />
            {label}
          </NavLink>
        ))}
        {!canPredict && (
          <span style={{ flex: 1, opacity: 0.35, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--color-sidebar-muted)' }}>
            <TrendingUp size={20} strokeWidth={1.5} />
            Predict
          </span>
        )}
        <Link to="/app/insights">
          <LayoutDashboard size={20} strokeWidth={1.5} />
          More
        </Link>
      </nav>
    </div>
  )
}
