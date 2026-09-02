import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await login(email, password)
      navigate('/todo')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{ maxWidth: '450px', margin: '2rem auto' }}>
      <h2>// SYSTEM LOGIN</h2>
      <p className="about-text" style={{ fontSize: '0.95rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
        Authenticate to access system task protocols and database CRUD actions.
      </p>

      {error && (
        <div className="github-status github-error" style={{ marginBottom: '1rem', textAlign: 'left' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="project-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.8rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
          <label htmlFor="login-email" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            className="form-control todo-input"
            placeholder="student@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
          <label htmlFor="login-password" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Password
          </label>
          <input
            id="login-password"
            type="password"
            className="form-control todo-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !email.trim() || !password.trim()}
          style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
        >
          {loading ? 'Logging in...' : 'Sign In'}
        </button>

        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 'bold' }}>
            Register here
          </Link>
        </div>
      </form>
    </section>
  )
}
