import { useEffect, useState, type SubmitEvent } from 'react'
import { Building2, Plus, RefreshCw, UsersRound } from 'lucide-react'
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

type Customer = {
  id: number
  name: string
  email: string
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
  const [isResourceFormOpen, setIsResourceFormOpen] = useState(false)
  const [resourceForm, setResourceForm] = useState({
    name: '',
    description: '',
    capacity: '1',
    isAvailable: true,
  })
  const [isCreatingResource, setIsCreatingResource] = useState(false)
  const [resourceFormError, setResourceFormError] = useState('')
  const [resourceFormSuccess, setResourceFormSuccess] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [areBookingsLoading, setAreBookingsLoading] = useState(true)
  const [bookingsError, setBookingsError] = useState('')
  const [bookingsReload, setBookingsReload] = useState(0)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customersError, setCustomersError] = useState('')
  const [bookingForm, setBookingForm] = useState({
    customerId: '',
    resourceId: '',
    startDate: '',
    endDate: '',
  })
  const [isCreatingBooking, setIsCreatingBooking] = useState(false)
  const [createBookingError, setCreateBookingError] = useState('')
  const [createBookingSuccess, setCreateBookingSuccess] = useState('')

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

    async function loadCustomers() {
      setCustomersError('')

      try {
        const response = await fetch('http://localhost:5067/api/customers', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`)
        }

        setCustomers((await response.json()) as Customer[])
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setCustomersError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load customers.',
          )
        }
      }
    }

    void loadCustomers()
    return () => controller.abort()
  }, [])

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

  async function handleCreateResource(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setResourceFormError('')
    setResourceFormSuccess('')

    if (!resourceForm.name.trim()) {
      setResourceFormError('Enter a resource name.')
      return
    }

    setIsCreatingResource(true)

    try {
      const response = await fetch('http://localhost:5067/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: resourceForm.name.trim(),
          description: resourceForm.description.trim(),
          capacity: Number(resourceForm.capacity),
          isAvailable: resourceForm.isAvailable,
        }),
      })

      if (!response.ok) {
        const responseBody = await response.text()
        throw new Error(responseBody || `Request failed (${response.status})`)
      }

      setResourceForm({ name: '', description: '', capacity: '1', isAvailable: true })
      setIsResourceFormOpen(false)
      setResourceFormSuccess('Resource added.')
      setReload((value) => value + 1)
    } catch (submitError) {
      setResourceFormError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to add resource.',
      )
    } finally {
      setIsCreatingResource(false)
    }
  }

  async function handleCreateBooking(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreateBookingError('')
    setCreateBookingSuccess('')

    if (new Date(bookingForm.startDate) <= new Date()) {
      setCreateBookingError('The start time must be in the future.')
      return
    }

    if (new Date(bookingForm.startDate) >= new Date(bookingForm.endDate)) {
      setCreateBookingError('The end time must be after the start time.')
      return
    }

    setIsCreatingBooking(true)

    try {
      const response = await fetch('http://localhost:5067/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: Number(bookingForm.customerId),
          resourceId: Number(bookingForm.resourceId),
          startDate: bookingForm.startDate,
          endDate: bookingForm.endDate,
        }),
      })

      if (!response.ok) {
        const responseBody = await response.text()
        let message = responseBody

        try {
          const problem = JSON.parse(responseBody) as {
            detail?: string
            title?: string
          }
          message = problem.detail ?? problem.title ?? responseBody
        } catch {
          message = responseBody
        }

        throw new Error(message || `Request failed (${response.status})`)
      }

      setBookingForm((current) => ({
        ...current,
        startDate: '',
        endDate: '',
      }))
      setCreateBookingSuccess('Booking created.')
      setBookingsReload((value) => value + 1)
    } catch (submitError) {
      setCreateBookingError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to create booking.',
      )
    } finally {
      setIsCreatingBooking(false)
    }
  }

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
            <div className="resource-actions">
              <button
                className="add-resource-button"
                type="button"
                onClick={() => {
                  setIsResourceFormOpen((open) => !open)
                  setResourceFormError('')
                  setResourceFormSuccess('')
                }}
                aria-expanded={isResourceFormOpen}
                aria-controls="resource-create-form"
              >
                <Plus size={16} />
                Add resource
              </button>
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
          </div>

          {resourceFormSuccess && (
            <p className="form-message success-text" role="status">{resourceFormSuccess}</p>
          )}

          {isResourceFormOpen && (
            <form
              id="resource-create-form"
              className="resource-form"
              onSubmit={handleCreateResource}
            >
              <label>
                Room name
                <input
                  required
                  maxLength={100}
                  value={resourceForm.name}
                  onChange={(event) =>
                    setResourceForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="e.g. Meeting Room B"
                />
              </label>
              <label>
                Description
                <input
                  maxLength={500}
                  value={resourceForm.description}
                  onChange={(event) =>
                    setResourceForm((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Optional details"
                />
              </label>
              <label>
                Capacity
                <input
                  required
                  type="number"
                  min="1"
                  max="10000"
                  value={resourceForm.capacity}
                  onChange={(event) =>
                    setResourceForm((current) => ({ ...current, capacity: event.target.value }))
                  }
                />
              </label>
              <label className="availability-field">
                <input
                  type="checkbox"
                  checked={resourceForm.isAvailable}
                  onChange={(event) =>
                    setResourceForm((current) => ({ ...current, isAvailable: event.target.checked }))
                  }
                />
                Available for booking
              </label>
              <div className="resource-form-footer">
                <p className="form-message error-text" role="alert">{resourceFormError}</p>
                <button className="create-button" type="submit" disabled={isCreatingResource}>
                  <Plus size={16} />
                  {isCreatingResource ? 'Adding...' : 'Save resource'}
                </button>
              </div>
            </form>
          )}

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
          <div className="booking-create-heading">
            <div>
              <h2>New booking</h2>
              <p>Choose a customer, resource, and time.</p>
            </div>
          </div>

          {customersError ? (
            <p className="form-message error-text" role="alert">{customersError}</p>
          ) : resources.length === 0 || customers.length === 0 ? (
            <p className="form-message">
              Add a customer and a resource before creating a booking.
            </p>
          ) : (
            <form className="booking-form" onSubmit={handleCreateBooking}>
              <label>
                Customer
                <select
                  required
                  value={bookingForm.customerId}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, customerId: event.target.value }))
                  }
                >
                  <option value="">Choose a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Resource
                <select
                  required
                  value={bookingForm.resourceId}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, resourceId: event.target.value }))
                  }
                >
                  <option value="">Choose a resource</option>
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name} (up to {resource.capacity})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Starts
                <input
                  required
                  type="datetime-local"
                  value={bookingForm.startDate}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, startDate: event.target.value }))
                  }
                />
              </label>

              <label>
                Ends
                <input
                  required
                  type="datetime-local"
                  min={bookingForm.startDate || undefined}
                  value={bookingForm.endDate}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, endDate: event.target.value }))
                  }
                />
              </label>

              <div className="booking-form-footer">
                <div aria-live="polite">
                  {createBookingError && (
                    <p className="form-message error-text" role="alert">{createBookingError}</p>
                  )}
                  {createBookingSuccess && (
                    <p className="form-message success-text" role="status">{createBookingSuccess}</p>
                  )}
                </div>
                <button className="create-button" type="submit" disabled={isCreatingBooking}>
                  <Plus size={16} />
                  {isCreatingBooking ? 'Creating...' : 'Create booking'}
                </button>
              </div>
            </form>
          )}

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
