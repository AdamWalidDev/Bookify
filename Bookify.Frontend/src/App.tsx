import { useEffect, useState } from 'react'
import { Building2, RefreshCw, UsersRound } from 'lucide-react'
import './App.css'

type Resource = {
  id: number
  name: string
  description: string
  capacity: number
  isAvailable: boolean
}

function App() {
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadResources() {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch('http://localhost:5067/api/resources', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`)
        }

        setResources((await response.json()) as Resource[])
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load resources.',
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadResources()
    return () => controller.abort()
  }, [reload])

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Bookify home">
          <span className="brand-mark"><Building2 size={18} /></span>
          <span>Bookify</span>
        </a>
        <span className="workspace-label">Booking workspace</span>
      </header>

      <main className="main-content">
        <section className="page-heading">
          <div>
            <p className="eyebrow">DIRECTORY</p>
            <h1>Resources</h1>
            <p className="page-description">Rooms and spaces available for booking.</p>
          </div>
          <div className="resource-count">
            <strong>{resources.length}</strong>
            <span>listed</span>
          </div>
        </section>

        <section className="resource-section" aria-labelledby="resource-list-title">
          <div className="section-heading">
            <div>
              <h2 id="resource-list-title">All resources</h2>
              <p>Availability and capacity</p>
            </div>
            <button
              className="icon-button"
              type="button"
              title="Refresh resources"
              aria-label="Refresh resources"
              onClick={() => setReload((value) => value + 1)}
              disabled={isLoading}
            >
              <RefreshCw size={17} />
            </button>
          </div>

          {isLoading ? (
            <p className="message" role="status">Loading resources...</p>
          ) : error ? (
            <div className="message error-message" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => setReload((value) => value + 1)}>
                Try again
              </button>
            </div>
          ) : resources.length === 0 ? (
            <p className="message">No resources have been added yet.</p>
          ) : (
            <div className="resource-grid">
              {resources.map((resource) => (
                <article className="resource-card" key={resource.id}>
                  <div className="resource-card-top">
                    <span className="resource-icon"><Building2 size={19} /></span>
                    <span className={`availability ${resource.isAvailable ? 'available' : 'unavailable'}`}>
                      {resource.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <h3>{resource.name}</h3>
                  <p className="resource-description">
                    {resource.description || 'No description provided.'}
                  </p>
                  <div className="capacity">
                    <UsersRound size={16} />
                    <span>Up to {resource.capacity} people</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
