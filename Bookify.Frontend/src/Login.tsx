import { useEffect, useState, type SubmitEvent } from 'react'
import { ArrowRight, Building2, KeyRound } from 'lucide-react'
import { API_URL, setToken } from './api'

type LoginProps = {
  onLogin: () => void
}

const DEMO_USERNAME = 'admin'
const DEMO_PASSWORD = 'admin123'

function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState(DEMO_USERNAME)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSlowWakeup, setIsSlowWakeup] = useState(false)

  // Pre-warm the Render free-tier backend as soon as the login screen opens.
  useEffect(() => {
    fetch(`${API_URL}/api/resources`).catch(() => {
      // Ignore pre-warm errors; the login request will report any actual failure.
    })
  }, [])

  async function signInWithCredentials(loginUser: string, loginPass: string) {
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
        body: JSON.stringify({ username: loginUser, password: loginPass }),
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

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    await signInWithCredentials(username, password)
  }

  async function handleDemoLogin() {
    setUsername(DEMO_USERNAME)
    setPassword(DEMO_PASSWORD)
    await signInWithCredentials(DEMO_USERNAME, DEMO_PASSWORD)
  }

  return (
    <div className="login-page">
      <form className="login-card booking-form" onSubmit={handleSubmit}>
        <div className="brand">
          <span className="brand-mark"><Building2 size={18} /></span>
          <span className="brand-title">Bookify</span>
        </div>

        <div className="login-card-header">
          <h1>Sign in</h1>
          <p className="login-subtitle">Enter your credentials or use the demo account below.</p>
        </div>

        <div className="demo-credentials-banner">
          <div className="demo-banner-header">
            <span className="demo-banner-badge">
              <KeyRound size={13} />
              Demo Account
            </span>
            <span className="demo-inline-creds">
              <code>{DEMO_USERNAME}</code> / <code>{DEMO_PASSWORD}</code>
            </span>
          </div>
          <button
            type="button"
            className="demo-login-button"
            onClick={() => void handleDemoLogin()}
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? 'Signing in...' : 'One-Click Demo Sign In'}</span>
            <ArrowRight size={14} className="button-arrow" />
          </button>
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
            <span className="pulse-dot" />
            <span>Waking up the API server (free tier cold start takes ~25s)...</span>
          </div>
        )}

        {error && <p className="form-message error-text" role="alert">{error}</p>}

        <button type="submit" className="create-button login-submit-button" disabled={isSubmitting}>
          <span>{isSubmitting ? 'Signing in...' : 'Sign in'}</span>
          <ArrowRight size={15} className="button-arrow" />
        </button>
      </form>
    </div>
  )
}

export default Login
