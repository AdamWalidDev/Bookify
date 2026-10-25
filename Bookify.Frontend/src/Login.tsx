import { useEffect, useState, type SubmitEvent } from 'react'
import { ArrowRight, Building2, CalendarCheck2, KeyRound, ShieldCheck, Sparkles } from 'lucide-react'
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
      <div className="login-shell">
        <aside className="login-showcase" aria-label="Product overview">
          <div className="login-showcase-top">
            <div className="brand">
              <span className="brand-mark"><Building2 size={18} /></span>
              <span>Bookify</span>
              <span className="brand-badge">v2.4</span>
            </div>
            <p className="login-eyebrow">WORKSPACE OPERATIONS</p>
            <h2 className="login-Editorial">
              Precision scheduling for rooms, studios, and shared spaces.
            </h2>
            <p className="login-showcase-copy">
              Built with ASP.NET Core 9, Entity Framework Core, and React 19. Prevents overlapping reservations in real time with conflict-aware slot validation.
            </p>
          </div>

          <div className="login-feature-list">
            <div className="login-feature-item">
              <span className="login-feature-icon"><CalendarCheck2 size={16} /></span>
              <div>
                <strong>Conflict-Free Time Slots</strong>
                <p>Automatic overlap detection across pending and confirmed bookings.</p>
              </div>
            </div>
            <div className="login-feature-item">
              <span className="login-feature-icon"><ShieldCheck size={16} /></span>
              <div>
                <strong>JWT-Protected REST API</strong>
                <p>Stateless bearer authentication backed by PostgreSQL &amp; EF Core.</p>
              </div>
            </div>
          </div>
        </aside>

        <form className="login-card booking-form" onSubmit={handleSubmit}>
          <div className="login-card-header">
            <p className="eyebrow">AUTHENTICATION</p>
            <h1>Sign in to workspace</h1>
            <p className="login-subtitle">
              Use the pre-filled reviewer credentials below or click instant demo access.
            </p>
          </div>

          <div className="demo-credentials-banner">
            <div className="demo-banner-header">
              <span className="demo-banner-badge">
                <KeyRound size={13} />
                Portfolio Reviewer Pass
              </span>
              <span className="demo-banner-pill">Ready</span>
            </div>
            <div className="demo-credential-grid">
              <div>
                <span>USERNAME</span>
                <code>{DEMO_USERNAME}</code>
              </div>
              <div>
                <span>PASSWORD</span>
                <code>{DEMO_PASSWORD}</code>
              </div>
            </div>
            <button
              type="button"
              className="demo-login-button"
              onClick={() => void handleDemoLogin()}
              disabled={isSubmitting}
            >
              <Sparkles size={15} />
              <span>{isSubmitting ? 'Entering workspace...' : 'One-Click Demo Sign In'}</span>
              <ArrowRight size={15} className="button-arrow" />
            </button>
          </div>

          <div className="login-divider">
            <span>or sign in manually</span>
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
              <span>Waking up the Render API container (free tier cold start takes ~25s)...</span>
            </div>
          )}

          {error && <p className="form-message error-text" role="alert">{error}</p>}

          <button type="submit" className="create-button login-submit-button" disabled={isSubmitting}>
            <span>{isSubmitting ? 'Signing in...' : 'Continue with Credentials'}</span>
            <ArrowRight size={16} className="button-arrow" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
