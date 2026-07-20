import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

export default function Notifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const rows = await api.notifications()
      setItems(Array.isArray(rows) ? rows : [])
    } catch (err) {
      setError(err.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id)
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch (err) {
      setError(err.message || 'Failed to mark read')
    }
  }

  return (
    <div className="app-content narrow">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p className="page-subtitle">Anomalies, quota, and station alerts</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={load}>Refresh</button>
      </div>

      {error && <div className="inline-alert" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="spinner" />
      ) : items.length === 0 ? (
        <div className="empty-state panel">
          <h3>All clear</h3>
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((n) => (
            <div
              key={n.id}
              className="panel panel-pad"
              style={{
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
                opacity: n.read ? 0.7 : 1,
                borderLeft: n.read ? undefined : '3px solid var(--color-accent)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <strong>{n.title}</strong>
                  {n.kind && <span className="badge">{n.kind}</span>}
                  {!n.read && <span className="badge badge-amber">New</span>}
                </div>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>{n.body}</p>
                {n.created_at && (
                  <div className="mono" style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                )}
              </div>
              {!n.read && (
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => markRead(n.id)}>
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
