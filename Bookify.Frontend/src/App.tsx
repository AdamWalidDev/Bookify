import { useEffect, useState, type CSSProperties, type SubmitEvent } from 'react'
import {
  ArrowUpRight,
  Building2,
  Calendar,
  CalendarPlus,
  Check,
  Clock,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Plus,
  Power,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react'
import './App.css'
import { apiFetch } from './api'

type Resource = {
  id: number
  name: string
  description: string
  capacity: number
  isAvailable: boolean
}

type Booking = {
  id: number
  customerId: number
  customerName: string
  resourceId: number
  resourceName: string
  startDate: string
  endDate: string
  status: string
}

type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed'

type Customer = {
  id: number
  name: string
  email: string
  phone: string
}

type CreateCustomerForm = {
  name: string
  email: string
  phone: string
}

type Page = 'resources' | 'customers' | 'bookings'

const getPageFromHash = (): Page => {
  const page = window.location.hash.slice(1)
  return page === 'customers' || page === 'bookings' ? page : 'resources'
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

const toDateTimeLocal = (value: string) => {
  const date = new Date(value)
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

const createFutureSlot = (daysAhead: number, startHour: number, durationHours: number) => {
  const start = new Date()
  start.setDate(start.getDate() + daysAhead)
  start.setHours(startHour, 0, 0, 0)
  const end = new Date(start.getTime() + durationHours * 3_600_000)
  return {
    startDate: toDateTimeLocal(start.toISOString()),
    endDate: toDateTimeLocal(end.toISOString()),
  }
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

const getResponseMessage = async (response: Response) => {
  const body = await response.text()
  if (!body) return `Request failed (${response.status})`

  try {
    const problem = JSON.parse(body) as { detail?: string; title?: string }
    return problem.detail ?? problem.title ?? body
  } catch {
    return body
  }
}

type AppProps = {
  onLogout: () => void
}

function App({ onLogout }: AppProps) {
  const [activePage, setActivePage] = useState<Page>(getPageFromHash)
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [resourceFilter, setResourceFilter] = useState<'all' | 'available' | 'unavailable'>('all')
  const [resourceSearch, setResourceSearch] = useState('')
  const [isResourceFormOpen, setIsResourceFormOpen] = useState(false)
  const [resourceForm, setResourceForm] = useState({
    name: '',
    description: '',
    capacity: '8',
    isAvailable: true,
  })
  const [isCreatingResource, setIsCreatingResource] = useState(false)
  const [resourceFormError, setResourceFormError] = useState('')
  const [resourceFormSuccess, setResourceFormSuccess] = useState('')
  const [resourceActionBusyId, setResourceActionBusyId] = useState<number | null>(null)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [areBookingsLoading, setAreBookingsLoading] = useState(true)
  const [bookingsError, setBookingsError] = useState('')
  const [bookingsReload, setBookingsReload] = useState(0)
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'All' | BookingStatus>('All')

  const [customers, setCustomers] = useState<Customer[]>([])
  const [areCustomersLoading, setAreCustomersLoading] = useState(true)
  const [customersError, setCustomersError] = useState('')
  const [customersReload, setCustomersReload] = useState(0)
  const [customerSearch, setCustomerSearch] = useState('')
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false)
  const [customerForm, setCustomerForm] = useState<CreateCustomerForm>({
    name: '',
    email: '',
    phone: '',
  })
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [customerFormError, setCustomerFormError] = useState('')
  const [customerFormSuccess, setCustomerFormSuccess] = useState('')
  const [customerActionBusyId, setCustomerActionBusyId] = useState<number | null>(null)

  const [bookingForm, setBookingForm] = useState({
    customerId: '',
    resourceId: '',
    startDate: '',
    endDate: '',
  })
  const [isCreatingBooking, setIsCreatingBooking] = useState(false)
  const [createBookingError, setCreateBookingError] = useState('')
  const [createBookingSuccess, setCreateBookingSuccess] = useState('')
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [editBookingForm, setEditBookingForm] = useState({
    startDate: '',
    endDate: '',
  })
  const [bookingActionError, setBookingActionError] = useState('')
  const [bookingActionSuccess, setBookingActionSuccess] = useState('')
  const [bookingActionInProgress, setBookingActionInProgress] = useState(false)

  useEffect(() => {
    const handleHashChange = () => setActivePage(getPageFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  function navigateTo(page: Page) {
    window.history.pushState(null, '', `#${page}`)
    setActivePage(page)
  }

  useEffect(() => {
    const controller = new AbortController()

    async function loadResources() {
      setIsLoading(true)
      setError('')

      try {
        const response = await apiFetch('/api/resources', {
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
      setAreCustomersLoading(true)
      setCustomersError('')

      try {
        const response = await apiFetch('/api/customers', {
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
      } finally {
        if (!controller.signal.aborted) {
          setAreCustomersLoading(false)
        }
      }
    }

    void loadCustomers()
    return () => controller.abort()
  }, [customersReload])

  useEffect(() => {
    const controller = new AbortController()

    async function loadBookings() {
      setAreBookingsLoading(true)
      setBookingsError('')

      try {
        const response = await apiFetch('/api/bookings', {
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

  async function handleCreateCustomer(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setCustomerFormError('')
    setCustomerFormSuccess('')

    if (!customerForm.name.trim()) {
      setCustomerFormError('Enter a customer name.')
      return
    }

    setIsCreatingCustomer(true)

    try {
      const response = await apiFetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerForm.name.trim(),
          email: customerForm.email.trim(),
          phone: customerForm.phone.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error(await getResponseMessage(response))
      }

      const customer = (await response.json()) as Customer
      setCustomers((current) => [...current, customer])
      setBookingForm((current) => ({ ...current, customerId: String(customer.id) }))
      setCustomerForm({ name: '', email: '', phone: '' })
      setIsCustomerFormOpen(false)
      setCustomerFormSuccess(`${customer.name} added and selected for new bookings.`)
    } catch (submitError) {
      setCustomerFormError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to add customer.',
      )
    } finally {
      setIsCreatingCustomer(false)
    }
  }

  async function handleDeleteCustomer(customer: Customer) {
    if (!window.confirm(`Remove ${customer.name} from customers?`)) return
    setCustomerFormError('')
    setCustomerFormSuccess('')
    setCustomerActionBusyId(customer.id)

    try {
      const response = await apiFetch(`/api/customers/${customer.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(await getResponseMessage(response))
      }
      setCustomers((current) => current.filter((item) => item.id !== customer.id))
      setCustomerFormSuccess(`${customer.name} removed.`)
    } catch (deleteError) {
      setCustomerFormError(
        deleteError instanceof Error ? deleteError.message : 'Unable to delete customer.',
      )
    } finally {
      setCustomerActionBusyId(null)
    }
  }

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
      const response = await apiFetch('/api/resources', {
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
        throw new Error(await getResponseMessage(response))
      }

      setResourceForm({ name: '', description: '', capacity: '8', isAvailable: true })
      setIsResourceFormOpen(false)
      setResourceFormSuccess('New resource added to the directory.')
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

  async function handleToggleResourceAvailability(resource: Resource) {
    setResourceFormError('')
    setResourceFormSuccess('')
    setResourceActionBusyId(resource.id)

    try {
      const nextAvailability = !resource.isAvailable
      const response = await apiFetch(`/api/resources/${resource.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: resource.name,
          description: resource.description,
          capacity: resource.capacity,
          isAvailable: nextAvailability,
        }),
      })

      if (!response.ok) {
        throw new Error(await getResponseMessage(response))
      }

      setResources((current) =>
        current.map((item) =>
          item.id === resource.id ? { ...item, isAvailable: nextAvailability } : item,
        ),
      )
      setResourceFormSuccess(
        `${resource.name} marked as ${nextAvailability ? 'available' : 'unavailable'}.`,
      )
    } catch (toggleError) {
      setResourceFormError(
        toggleError instanceof Error ? toggleError.message : 'Unable to update resource.',
      )
    } finally {
      setResourceActionBusyId(null)
    }
  }

  async function handleDeleteResource(resource: Resource) {
    if (!window.confirm(`Delete "${resource.name}"?`)) return
    setResourceFormError('')
    setResourceFormSuccess('')
    setResourceActionBusyId(resource.id)

    try {
      const response = await apiFetch(`/api/resources/${resource.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(await getResponseMessage(response))
      }
      setResources((current) => current.filter((item) => item.id !== resource.id))
      setResourceFormSuccess(`"${resource.name}" deleted.`)
    } catch (deleteError) {
      setResourceFormError(
        deleteError instanceof Error ? deleteError.message : 'Unable to delete resource.',
      )
    } finally {
      setResourceActionBusyId(null)
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
      const response = await apiFetch('/api/bookings', {
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
        throw new Error(await getResponseMessage(response))
      }

      setBookingForm((current) => ({
        ...current,
        startDate: '',
        endDate: '',
      }))
      setCreateBookingSuccess('Reservation scheduled and verified against conflicts.')
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

  function startEditingBooking(booking: Booking) {
    setEditingBooking(booking)
    setEditBookingForm({
      startDate: toDateTimeLocal(booking.startDate),
      endDate: toDateTimeLocal(booking.endDate),
    })
    setBookingActionError('')
    setBookingActionSuccess('')
  }

  async function updateBookingStatus(booking: Booking, status: BookingStatus) {
    setBookingActionError('')
    setBookingActionSuccess('')
    setBookingActionInProgress(true)

    try {
      const response = await apiFetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: booking.startDate,
          endDate: booking.endDate,
          status,
        }),
      })

      if (!response.ok) throw new Error(await getResponseMessage(response))

      setBookingActionSuccess(`Booking #${booking.id} ${status.toLowerCase()}.`)
      setBookingsReload((value) => value + 1)
    } catch (actionError) {
      setBookingActionError(
        actionError instanceof Error ? actionError.message : 'Unable to update booking.',
      )
    } finally {
      setBookingActionInProgress(false)
    }
  }

  async function handleUpdateBooking(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingBooking) return

    setBookingActionError('')
    setBookingActionSuccess('')
    setBookingActionInProgress(true)

    try {
      const response = await apiFetch(`/api/bookings/${editingBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: editBookingForm.startDate,
          endDate: editBookingForm.endDate,
          status: editingBooking.status,
        }),
      })

      if (!response.ok) throw new Error(await getResponseMessage(response))

      setEditingBooking(null)
      setBookingActionSuccess(`Booking #${editingBooking.id} updated.`)
      setBookingsReload((value) => value + 1)
    } catch (actionError) {
      setBookingActionError(
        actionError instanceof Error ? actionError.message : 'Unable to update booking.',
      )
    } finally {
      setBookingActionInProgress(false)
    }
  }

  async function handleDeleteBooking(booking: Booking) {
    if (!window.confirm(`Delete booking #${booking.id}? This cannot be undone.`)) return

    setBookingActionError('')
    setBookingActionSuccess('')
    setBookingActionInProgress(true)

    try {
      const response = await apiFetch(`/api/bookings/${booking.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error(await getResponseMessage(response))

      if (editingBooking?.id === booking.id) setEditingBooking(null)
      setBookingActionSuccess(`Booking #${booking.id} deleted.`)
      setBookingsReload((value) => value + 1)
    } catch (actionError) {
      setBookingActionError(
        actionError instanceof Error ? actionError.message : 'Unable to delete booking.',
      )
    } finally {
      setBookingActionInProgress(false)
    }
  }

  function handleQuickBookResource(resource: Resource) {
    const slot = createFutureSlot(1, 10, 2)
    setBookingForm((current) => ({
      customerId: current.customerId || (customers[0] ? String(customers[0].id) : ''),
      resourceId: String(resource.id),
      startDate: current.startDate || slot.startDate,
      endDate: current.endDate || slot.endDate,
    }))
    setCreateBookingError('')
    setCreateBookingSuccess('')
    navigateTo('bookings')
  }

  function handleQuickBookCustomer(customer: Customer) {
    const availableResource = resources.find((item) => item.isAvailable)
    const slot = createFutureSlot(1, 14, 2)
    setBookingForm((current) => ({
      customerId: String(customer.id),
      resourceId: current.resourceId || (availableResource ? String(availableResource.id) : ''),
      startDate: current.startDate || slot.startDate,
      endDate: current.endDate || slot.endDate,
    }))
    setCreateBookingError('')
    setCreateBookingSuccess('')
    navigateTo('bookings')
  }

  function applyQuickSlot(daysAhead: number, startHour: number, durationHours: number) {
    const slot = createFutureSlot(daysAhead, startHour, durationHours)
    setBookingForm((current) => ({
      ...current,
      customerId: current.customerId || (customers[0] ? String(customers[0].id) : ''),
      resourceId:
        current.resourceId ||
        (resources.find((r) => r.isAvailable)
          ? String(resources.find((r) => r.isAvailable)!.id)
          : ''),
      startDate: slot.startDate,
      endDate: slot.endDate,
    }))
  }

  const availableResourcesCount = resources.filter((r) => r.isAvailable).length
  const totalCapacity = resources
    .filter((r) => r.isAvailable)
    .reduce((sum, item) => sum + item.capacity, 0)
  const activeBookingsCount = bookings.filter(
    (b) => b.status === 'Confirmed' || b.status === 'Pending',
  ).length

  const filteredResources = resources.filter((resource) => {
    if (resourceFilter === 'available' && !resource.isAvailable) return false
    if (resourceFilter === 'unavailable' && resource.isAvailable) return false
    if (!resourceSearch.trim()) return true
    const q = resourceSearch.toLowerCase()
    return (
      resource.name.toLowerCase().includes(q) ||
      resource.description.toLowerCase().includes(q)
    )
  })

  const filteredCustomers = customers.filter((customer) => {
    if (!customerSearch.trim()) return true
    const q = customerSearch.toLowerCase()
    return (
      customer.name.toLowerCase().includes(q) ||
      customer.email.toLowerCase().includes(q) ||
      customer.phone.toLowerCase().includes(q)
    )
  })

  const filteredBookings = bookings.filter((booking) =>
    bookingStatusFilter === 'All' ? true : booking.status === bookingStatusFilter,
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#resources" aria-label="Bookify home">
            <span className="brand-mark"><Building2 size={18} /></span>
            <span className="brand-title">Bookify</span>
            <span className="brand-badge">Workspace</span>
          </a>

          <nav className="topbar-nav" aria-label="Main navigation">
            <a
              href="#resources"
              aria-current={activePage === 'resources' ? 'page' : undefined}
            >
              <span>Resources</span>
              <span className="nav-count">{resources.length}</span>
            </a>
            <a
              href="#customers"
              aria-current={activePage === 'customers' ? 'page' : undefined}
            >
              <span>Customers</span>
              <span className="nav-count">{customers.length}</span>
            </a>
            <a
              href="#bookings"
              aria-current={activePage === 'bookings' ? 'page' : undefined}
            >
              <span>Bookings</span>
              <span className="nav-count">{bookings.length}</span>
            </a>
          </nav>

          <div className="topbar-right">
            <span className="workspace-label">
              <span className="live-indicator" />
              Operational
            </span>
            <button type="button" className="signout-button" onClick={onLogout}>
              <LogOut size={14} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="kpi-strip" aria-label="Workspace metrics">
          <button
            type="button"
            className={`kpi-card ${activePage === 'resources' ? 'kpi-card-active' : ''}`}
            onClick={() => navigateTo('resources')}
            style={{ '--i': 0 } as CSSProperties}
          >
            <span className="kpi-label">BOOKABLE SPACES</span>
            <strong className="kpi-value">{availableResourcesCount}<span>/{resources.length}</span></strong>
            <span className="kpi-meta">{totalCapacity} active seat capacity</span>
          </button>

          <button
            type="button"
            className={`kpi-card ${activePage === 'customers' ? 'kpi-card-active' : ''}`}
            onClick={() => navigateTo('customers')}
            style={{ '--i': 1 } as CSSProperties}
          >
            <span className="kpi-label">REGISTERED CLIENTS</span>
            <strong className="kpi-value">{customers.length}</strong>
            <span className="kpi-meta">Verified directory accounts</span>
          </button>

          <button
            type="button"
            className={`kpi-card ${activePage === 'bookings' ? 'kpi-card-active' : ''}`}
            onClick={() => navigateTo('bookings')}
            style={{ '--i': 2 } as CSSProperties}
          >
            <span className="kpi-label">ACTIVE RESERVATIONS</span>
            <strong className="kpi-value">{activeBookingsCount}</strong>
            <span className="kpi-meta">Confirmed &amp; pending slots</span>
          </button>

          <button
            type="button"
            className="kpi-card kpi-card-cta"
            onClick={() => navigateTo('bookings')}
            style={{ '--i': 3 } as CSSProperties}
          >
            <span className="kpi-label">QUICK ACTION</span>
            <strong className="kpi-cta-title">
              Schedule a Slot <ArrowUpRight size={18} />
            </strong>
            <span className="kpi-meta">Real-time conflict checking</span>
          </button>
        </section>

        <section className="page-heading" key={activePage}>
          <div>
            <p className="eyebrow">
              {activePage === 'resources'
                ? 'SPACE DIRECTORY'
                : activePage === 'customers'
                  ? 'CLIENT DIRECTORY'
                  : 'RESERVATION LEDGER'}
            </p>
            <h1>
              {activePage === 'resources'
                ? 'Resources & Spaces'
                : activePage === 'customers'
                  ? 'Customers'
                  : 'Bookings'}
            </h1>
            <p className="page-description">
              {activePage === 'resources'
                ? 'Manage architectural rooms, studios, and equipment capacity.'
                : activePage === 'customers'
                  ? 'Directory of team members and organizations authorized to reserve spaces.'
                  : 'Create conflict-free reservations and manage live booking statuses.'}
            </p>
          </div>
          {activePage === 'resources' && (
            <div className="resource-count">
              <strong>{resources.length}</strong>
              <span>spaces listed</span>
            </div>
          )}
        </section>

        {activePage === 'resources' && (
          <section id="resources" className="resource-section view-panel" aria-labelledby="resource-list-title">
            <div className="section-heading">
              <div>
                <h2 id="resource-list-title">All resources</h2>
                <p>Availability, seating capacity, and instant booking</p>
              </div>
              <div className="resource-actions">
                <div className="search-box">
                  <Search size={14} />
                  <input
                    type="search"
                    value={resourceSearch}
                    onChange={(event) => setResourceSearch(event.target.value)}
                    placeholder="Search spaces..."
                    aria-label="Search resources"
                  />
                </div>
                <div className="segmented-control" role="group" aria-label="Filter resources">
                  <button
                    type="button"
                    className={resourceFilter === 'all' ? 'active' : ''}
                    onClick={() => setResourceFilter('all')}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={resourceFilter === 'available' ? 'active' : ''}
                    onClick={() => setResourceFilter('available')}
                  >
                    Available
                  </button>
                  <button
                    type="button"
                    className={resourceFilter === 'unavailable' ? 'active' : ''}
                    onClick={() => setResourceFilter('unavailable')}
                  >
                    Maintenance
                  </button>
                </div>
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
                  {isResourceFormOpen ? 'Close form' : 'Add resource'}
                </button>
                <button
                  className={`icon-button ${isLoading ? 'is-spinning' : ''}`}
                  type="button"
                  title="Refresh resources"
                  aria-label="Refresh resources"
                  onClick={() => setReload((value) => value + 1)}
                  disabled={isLoading}
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {resourceFormSuccess && (
              <p className="form-message success-text status-banner" role="status">
                <Check size={15} />
                <span>{resourceFormSuccess}</span>
              </p>
            )}
            {resourceFormError && !isResourceFormOpen && (
              <p className="form-message error-text status-banner" role="alert">
                <span>{resourceFormError}</span>
              </p>
            )}

            {isResourceFormOpen && (
              <form
                id="resource-create-form"
                className="resource-form animated-drawer"
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
                    placeholder="e.g. Nordic Boardroom"
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
                    placeholder="AV equipment, seating layout, lighting..."
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
                      setResourceForm((current) => ({
                        ...current,
                        isAvailable: event.target.checked,
                      }))
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
              <div className="skeleton-grid" role="status" aria-label="Loading resources">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="skeleton-card" />
                ))}
              </div>
            ) : error ? (
              <div className="message error-message" role="alert">
                <span>{error}</span>
                <button type="button" onClick={() => setReload((value) => value + 1)}>
                  Try again
                </button>
              </div>
            ) : filteredResources.length === 0 ? (
              <p className="message">No matching resources found.</p>
            ) : (
              <div className="resource-grid">
                {filteredResources.map((resource, index) => (
                  <article
                    className={`resource-card ${!resource.isAvailable ? 'resource-card-muted' : ''}`}
                    key={resource.id}
                    style={{ '--i': index } as CSSProperties}
                  >
                    <div className="resource-card-top">
                      <span className="resource-icon"><Building2 size={18} /></span>
                      <span className={`availability ${resource.isAvailable ? 'available' : 'unavailable'}`}>
                        <span className="status-dot" />
                        {resource.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <h3>{resource.name}</h3>
                    <p className="resource-description">
                      {resource.description || 'No description provided.'}
                    </p>
                    <div className="capacity">
                      <div className="capacity-info">
                        <UsersRound size={15} />
                        <span>Up to <strong>{resource.capacity}</strong> people</span>
                      </div>
                      <span className="resource-id">#{String(resource.id).padStart(2, '0')}</span>
                    </div>
                    <div className="resource-card-actions">
                      {resource.isAvailable && (
                        <button
                          type="button"
                          className="card-primary-action"
                          onClick={() => handleQuickBookResource(resource)}
                        >
                          <CalendarPlus size={14} />
                          <span>Book space</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="card-secondary-action"
                        onClick={() => void handleToggleResourceAvailability(resource)}
                        disabled={resourceActionBusyId === resource.id}
                        title={
                          resource.isAvailable
                            ? 'Mark space as unavailable'
                            : 'Mark space as available'
                        }
                      >
                        <Power size={13} />
                        <span>{resource.isAvailable ? 'Pause' : 'Activate'}</span>
                      </button>
                      <button
                        type="button"
                        className="card-danger-action"
                        onClick={() => void handleDeleteResource(resource)}
                        disabled={resourceActionBusyId === resource.id}
                        aria-label={`Delete ${resource.name}`}
                        title="Delete resource"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activePage === 'customers' && (
          <section id="customers" className="customer-section view-panel" aria-labelledby="customer-list-title">
            <div className="section-heading">
              <div>
                <h2 id="customer-list-title">Customers</h2>
                <p>People and teams who can book your resources</p>
              </div>
              <div className="resource-actions">
                <div className="search-box">
                  <Search size={14} />
                  <input
                    type="search"
                    value={customerSearch}
                    onChange={(event) => setCustomerSearch(event.target.value)}
                    placeholder="Filter by name or email..."
                    aria-label="Search customers"
                  />
                </div>
                <button
                  className="add-resource-button"
                  type="button"
                  onClick={() => {
                    setIsCustomerFormOpen((open) => !open)
                    setCustomerFormError('')
                    setCustomerFormSuccess('')
                  }}
                  aria-expanded={isCustomerFormOpen}
                  aria-controls="customer-create-form"
                >
                  <Plus size={16} />
                  {isCustomerFormOpen ? 'Close form' : 'Add customer'}
                </button>
                <button
                  className={`icon-button ${areCustomersLoading ? 'is-spinning' : ''}`}
                  type="button"
                  title="Refresh customers"
                  aria-label="Refresh customers"
                  onClick={() => setCustomersReload((value) => value + 1)}
                  disabled={areCustomersLoading}
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {customerFormSuccess && (
              <p className="form-message success-text status-banner" role="status">
                <Check size={15} />
                <span>{customerFormSuccess}</span>
              </p>
            )}
            {customerFormError && !isCustomerFormOpen && (
              <p className="form-message error-text status-banner" role="alert">
                <span>{customerFormError}</span>
              </p>
            )}

            {isCustomerFormOpen && (
              <form
                id="customer-create-form"
                className="customer-form animated-drawer"
                onSubmit={handleCreateCustomer}
              >
                <label>
                  Name
                  <input
                    required
                    maxLength={200}
                    autoComplete="name"
                    value={customerForm.name}
                    onChange={(event) =>
                      setCustomerForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="e.g. Alex Morgan"
                  />
                </label>
                <label>
                  Email
                  <input
                    required
                    type="email"
                    maxLength={320}
                    autoComplete="email"
                    value={customerForm.email}
                    onChange={(event) =>
                      setCustomerForm((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="alex@example.com"
                  />
                </label>
                <label>
                  Phone <span className="optional-label">(optional)</span>
                  <input
                    type="tel"
                    maxLength={50}
                    autoComplete="tel"
                    value={customerForm.phone}
                    onChange={(event) =>
                      setCustomerForm((current) => ({ ...current, phone: event.target.value }))
                    }
                    placeholder="+1 (555) 019-2834"
                  />
                </label>
                <div className="customer-form-footer">
                  <p className="form-message error-text" role="alert">{customerFormError}</p>
                  <button className="create-button" type="submit" disabled={isCreatingCustomer}>
                    <Plus size={16} />
                    {isCreatingCustomer ? 'Adding...' : 'Save customer'}
                  </button>
                </div>
              </form>
            )}

            {areCustomersLoading ? (
              <p className="message" role="status">Loading customers...</p>
            ) : customersError ? (
              <div className="message error-message" role="alert">
                <span>{customersError}</span>
                <button type="button" onClick={() => setCustomersReload((value) => value + 1)}>
                  Try again
                </button>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <p className="message">No matching customers found.</p>
            ) : (
              <div className="booking-table-wrap">
                <table className="booking-table">
                  <thead>
                    <tr>
                      <th scope="col">Customer</th>
                      <th scope="col">Email</th>
                      <th scope="col">Phone</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer, index) => (
                      <tr key={customer.id} style={{ '--i': index } as CSSProperties}>
                        <td className="booking-resource">
                          <div className="customer-cell">
                            <span className="avatar-badge">{getInitials(customer.name)}</span>
                            <div>
                              <strong>{customer.name}</strong>
                              <span className="cell-sub">ID #{String(customer.id).padStart(2, '0')}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="inline-icon-text">
                            <Mail size={13} />
                            {customer.email}
                          </span>
                        </td>
                        <td className="mono-cell">
                          {customer.phone ? (
                            <span className="inline-icon-text">
                              <Phone size={13} />
                              {customer.phone}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="booking-actions">
                          <button
                            type="button"
                            className="table-action"
                            onClick={() => handleQuickBookCustomer(customer)}
                          >
                            <Calendar size={14} /> New booking
                          </button>
                          <button
                            type="button"
                            className="table-action danger-action"
                            onClick={() => void handleDeleteCustomer(customer)}
                            disabled={customerActionBusyId === customer.id}
                            aria-label={`Delete ${customer.name}`}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activePage === 'bookings' && (
          <section id="bookings" className="booking-section view-panel" aria-labelledby="booking-list-title">
            <div className="booking-create-heading">
              <div>
                <h2>New reservation</h2>
                <p>Select a customer, available space, and time window.</p>
              </div>
              <div className="quick-slot-bar" aria-label="Quick time presets">
                <span className="quick-slot-label">
                  <Sparkles size={13} /> Quick presets:
                </span>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => applyQuickSlot(1, 9, 2)}
                >
                  Tomorrow 09:00–11:00
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => applyQuickSlot(2, 14, 2)}
                >
                  +2 Days 14:00–16:00
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => applyQuickSlot(3, 10, 3)}
                >
                  +3 Days 10:00–13:00
                </button>
              </div>
            </div>

            {customersError ? (
              <p className="form-message error-text" role="alert">{customersError}</p>
            ) : resources.filter((resource) => resource.isAvailable).length === 0 ||
              customers.length === 0 ? (
              <p className="message">
                Add a customer and at least one available resource before creating a booking.
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
                    {resources
                      .filter((resource) => resource.isAvailable)
                      .map((resource) => (
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
                      <p className="form-message success-text" role="status">
                        {createBookingSuccess}
                      </p>
                    )}
                  </div>
                  <button className="create-button" type="submit" disabled={isCreatingBooking}>
                    <Plus size={16} />
                    {isCreatingBooking ? 'Scheduling...' : 'Create booking'}
                  </button>
                </div>
              </form>
            )}

            <div className="section-heading">
              <div>
                <h2 id="booking-list-title">Bookings</h2>
                <p>Scheduled use of your resources</p>
              </div>
              <div className="resource-actions">
                <div className="segmented-control" role="group" aria-label="Filter bookings by status">
                  {(['All', 'Confirmed', 'Pending', 'Completed', 'Cancelled'] as const).map(
                    (status) => (
                      <button
                        key={status}
                        type="button"
                        className={bookingStatusFilter === status ? 'active' : ''}
                        onClick={() => setBookingStatusFilter(status)}
                      >
                        {status}
                      </button>
                    ),
                  )}
                </div>
                <button
                  className={`icon-button ${areBookingsLoading ? 'is-spinning' : ''}`}
                  type="button"
                  title="Refresh bookings"
                  aria-label="Refresh bookings"
                  onClick={() => setBookingsReload((value) => value + 1)}
                  disabled={areBookingsLoading}
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {bookingActionError && (
              <p className="form-message error-text status-banner" role="alert">
                {bookingActionError}
              </p>
            )}
            {bookingActionSuccess && (
              <p className="form-message success-text status-banner" role="status">
                <Check size={15} />
                <span>{bookingActionSuccess}</span>
              </p>
            )}

            {editingBooking && (
              <form
                className="booking-form booking-edit-form animated-drawer"
                onSubmit={handleUpdateBooking}
              >
                <div className="booking-create-heading booking-edit-heading">
                  <div>
                    <h2>Edit booking #{editingBooking.id}</h2>
                    <p>{editingBooking.resourceName} for {editingBooking.customerName}</p>
                  </div>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Close booking editor"
                    onClick={() => setEditingBooking(null)}
                  >
                    <X size={17} />
                  </button>
                </div>
                <label>
                  Starts
                  <input
                    required
                    type="datetime-local"
                    value={editBookingForm.startDate}
                    onChange={(event) =>
                      setEditBookingForm((current) => ({
                        ...current,
                        startDate: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Ends
                  <input
                    required
                    type="datetime-local"
                    min={editBookingForm.startDate || undefined}
                    value={editBookingForm.endDate}
                    onChange={(event) =>
                      setEditBookingForm((current) => ({
                        ...current,
                        endDate: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="booking-form-footer">
                  <span className="form-message">Current status: <strong>{editingBooking.status}</strong></span>
                  <button className="create-button" type="submit" disabled={bookingActionInProgress}>
                    <Check size={16} />
                    {bookingActionInProgress ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </form>
            )}

            {areBookingsLoading ? (
              <p className="message" role="status">Loading bookings...</p>
            ) : bookingsError ? (
              <div className="message error-message" role="alert">
                <span>{bookingsError}</span>
                <button type="button" onClick={() => setBookingsReload((value) => value + 1)}>
                  Try again
                </button>
              </div>
            ) : filteredBookings.length === 0 ? (
              <p className="message">No bookings match the selected filter.</p>
            ) : (
              <div className="booking-table-wrap">
                <table className="booking-table">
                  <thead>
                    <tr>
                      <th scope="col">ID</th>
                      <th scope="col">Resource</th>
                      <th scope="col">Customer</th>
                      <th scope="col">Starts</th>
                      <th scope="col">Ends</th>
                      <th scope="col">Status</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking, index) => (
                      <tr key={booking.id} style={{ '--i': index } as CSSProperties}>
                        <td className="mono-cell">#{String(booking.id).padStart(2, '0')}</td>
                        <td className="booking-resource">{booking.resourceName}</td>
                        <td>{booking.customerName}</td>
                        <td className="mono-cell">
                          <span className="inline-icon-text">
                            <Clock size={13} />
                            {formatDate(booking.startDate)}
                          </span>
                        </td>
                        <td className="mono-cell">{formatDate(booking.endDate)}</td>
                        <td>
                          <span className={`booking-status status-${booking.status.toLowerCase()}`}>
                            <span className="status-dot" />
                            {booking.status}
                          </span>
                        </td>
                        <td className="booking-actions">
                          {(booking.status === 'Pending' || booking.status === 'Confirmed') && (
                            <button
                              className="table-action"
                              type="button"
                              onClick={() => startEditingBooking(booking)}
                              aria-label={`Edit booking ${booking.id}`}
                              disabled={bookingActionInProgress}
                            >
                              <Pencil size={14} /> Edit
                            </button>
                          )}
                          {booking.status === 'Pending' && (
                            <button
                              className="table-action confirm-action"
                              type="button"
                              onClick={() => void updateBookingStatus(booking, 'Confirmed')}
                              disabled={bookingActionInProgress}
                            >
                              <Check size={14} /> Confirm
                            </button>
                          )}
                          {(booking.status === 'Pending' || booking.status === 'Confirmed') && (
                            <button
                              className="table-action danger-action"
                              type="button"
                              onClick={() => void updateBookingStatus(booking, 'Cancelled')}
                              disabled={bookingActionInProgress}
                            >
                              <X size={14} /> Cancel
                            </button>
                          )}
                          {booking.status === 'Confirmed' && (
                            <button
                              className="table-action"
                              type="button"
                              onClick={() => void updateBookingStatus(booking, 'Completed')}
                              disabled={bookingActionInProgress}
                            >
                              <Check size={14} /> Complete
                            </button>
                          )}
                          <button
                            className="table-action danger-action"
                            type="button"
                            onClick={() => void handleDeleteBooking(booking)}
                            aria-label={`Delete booking ${booking.id}`}
                            disabled={bookingActionInProgress}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default App
