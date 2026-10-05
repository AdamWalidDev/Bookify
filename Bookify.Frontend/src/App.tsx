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

type Booking = {
  id: number
  customerName: string
  resourceId: number
  resourceName: string
  startDate: string
  endDate: string
  status: string
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

function App() {
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [areBookingsLoading, setAreBookingsLoading] = useState(true)
  const [bookingsError, setBookingsError] = useState('')
  const [bookingsReload, setBookingsReload] = useState(0)

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

  useEffect(() => {
    const controller = new AbortController()

    async function loadBookings() {
      setAreBookingsLoading(true)
      setBookingsError('')

      try {
        const response = await fetch('http://localhost:5067/api/bookings', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`)
        }

        setBookings((await response.json()) as Booking[])
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setBookingsError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load bookings.',
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setAreBookingsLoading(false)
        }
      }
    }

    void loadBookings()
    return () => controller.abort()
  }, [bookingsReload])

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Bookify home">
          <span className="brand-mark"><Building2 size={18} /></span>
          <span>Bookify</span>
        </a>
        <nav className="topbar-nav" aria-label="Main navigation">
          <a href="#resources">Resources</a>
          <a href="#bookings">Bookings</a>
        </nav>
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

        <section id="resources" className="resource-section" aria-labelledby="resource-list-title">
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

        <section id="bookings" className="booking-section" aria-labelledby="booking-list-title">
          <div className="section-heading">
            <div>
              <h2 id="booking-list-title">Bookings</h2>
              <p>Scheduled use of your resources</p>
            </div>
            <button
              className="icon-button"
              type="button"
              title="Refresh bookings"
              aria-label="Refresh bookings"
              onClick={() => setBookingsReload((value) => value + 1)}
              disabled={areBookingsLoading}
            >
              <RefreshCw size={17} />
            </button>
          </div>

          {areBookingsLoading ? (
            <p className="message" role="status">Loading bookings...</p>
          ) : bookingsError ? (
            <div className="message error-message" role="alert">
              <span>{bookingsError}</span>
              <button type="button" onClick={() => setBookingsReload((value) => value + 1)}>
                Try again
              </button>
            </div>
          ) : bookings.length === 0 ? (
            <p className="message">No bookings have been made yet.</p>
          ) : (
            <div className="booking-table-wrap">
              <table className="booking-table">
                <thead>
                  <tr>
                    <th scope="col">Resource</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Starts</th>
                    <th scope="col">Ends</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="booking-resource">{booking.resourceName}</td>
                      <td>{booking.customerName}</td>
                      <td>{formatDate(booking.startDate)}</td>
                      <td>{formatDate(booking.endDate)}</td>
                      <td>
                        <span className={`booking-status status-${booking.status.toLowerCase()}`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
