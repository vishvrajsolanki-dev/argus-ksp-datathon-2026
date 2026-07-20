import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useCrossLink } from '../context/CrossLinkContext'

const ZONES = [
  'BLR-MG',
  'BLR-IND',
  'BLR-WHT',
  'BLR-KOR',
  'BLR-JAY',
  'BLR-MAL',
  'BLR-ELE',
  'BLR-YEL',
]

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Predict() {
  const { canPredict, loading: authLoading } = useAuth()
  const { resolved } = useCrossLink()
  const [zoneId, setZoneId] = useState(resolved?.zone_id || 'BLR-MG')
  const [hour, setHour] = useState(20)
  const [dow, setDow] = useState(5)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (resolved?.zone_id) setZoneId(resolved.zone_id)
  }, [resolved?.zone_id])

  const run = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.predict({ zone_id: zoneId, hour: Number(hour), dow: Number(dow) })
      setResult(res)
    } catch (err) {
      setError(err.message || 'Predict failed')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [zoneId, hour, dow])

  useEffect(() => {
    if (canPredict) run()
  }, [canPredict]) // initial load only; eslint-disable intentional

  const shapSorted = useMemo(() => {
    const vals = [...(result?.shap_values || [])]
    return vals.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
  }, [result])

  const maxAbs = Math.max(0.01, ...shapSorted.map((s) => Math.abs(s.contribution)))

  if (authLoading) {
    return (
      <div className="app-content">
        <div className="spinner" />
      </div>
    )
  }

  if (!canPredict) {
    return <Navigate to="/app/ask" replace />
  }

  return (
    <div className="app-content">
      <div className="page-header">
        <div>
          <h1>Predict</h1>
          <p className="page-subtitle">Zone-time risk with feature contributions</p>
        </div>
      </div>

      <div className="predict-grid">
        <div className="panel panel-pad">
          <h3>Parameters</h3>
          <div className="form-group">
            <label className="form-label" htmlFor="zone">Zone</label>
            <select id="zone" className="form-select" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
              {ZONES.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="hour">Hour (0–23)</label>
            <input
              id="hour"
              className="form-input"
              type="number"
              min={0}
              max={23}
              value={hour}
              onChange={(e) => setHour(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="dow">Day of week</label>
            <select id="dow" className="form-select" value={dow} onChange={(e) => setDow(e.target.value)}>
              {DOW_LABELS.map((label, i) => (
                <option key={label} value={i}>{label}</option>
              ))}
            </select>
          </div>
          <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={run} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Run prediction'}
          </button>
        </div>

        <div>
          {error && <div className="inline-alert" style={{ marginBottom: 16 }}>{error}</div>}

          <div className="panel panel-pad" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>Risk score</div>
                <div className="risk-kpi">
                  {result ? Number(result.risk_score).toFixed(3) : '—'}
                </div>
                {result && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge mono">{result.zone_id}</span>
                    <span className="badge">{result.time_window}</span>
                    {result.confidence && <span className="badge badge-info">{result.confidence}</span>}
                    {result.model && <span className="badge">{result.model}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="panel panel-pad">
            <h3>SHAP contributions</h3>
            {!result && !loading && (
              <p className="page-subtitle">Run a prediction to see feature drivers.</p>
            )}
            {loading && !result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="skeleton" />
                <div className="skeleton" style={{ width: '80%' }} />
                <div className="skeleton" style={{ width: '60%' }} />
              </div>
            )}
            {shapSorted.map((s, i) => (
              <div className="shap-row" key={s.feature}>
                <span>{s.feature}</span>
                <div className="shap-bar-track">
                  <div
                    className={`shap-bar-fill ${i === 0 ? 'top' : ''}`}
                    style={{ width: `${(Math.abs(s.contribution) / maxAbs) * 100}%` }}
                  />
                </div>
                <span className="mono" style={{ textAlign: 'right' }}>
                  {s.contribution > 0 ? '+' : ''}
                  {Number(s.contribution).toFixed(3)}
                </span>
              </div>
            ))}
          </div>

          <div className="banner banner-warning ethics-note">
            <strong>Ethics</strong>
            <span>Zone-time only — never person-level.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
