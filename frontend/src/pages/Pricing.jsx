import { Link } from 'react-router-dom'

export default function Pricing() {
  return (
    <div>
      <nav className="landing-nav" style={{ position: 'relative', background: 'var(--color-primary)' }}>
        <Link to="/" style={{ color: '#E8EEF4', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div className="brand-mark" aria-hidden><span /><span /><span /></div>
          <span className="brand-wordmark">ARGUS</span>
        </Link>
        <div className="landing-nav-links">
          <Link to="/login">Sign in</Link>
          <Link to="/signup" className="btn btn-sm btn-primary" style={{ background: '#fff', color: '#0B1F33', borderColor: '#fff' }}>
            Start pilot
          </Link>
        </div>
      </nav>
      <section className="landing-section" id="pricing" style={{ paddingTop: 48 }}>
        <h2>Pricing</h2>
        <p className="section-lead">Start with a station pilot. Scale seats when command is ready.</p>
        <div className="pricing-grid">
          <div className="pricing-tier">
            <h3>Pilot</h3>
            <div className="pricing-price">₹0</div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>10 seats · 500 ASK / month</p>
            <Link to="/signup" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>Start pilot</Link>
          </div>
          <div className="pricing-tier featured">
            <h3>Station</h3>
            <div className="pricing-price">Contact</div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>50 seats · 5,000 ASK / month</p>
            <Link to="/signup" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>Request Station</Link>
          </div>
          <div className="pricing-tier">
            <h3>Command</h3>
            <div className="pricing-price">Contact</div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>200 seats · 50,000 ASK / month</p>
            <a href="mailto:pilot@argus.local" className="btn btn-ghost" style={{ width: '100%', marginTop: 16 }}>Contact sales</a>
          </div>
        </div>
      </section>
      <footer className="landing-footer">
        <span className="brand-wordmark">ARGUS</span>
        <Link to="/" style={{ color: '#9BB0C3' }}>Back to home</Link>
      </footer>
    </div>
  )
}
