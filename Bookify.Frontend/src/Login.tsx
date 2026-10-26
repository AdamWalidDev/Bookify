import { useEffect, useState, type SubmitEvent } from 'react'
import { API_URL, setToken } from './api'

type LoginProps = {
  onLogin: () => void
}

function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSlowWakeup, setIsSlowWakeup] = useState(false)

  // Pre-warm the Render free-tier backend as soon as the login screen opens.
  useEffect(() => {
    fetch(`${API_URL}/api/resources`).catch(() => {
      // Ignore pre-warm errors; the login request will report any actual failure.
    })
  }, [])

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    setIsSlowWakeup(false)

    const slowTimer = window.setTimeout(() => {
      setIsSlowWakeup(true)
    }, 3000)

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? 'Invalid username or password.'
            : `Login failed (${response.status})`,
        )
      }

      const { token } = (await response.json()) as { token: string }
      setToken(token)
      onLogin()
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message === 'Failed to fetch'
            ? 'Cannot reach the API. If hosted on Render free tier, please wait ~30 seconds and try again.'
            : loginError.message
          : 'Login failed.',
      )
    } finally {
      window.clearTimeout(slowTimer)
      setIsSubmitting(false)
      setIsSlowWakeup(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="brand">
          <span className="brand-title">Bookify</span>
          <span className="brand-divider" aria-hidden="true">/</span>
          <span className="brand-badge">Workspace</span>
        </div>

        <div className="login-card-header">
          <h1>Sign in</h1>
          <p className="login-subtitle">Enter your workspace credentials to continue.</p>
        </div>

        <label>
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            placeholder="Enter username"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Enter password"
            required
          />
        </label>

        {isSlowWakeup && !error && (
          <div className="wakeup-notice" role="status">
            <span className="status-dot dot-amber" />
            <span>Waking up the API server (free tier cold start takes ~25s)...</span>
          </div>
        )}

        {error && <p className="form-message error-text" role="alert">{error}</p>}

        <button type="submit" className="create-button login-submit-button" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export default Login
