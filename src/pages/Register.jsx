import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register, getToken } from '../api'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  // If user is already authenticated, redirect to /todo
  useEffect(() => {
    if (getToken()) {
      navigate('/todo', { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await register(email, password)
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 1200)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{ maxWidth: '450px', margin: '2rem auto' }}>
      <h2>// SYSTEM REGISTER</h2>
      <p className="about-text" style={{ fontSize: '0.95rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
        Create a new user account to generate JWT credentials for task management.
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

      {success && (
        <div className="github-status" style={{ marginBottom: '1rem', textAlign: 'left', borderColor: 'var(--accent)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>Registration successful! Redirecting to login...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="project-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.8rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
          <label htmlFor="reg-email" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Email Address
          </label>
          <input
            id="reg-email"
            type="email"
            className="form-control todo-input"
            placeholder="student@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || success}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
          <label htmlFor="reg-password" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            className="form-control todo-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || success}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
          <label htmlFor="reg-confirm-password" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Confirm Password
          </label>
          <input
            id="reg-confirm-password"
            type="password"
            className="form-control todo-input"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading || success}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || success || !email.trim() || !password.trim()}
          style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
        >
          {loading ? 'Registering...' : 'Register Account'}
        </button>

        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 'bold' }}>
            Login
          </Link>
        </div>
      </form>
    </section>
  )
}
