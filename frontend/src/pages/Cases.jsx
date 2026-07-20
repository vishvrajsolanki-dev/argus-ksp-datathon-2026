import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useCrossLink } from '../context/CrossLinkContext'

export default function Cases() {
  const navigate = useNavigate()
  const { pinToAsk } = useCrossLink()
  const [graph, setGraph] = useState(null)
  const [heatmap, setHeatmap] = useState(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [g, hm] = await Promise.all([api.graph(), api.heatmap().catch(() => null)])
        if (!cancelled) {
          setGraph(g)
          setHeatmap(hm)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load cases')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const cases = useMemo(() => {
    const nodes = graph?.nodes || []
    const caseNodes = nodes.filter((n) => n.kind === 'case')
    const edges = graph?.edges || []
    return caseNodes.map((c) => {
      const locEdge = edges.find((e) => e.source === c.id && e.rel === 'occurred_at')
      const loc = locEdge ? nodes.find((n) => n.id === locEdge.target) : null
      return {
        id: c.id,
        fir: c.label,
        category: c.category,
        zone: loc?.label || loc?.id?.replace('loc:', '') || '—',
        zone_id: loc?.id?.replace('loc:', '') || null,
      }
    })
  }, [graph])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cases
    return cases.filter(
      (c) =>
        c.fir?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.zone?.toLowerCase().includes(q),
    )
  }, [cases, query])

  const zones = useMemo(() => {
    return [...(heatmap?.points || [])].sort((a, b) => b.intensity - a.intensity)
  }, [heatmap])

  const openAsk = async (caseRow) => {
    await pinToAsk({ case_ref: caseRow.fir, zone_id: caseRow.zone_id })
    navigate('/app/ask')
  }

  return (
    <div className="app-content">
      <div className="page-header">
        <div>
          <h1>Cases</h1>
          <p className="page-subtitle">Searchable incident and case graph</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
          <label className="form-label" htmlFor="search">Search</label>
          <input
            id="search"
            className="form-input"
            placeholder="FIR, category, zone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="inline-alert" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="spinner" />
      ) : (
        <>
          <div className="table-wrap" style={{ marginBottom: 32 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>FIR</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{c.fir}</td>
                    <td>{c.category || '—'}</td>
                    <td>{c.zone}</td>
                    <td>
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => openAsk(c)}>
                        Ask
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      {cases.length === 0
                        ? 'No cases in graph — showing zones from heatmap below.'
                        : 'No matches'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {cases.length === 0 && zones.length > 0 && (
            <>
              <h3 style={{ marginBottom: 12 }}>Zones (from heatmap)</h3>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Zone</th>
                      <th>Intensity</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {zones.map((z) => (
                      <tr key={z.zone_id}>
                        <td className="mono">{z.zone_id}</td>
                        <td className="mono">{Number(z.intensity).toFixed(1)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={async () => {
                              await pinToAsk({ zone_id: z.zone_id })
                              navigate('/app/ask')
                            }}
                          >
                            Ask
                          </button>
                        </td>
                      </tr>
                    ))}
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
