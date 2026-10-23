export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5067'

const TOKEN_KEY = 'bookify_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, { ...init, headers })

  // An expired or invalid token sends the user back to the login page.
  if (response.status === 401 && token) {
    clearToken()
    window.dispatchEvent(new Event('bookify-logout'))
  }

  return response
}
