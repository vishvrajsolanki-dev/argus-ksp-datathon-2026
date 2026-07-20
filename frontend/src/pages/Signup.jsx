import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { register, authenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'investigator',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && authenticated) {
    return <Navigate to="/app/ask" replace />
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register(form)
      navigate('/app/ask', { replace: true })
    } catch (err) {
      setError(err.message || 'Registration failed')
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
            Create a pilot account
          </p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="full_name">Full name</label>
            <input
              id="full_name"
              className="form-input"
              value={form.full_name}
              onChange={set('full_name')}
              required
              minLength={2}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="form-input"
              type="email"
              value={form.email}
              onChange={set('email')}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="form-input"
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              minLength={8}
            />
            <div className="form-hint">At least 8 characters</div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="role">Role</label>
            <select id="role" className="form-select" value={form.role} onChange={set('role')}>
              <option value="investigator">Investigator</option>
              <option value="analyst">Analyst</option>
            </select>
            <div className="form-hint">Admin accounts are provisioned by station admins.</div>
          </div>
          {error && <div className="inline-alert" style={{ marginBottom: 12 }}>{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? <span className="spinner" /> : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--color-text-muted)' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
