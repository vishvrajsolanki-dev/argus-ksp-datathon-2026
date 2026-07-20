import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Reports() {
  const { isAdmin } = useAuth()
  const [heatmap, setHeatmap] = useState(null)
  const [audit, setAudit] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const hm = await api.heatmap()
        if (!cancelled) setHeatmap(hm)
        if (isAdmin) {
          try {
            const recent = await api.auditRecent()
            if (!cancelled) setAudit(Array.isArray(recent) ? recent : [])
          } catch {
            /* optional for non-admin path */
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load reports')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  const exportAudit = async () => {
    setExporting(true)
    setError('')
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

  const points = [...(heatmap?.points || [])].sort((a, b) => b.intensity - a.intensity)

  return (
    <div className="app-content narrow">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p className="page-subtitle">Zone intensity summary and audit exports</p>
        </div>
        {isAdmin && (
          <button type="button" className="btn btn-primary" onClick={exportAudit} disabled={exporting}>
            <Download size={16} />
            {exporting ? 'Exporting…' : 'Export audit CSV'}
          </button>
        )}
      </div>

      {error && <div className="inline-alert" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="spinner" />
      ) : (
        <>
          <h3 style={{ marginBottom: 12 }}>Zone intensity</h3>
          <div className="table-wrap" style={{ marginBottom: 32 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Lat</th>
                  <th>Lng</th>
                  <th>Intensity</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.zone_id}>
                    <td className="mono">{p.zone_id}</td>
                    <td className="mono">{Number(p.lat).toFixed(4)}</td>
                    <td className="mono">{Number(p.lng).toFixed(4)}</td>
                    <td className="mono">{Number(p.intensity).toFixed(1)}</td>
                  </tr>
                ))}
                {points.length === 0 && (
                  <tr>
                    <td colSpan={4}>No zone data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {isAdmin && (
            <>
              <h3 style={{ marginBottom: 12 }}>Recent audit</h3>
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
                    {audit.map((row) => (
                      <tr key={row.id}>
                        <td className="mono">{row.timestamp ? new Date(row.timestamp).toLocaleString() : '—'}</td>
                        <td>{row.role}</td>
                        <td>{row.action_type}</td>
                        <td className="mono" style={{ fontSize: 11 }}>{row.endpoint}</td>
                        <td>{row.request_summary}</td>
                      </tr>
                    ))}
                    {audit.length === 0 && (
                      <tr>
                        <td colSpan={5}>No audit rows</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
