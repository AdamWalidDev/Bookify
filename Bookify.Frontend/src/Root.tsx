import { useEffect, useState } from 'react'
import App from './App.tsx'
import Login from './Login.tsx'
import { clearToken, getToken } from './api'

function Root() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => getToken() !== null)

  useEffect(() => {
    const handleLogout = () => setIsLoggedIn(false)
    window.addEventListener('bookify-logout', handleLogout)
    return () => window.removeEventListener('bookify-logout', handleLogout)
  }, [])

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />
  }

  return (
    <App
      onLogout={() => {
        clearToken()
        setIsLoggedIn(false)
      }}
    />
  )
}

export default Root
