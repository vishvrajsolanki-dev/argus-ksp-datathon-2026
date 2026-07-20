import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Download } from 'lucide-react'
import { api } from '../api/client'

function UsersPanel() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await api.adminUsers()
        if (!cancelled) setUsers(Array.isArray(rows) ? rows : [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load users')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <div className="spinner" />
  if (error) return <div className="inline-alert">{error}</div>

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Org</th>
            <th>Verified</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.full_name}</td>
              <td>{u.email}</td>
              <td><span className="badge">{u.role}</span></td>
              <td>{u.org_name || '—'}</td>
              <td>{u.is_verified ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AuditPanel() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api.auditRecent()
        if (!cancelled) setRows(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load audit')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const exportCsv = async () => {
    setExporting(true)
    try {
      const csv = await api.auditExport()
      const blob = new Blob([typeof csv === 'string' ? csv : String(csv)], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `argus-audit-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <div className="spinner" />

  return (
    <>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-primary" onClick={exportCsv} disabled={exporting}>
          <Download size={16} /> Export CSV
        </button>
      </div>
      {error && <div className="inline-alert" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Role</th>
              <th>Action</th>
              <th>Endpoint</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="mono">{r.timestamp ? new Date(r.timestamp).toLocaleString() : '—'}</td>
                <td>{r.role}</td>
                <td>{r.action_type}</td>
                <td className="mono" style={{ fontSize: 11 }}>{r.endpoint}</td>
                <td>{r.request_summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function HealthPanel() {
  const [detail, setDetail] = useState(null)
  const [health, setHealth] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [h, d] = await Promise.all([api.health(), api.healthDetail()])
        if (!cancelled) {
          setHealth(h)
          setDetail(d)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Health check failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <div className="spinner" />
  if (error) return <div className="inline-alert">{error}</div>

  const counts = detail?.counts || {}

  return (
    <div>
      <div className="banner banner-success" style={{ marginBottom: 16 }}>
        <strong>Status</strong>
        <span>{health?.status || detail?.status || 'ok'} · {health?.service || 'argus'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 16 }}>
        {Object.entries(counts).map(([k, v]) => (
          <div key={k} className="panel panel-pad">
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{k}</div>
            <div className="kpi-num" style={{ fontSize: 24 }}>{v}</div>
          </div>
        ))}
      </div>
      {detail?.canary && (
        <div className="banner banner-info">
          <strong>Canary FIR</strong>
          <code className="mono">{detail.canary}</code>
        </div>
      )}
    </div>
  )
}

export function AdminUsers() {
  return <UsersPanel />
}

export function AdminAudit() {
  return <AuditPanel />
}

export function AdminHealth() {
  return <HealthPanel />
}

export default function Admin() {
  const location = useLocation()
  const isRoot = location.pathname === '/app/admin'

  return (
    <div className="app-content narrow">
      <div className="page-header">
        <div>
          <h1>Admin</h1>
          <p className="page-subtitle">Users, audit, and system health</p>
        </div>
      </div>

      <nav className="settings-nav">
        <NavLink to="/app/admin" end>Users</NavLink>
        <NavLink to="/app/admin/audit">Audit</NavLink>
        <NavLink to="/app/admin/health">Health</NavLink>
      </nav>

      {isRoot ? <UsersPanel /> : <Outlet />}
    </div>
  )
}
