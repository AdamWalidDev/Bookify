import { useEffect, useState } from 'react'
import { apiFetch } from './api'

type AvailabilityStatus = 'idle' | 'invalid' | 'checking' | 'available' | 'unavailable' | 'error'

type AvailabilityResult = {
  key: string
  status: AvailabilityStatus
  message: string
}

type AvailabilityOptions = {
  resourceId: string
  startDate: string
  endDate: string
  excludeBookingId?: number
  revision: number
  enabled: boolean
}

export function useBookingAvailability({
  resourceId, startDate, endDate, excludeBookingId, revision, enabled,
}: AvailabilityOptions) {
  const [result, setResult] = useState<AvailabilityResult | null>(null)
  const [attempt, setAttempt] = useState(0)
  const key = JSON.stringify([resourceId, startDate, endDate, excludeBookingId, revision, attempt])
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  const isComplete = Boolean(enabled && resourceId && startDate && endDate)
  const invalidMessage = !Number.isFinite(start) || !Number.isFinite(end)
    ? 'Choose a valid start and end time.'
    : start >= end
      ? 'The end time must be after the start time.'
      : ''
  const shouldCheck = isComplete && !invalidMessage

  useEffect(() => {
    if (!shouldCheck) return

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      if (new Date(startDate).getTime() <= Date.now()) {
        setResult({ key, status: 'invalid', message: 'The start time must be in the future.' })
        return
      }
      try {
        const query = new URLSearchParams({ resourceId, startDate, endDate })
        if (excludeBookingId !== undefined) query.set('excludeBookingId', String(excludeBookingId))
        const response = await apiFetch(`/api/bookings/check-availability?${query}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Availability check failed')
        const data = await response.json() as { isAvailable: boolean }
        if (typeof data.isAvailable !== 'boolean') throw new Error('Invalid availability response')
        if (!controller.signal.aborted) {
          setResult({
            key,
            status: data.isAvailable ? 'available' : 'unavailable',
            message: data.isAvailable
              ? 'Available for the selected time.'
              : 'This space is unavailable for the selected time. Choose another space or time.',
          })
        }
      } catch {
        if (!controller.signal.aborted) {
          setResult({ key, status: 'error', message: 'Unable to check availability. Please try again.' })
        }
      }
    }, 300)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [key, resourceId, startDate, endDate, excludeBookingId, shouldCheck])

  let status: AvailabilityStatus = 'idle'
  let message = 'Select a space and time window to check availability.'
  if (isComplete && invalidMessage) {
    status = 'invalid'
    message = invalidMessage
  } else if (shouldCheck) {
    status = result?.key === key ? result.status : 'checking'
    message = result?.key === key ? result.message : 'Checking availability…'
  }

  return { status, message, retry: () => setAttempt((current) => current + 1) }
}
