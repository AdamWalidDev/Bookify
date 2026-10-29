import { expect, test, type Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'

const apiURL = 'http://127.0.0.1:5189'

async function login(page: Page) {
  await page.goto('/')
  await page.getByLabel('Username').fill('e2e-admin')
  await page.getByLabel('Password', { exact: true }).fill('e2e-password')
  const responsePromise = page.waitForResponse(`${apiURL}/api/auth/login`)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  const response = await responsePromise
  expect(response.ok()).toBeTruthy()
  const { token } = await response.json() as { token: string }
  await expect(page.getByRole('table', { name: 'Resources list' })).toBeVisible()
  return token
}

async function createResource(page: Page, name: string) {
  await page.getByRole('link', { name: 'Resources', exact: true }).click()
  await page.getByRole('button', { name: 'Add resource', exact: true }).click()
  const form = page.getByRole('form', { name: 'Add resource', exact: true })
  await form.getByLabel('Room name').fill(name)
  await form.getByLabel('Description').fill('Six-person meeting room with screen sharing and a whiteboard.')
  await form.getByLabel('Capacity').fill('6')
  await form.getByRole('button', { name: 'Save resource', exact: true }).click()
  await expect(form).toBeHidden()
  return page.getByRole('row').filter({ hasText: name })
}

async function createCustomer(page: Page, name: string, email: string) {
  await page.getByRole('link', { name: 'Customers', exact: true }).click()
  await page.getByRole('button', { name: 'Add customer', exact: true }).click()
  const form = page.getByRole('form', { name: 'Add customer', exact: true })
  await form.getByLabel('Name', { exact: true }).fill(name)
  await form.getByLabel('Email', { exact: true }).fill(email)
  await form.getByLabel('Phone', { exact: false }).fill('+46 70 555 01 23')
  await form.getByRole('button', { name: 'Save customer', exact: true }).click()
  await expect(form).toBeHidden()
}

function futureSlot() {
  const day = new Date()
  day.setDate(day.getDate() + 5)
  const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
  return { startDate: `${date}T09:00`, endDate: `${date}T10:00` }
}

test('book, reject an overlap, cancel, and book the released slot', async ({ page, request }) => {
  const token = await login(page)
  const suffix = randomUUID().slice(0, 8)
  const name = `Lifecycle meeting room ${suffix}`
  await createCustomer(page, 'Alex Morgan', `alex.lifecycle.${suffix}@example.com`)
  const resourceRow = await createResource(page, name)
  await resourceRow.getByRole('button', { name: 'Book space', exact: true }).click()
  const form = page.getByRole('form', { name: 'New reservation', exact: true })
  const slot = futureSlot()
  await form.getByLabel('Starts', { exact: true }).fill(slot.startDate)
  await form.getByLabel('Ends', { exact: true }).fill(slot.endDate)
  const customerId = Number(await form.getByRole('combobox', { name: 'Customer', exact: true }).inputValue())
  const resourceId = Number(await form.getByRole('combobox', { name: 'Resource', exact: true }).inputValue())
  await expect(form.getByRole('status', { name: 'Reservation availability' })).toHaveText('Available for the selected time.')
  await form.getByRole('button', { name: 'Create booking', exact: true }).click()
  const rows = page.getByRole('table').getByRole('row').filter({ hasText: name })
  await expect(rows).toHaveCount(1)
  await expect(rows.first().getByRole('cell', { name: 'Pending', exact: true })).toBeVisible()

  await form.getByLabel('Starts', { exact: true }).fill(slot.startDate)
  await form.getByLabel('Ends', { exact: true }).fill(slot.endDate)
  await expect(form.getByRole('status', { name: 'Reservation availability' })).toContainText('unavailable for the selected time')
  await expect(form.getByRole('button', { name: 'Create booking', exact: true })).toBeDisabled()

  // The server must also reject conflicts when a client bypasses the disabled button.
  const conflict = await request.post(`${apiURL}/api/bookings`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { customerId, resourceId, ...slot },
  })
  expect(conflict.status()).toBe(409)

  await rows.first().getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(rows.first().getByRole('cell', { name: 'Cancelled', exact: true })).toBeVisible()
  await expect(form.getByRole('status', { name: 'Reservation availability' })).toHaveText('Available for the selected time.')
  await form.getByRole('button', { name: 'Create booking', exact: true }).click()
  await expect(rows).toHaveCount(2)
  await expect(rows.filter({ hasText: 'Pending' })).toHaveCount(1)
  await expect(rows.filter({ hasText: 'Cancelled' })).toHaveCount(1)

  // Editing must exclude the booking itself from conflict checks.
  await rows.filter({ hasText: 'Pending' }).getByRole('button', { name: /^Edit booking/ }).click()
  const editor = page.getByRole('form', { name: 'Edit booking', exact: true })
  await expect(editor.getByRole('status', { name: 'Booking edit availability' })).toHaveText('Available for the selected time.')
  await editor.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(editor).toBeHidden()
})

test('resource edits persist, maintenance disables booking, and cancel discards a draft', async ({ page }) => {
  await login(page)
  const suffix = randomUUID().slice(0, 8)
  const originalName = `Design review room ${suffix}`
  const updatedName = `Design review suite ${suffix}`
  const row = await createResource(page, originalName)
  await row.getByRole('button', { name: `Edit ${originalName}`, exact: true }).click()
  const editor = page.getByRole('form', { name: 'Edit resource', exact: true })
  await expect(editor.getByLabel('Room name')).toHaveValue(originalName)
  await editor.getByLabel('Room name').fill(updatedName)
  await editor.getByLabel('Capacity').fill('10')
  await editor.getByLabel('Available for booking').uncheck()
  await editor.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(editor).toBeHidden()
  await page.reload()
  const updated = page.getByRole('row').filter({ hasText: updatedName })
  await expect(updated).toContainText('10 seats')
  await expect(updated.getByRole('cell').filter({ hasText: /^Maintenance/ })).toBeVisible()
  await expect(updated.getByRole('button', { name: 'Book space', exact: true })).toBeDisabled()
  await updated.getByRole('button', { name: `Edit ${updatedName}`, exact: true }).click()
  await editor.getByLabel('Room name').fill('Unsaved room')
  await editor.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(updated).toBeVisible()
  await page.getByRole('button', { name: 'Add resource', exact: true }).click()
  const addForm = page.getByRole('form', { name: 'Add resource', exact: true })
  await expect(addForm.getByLabel('Room name')).toBeEmpty()
  await expect(addForm.getByLabel('Capacity')).toHaveValue('8')
  await expect(addForm.getByLabel('Available for booking')).toBeChecked()
})

test('customer edits handle duplicate email errors and persist the corrected details', async ({ page }) => {
  await login(page)
  const suffix = randomUUID().slice(0, 8)
  const originalName = `Taylor Reed ${suffix}`
  const updatedName = `Taylor Andersson ${suffix}`
  const updatedEmail = `taylor.updated.${suffix}@example.com`
  await createCustomer(page, originalName, `taylor.original.${suffix}@example.com`)
  await page.getByRole('button', { name: `Edit ${originalName}`, exact: true }).click()
  const editor = page.getByRole('form', { name: 'Edit customer', exact: true })
  await editor.getByLabel('Name', { exact: true }).fill(updatedName)
  await editor.getByLabel('Email', { exact: true }).fill('emma.lindqvist@example.com')
  await editor.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(editor.getByRole('alert')).toContainText('email already exists')
  await expect(editor.getByLabel('Name', { exact: true })).toHaveValue(updatedName)
  await editor.getByLabel('Email', { exact: true }).fill(updatedEmail)
  await editor.getByLabel('Phone', { exact: false }).fill('+46 70 555 04 56')
  await editor.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(editor).toBeHidden()
  await page.reload()
  const row = page.getByRole('row').filter({ hasText: updatedName })
  await expect(row).toContainText(updatedEmail)
  await expect(row).toContainText('+46 70 555 04 56')
  await row.getByRole('button', { name: `Edit ${updatedName}`, exact: true }).click()
  await editor.getByLabel('Name', { exact: true }).fill('Unsaved customer')
  await editor.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.getByRole('button', { name: 'Add customer', exact: true }).click()
  await expect(page.getByRole('form', { name: 'Add customer', exact: true }).getByLabel('Name', { exact: true })).toBeEmpty()
})

test('availability failures can be retried without losing the booking details', async ({ page }) => {
  await login(page)
  const row = await createResource(page, `Availability retry room ${randomUUID().slice(0, 8)}`)
  await page.route('**/api/bookings/check-availability?**', async (route) => {
    await route.fulfill({ status: 503, body: 'Temporarily unavailable' })
  })
  await row.getByRole('button', { name: 'Book space', exact: true }).click()
  const form = page.getByRole('form', { name: 'New reservation', exact: true })
  await expect(form.getByRole('status', { name: 'Reservation availability' })).toContainText('Unable to check availability')
  await expect(form.getByRole('button', { name: 'Create booking', exact: true })).toBeDisabled()
  const start = await form.getByLabel('Starts', { exact: true }).inputValue()
  await page.unroute('**/api/bookings/check-availability?**')
  await form.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(form.getByRole('status', { name: 'Reservation availability' })).toHaveText('Available for the selected time.')
  await expect(form.getByLabel('Starts', { exact: true })).toHaveValue(start)
})
