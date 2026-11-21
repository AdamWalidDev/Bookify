/// <reference lib="dom" />
import { expect, test } from '@playwright/test'

for (const reducedMotion of [false, true]) {
  test(`booking selectors follow their open state${reducedMotion ? ' on mobile with reduced motion' : ''}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: reducedMotion ? 'reduce' : 'no-preference' })
    if (reducedMotion) await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByLabel('Username').fill('e2e-admin')
    await page.getByLabel('Password', { exact: true }).fill('e2e-password')
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(page.getByRole('table', { name: 'Resources list' })).toBeVisible()
    await page.getByRole('link', { name: 'Bookings', exact: true }).click()
    await page.getByRole('button', { name: 'Add booking', exact: true }).click()
    const form = page.getByRole('form', { name: 'New reservation', exact: true })

    for (const name of ['Customer', 'Resource']) {
      const select = form.getByRole('combobox', { name, exact: true })
      const isOpen = () => select.evaluate((element) => element.matches(':open'))
      const arrowRotation = () => select.evaluate((element) => getComputedStyle(element, '::picker-icon').rotate)
      await expect(select).toHaveValue('')
      expect(await select.evaluate((element: HTMLSelectElement) => element.validity.valueMissing)).toBe(true)

      await select.click()
      await expect.poll(isOpen).toBe(true)
      await expect.poll(arrowRotation).toBe('225deg')
      await expect(select.locator('option').nth(1)).toBeVisible()
      await expect.poll(() => select.evaluate((element) => getComputedStyle(element, '::picker(select)').opacity)).toBe('1')
      if (reducedMotion) {
        expect(await select.evaluate((element) => getComputedStyle(element, '::picker(select)').transitionDuration)).toBe('0s')
      }
      await page.screenshot({ path: testInfo.outputPath(`${name.toLowerCase()}-picker.png`) })

      // Escape closes the list without changing the draft.
      await page.keyboard.press('Escape')
      await expect.poll(isOpen).toBe(false)
      await expect.poll(arrowRotation).toBe('45deg')
      await expect(select).toHaveValue('')

      // Pointer selection commits the value and returns the arrow to closed.
      await select.click()
      const option = select.locator('option').nth(1)
      const value = await option.getAttribute('value')
      await option.click()
      await expect(select).toHaveValue(value!)
      await expect.poll(isOpen).toBe(false)
      await expect.poll(arrowRotation).toBe('45deg')
      expect(await select.evaluate((element: HTMLSelectElement) => element.validity.valueMissing)).toBe(false)

      // Choose a different option so a missed keyboard update cannot pass.
      const keyboardValue = await select.locator('option').nth(2).getAttribute('value')
      expect(keyboardValue).toBeTruthy()
      expect(keyboardValue).not.toBe(value)
      await select.focus()
      await page.keyboard.press('Space')
      await expect.poll(isOpen).toBe(true)
      await page.keyboard.press('Home')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      await expect(select).toHaveValue(keyboardValue!)
      await expect.poll(isOpen).toBe(false)

      await select.click()
      await page.getByRole('heading', { name: 'Bookings', exact: true }).click()
      await expect.poll(isOpen).toBe(false)
      await expect.poll(arrowRotation).toBe('45deg')
    }
  })
}
