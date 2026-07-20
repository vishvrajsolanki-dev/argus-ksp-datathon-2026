import { Link } from 'react-router-dom'

export default function Help() {
  return (
    <div className="app-content narrow">
      <div className="page-header">
        <div>
          <h1>Help</h1>
          <p className="page-subtitle">Ethics, DPDP, and how ARGUS works</p>
        </div>
      </div>

      <div className="panel panel-pad" style={{ marginBottom: 16 }}>
        <h3>Ask · See · Predict</h3>
        <p style={{ color: 'var(--color-text-muted)' }}>
          <strong>Ask</strong> returns cited answers. The critic removes unsupported claims before you see them.
          <br />
          <strong>See</strong> shows zone intensity on a map. Click a zone to open Ask with that context.
          <br />
          <strong>Predict</strong> scores zone-time risk only — never individuals.
        </p>
      </div>

      <div className="panel panel-pad" style={{ marginBottom: 16 }}>
        <h3>Ethics & DPDP</h3>
        <ul style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, paddingLeft: 18 }}>
          <li>Person references in the graph are synthetic labels, not real identities for scoring.</li>
          <li>PREDICT inputs are zone, hour, and day-of-week — no person-level features.</li>
          <li>Every ASK/SEE/PREDICT action writes an audit row with user and role.</li>
          <li>Process personal data only under lawful station authority and retention policy.</li>
        </ul>
      </div>

      <div className="panel panel-pad" style={{ marginBottom: 16 }}>
        <h3>Demo accounts</h3>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          investigator@example.com / pilot123
          <br />
          analyst@example.com / pilot123
          <br />
          admin@example.com / pilot123
        </p>
      </div>

      <div className="panel panel-pad">
        <h3>Shortcuts</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to="/app/ask" className="btn btn-ghost btn-sm">Ask</Link>
          <Link to="/app/see" className="btn btn-ghost btn-sm">See</Link>
          <Link to="/app/predict" className="btn btn-ghost btn-sm">Predict</Link>
          <Link to="/app/notifications" className="btn btn-ghost btn-sm">Notifications</Link>
        </div>
      </div>
    </div>
  )
}
