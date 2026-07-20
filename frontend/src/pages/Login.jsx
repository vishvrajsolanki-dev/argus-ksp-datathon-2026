import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, authenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('investigator@example.com')
  const [password, setPassword] = useState('pilot123')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && authenticated) {
    return <Navigate to={location.state?.from || '/app/ask'} replace />
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate(location.state?.from || '/app/ask', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark" style={{ justifyContent: 'center', marginBottom: 8 }} aria-hidden>
            <span /><span /><span />
          </div>
          <div className="brand-wordmark">ARGUS</div>
          <p style={{ margin: '8px 0 0', color: 'var(--color-text-muted)', fontSize: 14 }}>
            Sign in to your station workspace
          </p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="form-input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="form-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="inline-alert" style={{ marginBottom: 12 }}>{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? <span className="spinner" /> : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--color-text-muted)' }}>
          No account? <Link to="/signup">Create one</Link>
        </p>

        <div className="demo-hint">
          <strong>Demo credentials</strong>
          <br />
          investigator@example.com / pilot123
          <br />
          analyst@example.com / pilot123
          <br />
          admin@example.com / pilot123
        </div>
      </div>
    </div>
  )
}
