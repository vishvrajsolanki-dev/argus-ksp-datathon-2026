import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Insights() {
  const { canPredict } = useAuth()
  const [heatmap, setHeatmap] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [hm, notifs] = await Promise.all([
          api.heatmap(),
          api.notifications().catch(() => []),
        ])
        if (!cancelled) {
          setHeatmap(hm)
          setNotifications(Array.isArray(notifs) ? notifs : [])
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load insights')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const topZones = [...(heatmap?.points || [])]
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 5)
  const anomalies = heatmap?.anomalies || []
  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="app-content narrow">
      <div className="page-header">
        <div>
          <h1>Insights</h1>
          <p className="page-subtitle">Station snapshot across Ask, See, and Predict</p>
        </div>
      </div>

      {error && <div className="inline-alert" style={{ marginBottom: 16 }}>{error}</div>}
      {loading ? (
        <div className="spinner" />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div className="panel panel-pad">
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Zones</div>
              <div className="kpi-num" style={{ fontSize: 32, marginTop: 4 }}>
                {heatmap?.points?.length ?? 0}
              </div>
            </div>
            <div className="panel panel-pad">
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Anomalies</div>
              <div className="kpi-num" style={{ fontSize: 32, marginTop: 4 }}>
                {anomalies.length}
              </div>
            </div>
            <div className="panel panel-pad">
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Unread</div>
              <div className="kpi-num" style={{ fontSize: 32, marginTop: 4 }}>
                {unread}
              </div>
            </div>
          </div>

          <h3 style={{ marginBottom: 12 }}>Top intensity zones</h3>
          <div className="table-wrap" style={{ marginBottom: 32 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Intensity</th>
                </tr>
              </thead>
              <tbody>
                {topZones.map((z) => (
                  <tr key={z.zone_id}>
                    <td className="mono">{z.zone_id}</td>
                    <td className="mono">{Number(z.intensity).toFixed(1)}</td>
                  </tr>
                ))}
                {topZones.length === 0 && (
                  <tr><td colSpan={2}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {anomalies.length > 0 && (
            <>
              <h3 style={{ marginBottom: 12 }}>Anomaly flags</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
                {anomalies.map((a, i) => (
                  <div key={i} className="banner banner-warning">
                    <span className="mono">{a.zone_id}</span>
                    <span>{a.message || `z=${a.z_score} · ${a.time_window}`}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/app/ask" className="btn btn-primary">Open Ask</Link>
            <Link to="/app/see" className="btn btn-ghost">Open See</Link>
            {canPredict && <Link to="/app/predict" className="btn btn-ghost">Open Predict</Link>}
          </div>
        </>
      )}
    </div>
  )
}
