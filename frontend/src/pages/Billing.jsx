import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function Billing() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.billing()
        if (!cancelled) setData(res)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load billing')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const sub = data?.subscription
  const plans = data?.plans || []

  return (
    <div className="app-content narrow">
      <div className="page-header">
        <div>
          <h1>Billing</h1>
          <p className="page-subtitle">Subscription and ASK quota</p>
        </div>
      </div>

      {error && <div className="inline-alert" style={{ marginBottom: 16 }}>{error}</div>}
      {loading ? (
        <div className="spinner" />
      ) : (
        <>
          {sub && (
            <div className="panel panel-pad" style={{ marginBottom: 24 }}>
              <h3>{sub.org_name || 'Organization'}</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <span className="badge badge-info">{sub.plan}</span>
                <span className="badge">{sub.status}</span>
                <span className="badge">{sub.seats} seats</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>ASK used</div>
                  <div className="kpi-num" style={{ fontSize: 28 }}>
                    {sub.ask_used ?? 0}
                    <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
                      {' '}/ {sub.ask_quota_monthly ?? '—'}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Quota remaining</div>
                  <div className="kpi-num" style={{ fontSize: 28 }}>
                    {Math.max(0, (sub.ask_quota_monthly || 0) - (sub.ask_used || 0))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <h3 style={{ marginBottom: 12 }}>Plans</h3>
          <div className="pricing-grid">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`pricing-tier ${sub?.plan === p.id ? 'featured' : ''}`}
              >
                <h3>{p.name}</h3>
                <div className="pricing-price">{p.price}</div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                  {p.seats} seats · {p.ask_quota} ASK / month
                </p>
                {sub?.plan === p.id ? (
                  <span className="badge badge-success">Current plan</span>
                ) : (
                  <button type="button" className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }}>
                    Contact to upgrade
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
