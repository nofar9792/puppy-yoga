import { test, expect } from '@playwright/test'
import { USER_STATE } from './constants'

// ── helper ────────────────────────────────────────────────────────────────────

async function bookFirstAvailable(page: import('@playwright/test').Page) {
  const firstBookable = page.locator('.card').filter({
    has: page.getByRole('button', { name: 'Book Now' }),
  }).first()
  await firstBookable.getByRole('button', { name: 'Book Now' }).click()
  await page.getByPlaceholder('Jane Smith').fill('Regular User')
  await page.getByPlaceholder('jane@example.com').fill('user@test.com')
  await page.getByPlaceholder('+1 (555) 000-0000').fill('555-0000')
  await page.getByRole('button', { name: /Confirm Booking/ }).click()
  // Wait for the POST /api/bookings to complete before returning
  await expect(page.locator('.toast')).toBeVisible()
}

// ── unauthenticated ───────────────────────────────────────────────────────────

test('clicking Book Now without login opens the auth modal', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Book Now' }).first().click()
  await expect(page.getByText('Welcome back!')).toBeVisible()
})

// ── authenticated ─────────────────────────────────────────────────────────────

test.describe('authenticated user', () => {
  test.use({ storageState: USER_STATE })

  test('can book a class — card changes to "✓ Booked"', async ({ page }) => {
    await page.goto('/')
    await bookFirstAvailable(page)
    await expect(page.getByText('✓ Booked').first()).toBeVisible()

    // Clean up
    await page.getByRole('button', { name: 'My Bookings' }).click()
    page.once('dialog', d => d.accept())
    await page.getByRole('button', { name: 'Cancel' }).first().click()
  })

  test('booked class appears in My Bookings', async ({ page }) => {
    await page.goto('/')
    await bookFirstAvailable(page)

    await page.getByRole('button', { name: 'My Bookings' }).click()
    await expect(page.getByText('Regular User').first()).toBeVisible()
    await expect(page.getByText('user@test.com').first()).toBeVisible()

    // Clean up
    page.once('dialog', d => d.accept())
    await page.getByRole('button', { name: 'Cancel' }).first().click()
  })

  test('My Bookings nav badge shows booking count', async ({ page }) => {
    await page.goto('/')
    await bookFirstAvailable(page)
    await expect(page.locator('.nav-badge')).toHaveText('1')

    // Clean up
    await page.getByRole('button', { name: 'My Bookings' }).click()
    page.once('dialog', d => d.accept())
    await page.getByRole('button', { name: 'Cancel' }).first().click()
  })

  test('cancelling a booking removes it from My Bookings', async ({ page }) => {
    await page.goto('/')
    await bookFirstAvailable(page)
    await expect(page.getByText('✓ Booked').first()).toBeVisible()

    await page.getByRole('button', { name: 'My Bookings' }).click()
    page.once('dialog', d => d.accept())
    await page.getByRole('button', { name: 'Cancel' }).first().click()

    await expect(page.getByText('No bookings yet')).toBeVisible()
  })

  test('after cancellation class shows "Book Now" again', async ({ page }) => {
    await page.goto('/')
    const firstBookable = page.locator('.card').filter({
      has: page.getByRole('button', { name: 'Book Now' }),
    }).first()
    const classTitle = await firstBookable.locator('.card-title').textContent()

    await firstBookable.getByRole('button', { name: 'Book Now' }).click()
    await page.getByPlaceholder('Jane Smith').fill('Regular User')
    await page.getByPlaceholder('jane@example.com').fill('user@test.com')
    await page.getByRole('button', { name: /Confirm Booking/ }).click()
    await expect(page.locator('.toast')).toBeVisible()

    await page.getByRole('button', { name: 'My Bookings' }).click()
    page.once('dialog', d => d.accept())
    await page.getByRole('button', { name: 'Cancel' }).first().click()

    await page.getByRole('button', { name: 'Browse Classes' }).click()
    const restoredCard = page.locator('.card').filter({ hasText: classTitle! })
    await expect(restoredCard.getByRole('button', { name: 'Book Now' })).toBeVisible()
  })

  test('booking modal shows a class summary with price', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('.card').filter({
      has: page.getByRole('button', { name: 'Book Now' }),
    }).first()
    const cardPrice = await card.locator('.card-price').textContent()

    await card.getByRole('button', { name: 'Book Now' }).click()
    const modal = page.locator('.modal')
    await expect(modal).toBeVisible()
    // Summary shows the price extracted from the card
    await expect(modal.getByText(cardPrice!)).toBeVisible()
    // Close via Cancel button
    await modal.getByRole('button', { name: 'Cancel' }).click()
    await expect(modal).not.toBeVisible()
  })

  test('booking modal validation requires name and valid email', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Book Now' }).first().click()
    await page.getByRole('button', { name: /Confirm Booking/ }).click()
    await expect(page.getByText('Name is required')).toBeVisible()

    await page.getByPlaceholder('Jane Smith').fill('Test')
    await page.getByRole('button', { name: /Confirm Booking/ }).click()
    await expect(page.getByText('Valid email required')).toBeVisible()
  })
})
