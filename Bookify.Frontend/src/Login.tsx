import { useState, type SubmitEvent } from 'react'
import { Building2 } from 'lucide-react'
import { API_URL, setToken } from './api'

type LoginProps = {
  onLogin: () => void
}

function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

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
            ? 'Cannot reach the API. Is it running?'
            : loginError.message
          : 'Login failed.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card booking-form" onSubmit={handleSubmit}>
        <div className="brand">
          <span className="brand-mark"><Building2 size={18} /></span>
          <span>Bookify</span>
        </div>
        <h1>Sign in</h1>
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
        {error && <p className="form-message error-text" role="alert">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export default Login
