import { useEffect, useState, type SubmitEvent } from 'react'
import { Building2 } from 'lucide-react'
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
          <span>Bookify</span>
        </div>
        <h1>Sign in</h1>

        <div className="demo-credentials-banner">
          <div>
            <strong>Portfolio Demo Account</strong>
            <p>
              Username: <code>{DEMO_USERNAME}</code> &middot; Password: <code>{DEMO_PASSWORD}</code>
            </p>
          </div>
          <button
            type="button"
            className="add-resource-button demo-login-button"
            onClick={handleDemoLogin}
            disabled={isSubmitting}
          >
            One-click Demo Sign In
          </button>
        </div>

        <label>
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
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
            required
          />
        </label>
        {isSlowWakeup && !error && (
          <p className="form-message" role="status">
            Waking up the demo API server (free tier cold start can take ~30 seconds)...
          </p>
        )}
        {error && <p className="form-message error-text" role="alert">{error}</p>}
        <button type="submit" className="create-button" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export default Login
