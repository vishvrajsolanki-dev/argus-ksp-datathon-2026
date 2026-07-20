import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CriticCorrection from '../components/CriticCorrection'

const DEMO_CORRECTION = {
  triggered: true,
  original_claim: 'FIR-2024-8841 involved a firearm recovered at the scene.',
  flag_reason: 'No retrieved record supports weapon=firearm for FIR-2024-8841.',
  corrected_claim:
    'Correction: No weapon was reported for FIR-2024-8841. The earlier weapon claim was unsupported by retrieved records.',
}

const FAQ = [
  {
    q: 'What is the critic?',
    a: 'Before an answer reaches you, ARGUS checks every claim against retrieved case records. Unsupported claims are struck and replaced — visibly, not silently.',
  },
  {
    q: 'Does PREDICT score people?',
    a: 'No. Risk scores are zone-time only. Never person-level. That constraint is sticky in the product UI and enforced in the model inputs.',
  },
  {
    q: 'Who can export the audit log?',
    a: 'Admins only. Every ASK, SEE, and PREDICT action writes an immutable audit row with user, role, and source records.',
  },
  {
    q: 'Is this ready for production stations?',
    a: 'Pilot tier is built for station evaluation: JWT auth, RBAC, cited answers, heatmap, and zone-time risk. Command rollout is contact sales.',
  },
]

export default function Landing() {
  const [showCritic, setShowCritic] = useState(false)
  const criticRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setShowCritic(true), 600)
    return () => clearTimeout(t)
  }, [])

  const scrollToCritic = () => {
    setShowCritic(true)
    criticRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="brand-mark" aria-hidden>
            <span /><span /><span />
          </div>
          <span className="brand-wordmark" style={{ color: '#E8EEF4' }}>ARGUS</span>
        </div>
        <div className="landing-nav-links">
          <a href="#features" className="hide-mobile">Features</a>
          <a href="#pricing" className="hide-mobile">Pricing</a>
          <a href="#faq" className="hide-mobile">FAQ</a>
          <Link to="/login">Sign in</Link>
          <Link to="/signup" className="btn btn-sm btn-primary" style={{ background: '#fff', color: '#0B1F33', borderColor: '#fff' }}>
            Start pilot
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-brand">ARGUS</div>
            <h1 className="hero-headline">One question. Three faces. One audited truth.</h1>
            <p className="hero-sub">
              Ask. See. Predict. Crime intelligence with a visible critic — every claim cited, every action audited.
            </p>
            <div className="hero-ctas">
              <Link to="/signup" className="btn btn-primary">Start pilot</Link>
              <button type="button" className="btn btn-ghost" onClick={scrollToCritic}>
                Watch critic demo
              </button>
            </div>
          </div>
          <div className="hero-visual" ref={criticRef}>
            <div style={{ color: '#9BB0C3', fontSize: 12, marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Live critic moment
            </div>
            <div style={{ background: 'rgba(10,18,27,0.55)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: 16 }}>
              <p style={{ margin: '0 0 12px', fontSize: 14, color: '#E8EEF4', lineHeight: 1.5 }}>
                Summarize weapon involvement in recent MG Road cases…
              </p>
              {showCritic && <CriticCorrection correction={DEMO_CORRECTION} />}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="features">
        <h2>Three faces. One spine.</h2>
        <p className="section-lead">
          Shared case data powers Ask, See, and Predict — so investigators never chase conflicting truths.
        </p>
        <div className="feature-row">
          <div className="feature-block">
            <span className="badge badge-info">Ask</span>
            <h3>Cited answers</h3>
            <p>
              Dual-pane chat with source excerpts. The critic strips unsupported claims before you see the reply.
            </p>
          </div>
          <div className="feature-block">
            <span className="badge badge-info">See</span>
            <h3>Zone heatmap</h3>
            <p>
              Intensity by zone from incident density. Click a hotspot to open Ask with zone context already pinned.
            </p>
          </div>
          <div className="feature-block">
            <span className="badge badge-info">Predict</span>
            <h3>Zone-time risk</h3>
            <p>
              Risk score plus SHAP drivers. Ethics note is sticky: zone-time only — never person-level.
            </p>
          </div>
        </div>
      </section>

      <section className="demo-strip">
        <div className="landing-section" style={{ paddingTop: 48, paddingBottom: 48 }}>
          <h2>Built for command precision</h2>
          <p className="section-lead">
            Framed for Datathon / KSP-style evaluation: dense ops UI, cool gray surfaces, amber reserved for the critic.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            <div>
              <div className="kpi-num" style={{ fontSize: 28 }}>JWT</div>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 13 }}>Stateless auth + RBAC</p>
            </div>
            <div>
              <div className="kpi-num" style={{ fontSize: 28 }}>3</div>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 13 }}>Investigator · Analyst · Admin</p>
            </div>
            <div>
              <div className="kpi-num" style={{ fontSize: 28 }}>1</div>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 13 }}>Audited truth per query</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="pricing">
        <h2>Pricing</h2>
        <p className="section-lead">Start with a station pilot. Scale seats when command is ready.</p>
        <div className="pricing-grid">
          <div className="pricing-tier">
            <h3>Pilot</h3>
            <div className="pricing-price">₹0</div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>10 seats · 500 ASK / month</p>
            <ul style={{ paddingLeft: 18, color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.8 }}>
              <li>Ask + See</li>
              <li>Critic corrections</li>
              <li>Audit trail</li>
            </ul>
            <Link to="/signup" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>Start pilot</Link>
          </div>
          <div className="pricing-tier featured">
            <h3>Station</h3>
            <div className="pricing-price">Contact</div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>50 seats · 5,000 ASK / month</p>
            <ul style={{ paddingLeft: 18, color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.8 }}>
              <li>Everything in Pilot</li>
              <li>Predict (Analyst+)</li>
              <li>Org billing</li>
            </ul>
            <Link to="/signup" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>Request Station</Link>
          </div>
          <div className="pricing-tier">
            <h3>Command</h3>
            <div className="pricing-price">Contact</div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>200 seats · 50,000 ASK / month</p>
            <ul style={{ paddingLeft: 18, color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.8 }}>
              <li>Everything in Station</li>
              <li>Audit export</li>
              <li>Dedicated onboarding</li>
            </ul>
            <a href="mailto:pilot@argus.local" className="btn btn-ghost" style={{ width: '100%', marginTop: 16 }}>Contact sales</a>
          </div>
        </div>
      </section>

      <section className="landing-section" id="faq">
        <h2>FAQ</h2>
        <p className="section-lead">Short answers. Cite sources. Never hype risk scores.</p>
        <div className="faq-list">
          {FAQ.map((item) => (
            <details key={item.q} className="faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <span className="brand-wordmark">ARGUS</span>
        Ask. See. Predict. One audited truth.
        <div style={{ marginTop: 16, display: 'flex', gap: 24, justifyContent: 'center' }}>
          <Link to="/login" style={{ color: '#9BB0C3' }}>Sign in</Link>
          <Link to="/pricing" style={{ color: '#9BB0C3' }}>Pricing</Link>
          <a href="#faq" style={{ color: '#9BB0C3' }}>FAQ</a>
        </div>
      </footer>
    </div>
  )
}
