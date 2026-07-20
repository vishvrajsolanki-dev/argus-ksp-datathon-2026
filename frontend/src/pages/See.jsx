import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { api } from '../api/client'
import { useCrossLink } from '../context/CrossLinkContext'

function intensityColor(t) {
  // cool blue → danger red
  const r = Math.round(214 + (180 - 214) * t)
  const g = Math.round(228 + (35 - 228) * t)
  const b = Math.round(240 + (24 - 240) * t)
  return `rgb(${r},${g},${b})`
}

function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (!points?.length) return
    const latLngs = points.map((p) => [p.lat, p.lng])
    map.fitBounds(latLngs, { padding: [40, 40], maxZoom: 13 })
  }, [map, points])
  return null
}

export default function See() {
  const navigate = useNavigate()
  const { pinToAsk, pinToPredict, resolved } = useCrossLink()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [district, setDistrict] = useState('all')
  const [windowFilter, setWindowFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.heatmap()
      setData(res)
    } catch (err) {
      setError(err.message || 'Failed to load heatmap')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const zones = useMemo(() => {
    const set = new Set((data?.points || []).map((p) => p.zone_id).filter(Boolean))
    return Array.from(set).sort()
  }, [data])

  const maxIntensity = useMemo(() => {
    const vals = (data?.points || []).map((p) => p.intensity || 0)
    return Math.max(1, ...vals)
  }, [data])

  const points = useMemo(() => {
    let pts = data?.points || []
    if (district !== 'all') pts = pts.filter((p) => p.zone_id === district)
    return pts
  }, [data, district])

  const onZoneClick = async (zone_id) => {
    await pinToAsk({ zone_id })
    navigate('/app/ask')
  }

  const anomalies = data?.anomalies || []

  return (
    <div className="see-layout">
      <div className="see-filters">
        <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
          <label className="form-label" htmlFor="district">District / zone</label>
          <select
            id="district"
            className="form-select"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
            <option value="all">All zones</option>
            {zones.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0, minWidth: 140 }}>
          <label className="form-label" htmlFor="window">Time window</label>
          <select
            id="window"
            className="form-select"
            value={windowFilter}
            onChange={(e) => setWindowFilter(e.target.value)}
          >
            <option value="all">All (batch)</option>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
          </select>
        </div>
        <button type="button" className="btn btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={16} /> Refresh
        </button>
        {data?.last_updated && (
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
            Updated <span className="mono">{new Date(data.last_updated).toLocaleString()}</span>
          </span>
        )}
      </div>

      {anomalies.length > 0 && (
        <div className="banner banner-warning" style={{ margin: 0, borderRadius: 0, borderLeft: 'none', borderRight: 'none' }}>
          <strong>Anomaly</strong>
          <span>
            {anomalies[0].message ||
              `${anomalies[0].zone_id} z=${anomalies[0].z_score} (${anomalies[0].time_window})`}
          </span>
          {anomalies.length > 1 && (
            <span className="badge badge-amber">+{anomalies.length - 1} more</span>
          )}
        </div>
      )}

      {resolved?.zone_id && resolved?.target === 'see' && (
        <div className="banner banner-info" style={{ margin: 0, borderRadius: 0 }}>
          Pinned from ASK — focusing zone <code className="mono">{resolved.zone_id}</code>
          {resolved.case_ref && <> · case <code className="mono">{resolved.case_ref}</code></>}
        </div>
      )}

      {error && (
        <div className="banner banner-danger" style={{ margin: 0, borderRadius: 0 }}>{error}</div>
      )}

      <div className="see-map">
        {loading && !data ? (
          <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p>Loading heatmap…</p>
          </div>
        ) : (
          <MapContainer
            center={[12.9716, 77.5946]}
            zoom={12}
            scrollWheelZoom
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds points={points} />
            {points.map((p) => {
              const t = Math.min(1, (p.intensity || 0) / maxIntensity)
              const radius = 8 + t * 22
              return (
                <CircleMarker
                  key={`${p.zone_id}-${p.lat}-${p.lng}`}
                  center={[p.lat, p.lng]}
                  radius={radius}
                  pathOptions={{
                    color: intensityColor(Math.min(1, t + 0.15)),
                    fillColor: intensityColor(t),
                    fillOpacity: 0.55,
                    weight: 1.5,
                  }}
                  eventHandlers={{
                    click: () => onZoneClick(p.zone_id),
                  }}
                >
                  <Popup>
                    <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', minWidth: 140 }}>
                      <strong className="mono">{p.zone_id}</strong>
                      <div style={{ fontSize: 13, marginTop: 4 }}>
                        Intensity <span className="mono">{Number(p.intensity).toFixed(1)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => onZoneClick(p.zone_id)}
                        >
                          Open in Ask
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={async () => {
                            await pinToPredict({ zone_id: p.zone_id })
                            navigate('/app/predict')
                          }}
                        >
                          Predict
                        </button>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        )}
      </div>
    </div>
  )
}
