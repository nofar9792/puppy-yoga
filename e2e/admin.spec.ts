import { test, expect } from '@playwright/test'
import { ADMIN_STATE, USER_STATE } from './constants'

// ─── helpers ──────────────────────────────────────────────────────────────────

async function goToAdmin(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Admin' }).click()
  await expect(page.getByText('Admin Panel')).toBeVisible()
}

async function createClass(page: import('@playwright/test').Page, title: string) {
  await page.getByRole('button', { name: '+ Add Class' }).click()
  const form = page.locator('.class-form')
  await form.getByPlaceholder('Morning Paws Flow').fill(title)
  await form.getByPlaceholder('Sarah & the Golden Trio').fill('E2E Instructor')
  await form.locator('input[type="date"]').fill('2026-11-01')
  await form.getByPlaceholder('9:00 AM').fill('9:00 AM')
  await form.locator('select').selectOption('Beginner')
  await form.locator('input[type="number"]').nth(0).fill('8')
  await form.locator('input[type="number"]').nth(1).fill('30')
  await form.getByPlaceholder('Golden Retriever, Labrador').fill('Beagle, Dachshund')
  await page.getByRole('button', { name: 'Add Class', exact: true }).click()
  // Wait for the API to confirm the class was created
  await expect(page.getByText('Class added!')).toBeVisible()
}

function classRow(page: import('@playwright/test').Page, title: string) {
  return page.locator('tr').filter({ hasText: title })
}

// ─── access control ───────────────────────────────────────────────────────────

test.describe('access control', () => {
  test.use({ storageState: USER_STATE })

  test('regular user does not see Admin nav button', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Admin' })).not.toBeVisible()
  })
})

// ─── class management (admin only) ───────────────────────────────────────────

test.describe('class management', () => {
  test.use({ storageState: ADMIN_STATE })

  test('can create a new class — appears on classes page', async ({ page }) => {
    const title = 'E2E Create Test Class'
    await goToAdmin(page)
    await createClass(page, title)

    // Navigate to the public classes view (forces a fresh fetch from the API)
    await page.goto('/')
    await expect(page.getByText(title)).toBeVisible()

    // Clean up via admin
    await page.getByRole('button', { name: 'Admin' }).click()
    page.once('dialog', d => d.accept())
    await classRow(page, title).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Class deleted.')).toBeVisible()
  })

  test('can edit an existing class', async ({ page }) => {
    const title   = 'E2E Edit Test Class'
    const updated = 'E2E Edited Class Name'
    await goToAdmin(page)
    await createClass(page, title)

    await classRow(page, title).getByRole('button', { name: 'Edit' }).click()
    const form = page.locator('.class-form')
    await expect(form.getByPlaceholder('Morning Paws Flow')).toHaveValue(title)
    await form.getByPlaceholder('Morning Paws Flow').fill(updated)
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(page.getByText('Class updated!')).toBeVisible()
    await expect(page.getByText(updated)).toBeVisible()
    await expect(classRow(page, title)).toHaveCount(0)

    // Clean up
    page.once('dialog', d => d.accept())
    await classRow(page, updated).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Class deleted.')).toBeVisible()
  })

  test('can delete a class — disappears from admin table and classes page', async ({ page }) => {
    const title = 'E2E Delete Test Class'
    await goToAdmin(page)
    await createClass(page, title)

    page.once('dialog', d => d.accept())
    await classRow(page, title).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Class deleted.')).toBeVisible()
    await expect(classRow(page, title)).toHaveCount(0)

    await page.goto('/')
    await expect(page.getByText(title)).not.toBeVisible()
  })

  test('delete confirmation dialog — dismissing keeps the class', async ({ page }) => {
    const title = 'E2E Keep Test Class'
    await goToAdmin(page)
    await createClass(page, title)

    page.once('dialog', d => d.dismiss())
    await classRow(page, title).getByRole('button', { name: 'Delete' }).click()
    await expect(classRow(page, title)).toHaveCount(1)

    // Clean up
    page.once('dialog', d => d.accept())
    await classRow(page, title).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Class deleted.')).toBeVisible()
  })
})

// ─── bookings & waitlist views ────────────────────────────────────────────────

test.describe('bookings and waitlist tabs', () => {
  test.use({ storageState: ADMIN_STATE })

  test('Bookings tab shows the admin table headers', async ({ page }) => {
    await goToAdmin(page)
    await page.getByRole('button', { name: 'Bookings', exact: true }).click()
    await expect(page.getByRole('columnheader', { name: 'Class' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible()
  })

  test('Waitlist tab shows the admin table headers', async ({ page }) => {
    await goToAdmin(page)
    await page.getByRole('button', { name: 'Waitlist', exact: true }).click()
    await expect(page.getByRole('columnheader', { name: 'Class' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible()
  })

  test('Bookings tab reflects a real booking', async ({ browser }) => {
    // User books a class
    const userCtx = await browser.newContext({ storageState: USER_STATE })
    const userPage = await userCtx.newPage()
    await userPage.goto('/')
    await userPage.getByRole('button', { name: 'Book Now' }).first().click()
    await userPage.getByPlaceholder('Jane Smith').fill('Regular User')
    await userPage.getByPlaceholder('jane@example.com').fill('user@test.com')
    await userPage.getByRole('button', { name: /Confirm Booking/ }).click()
    await expect(userPage.locator('.toast')).toBeVisible()

    // Admin sees it in Bookings tab
    const adminCtx = await browser.newContext({ storageState: ADMIN_STATE })
    const adminPage = await adminCtx.newPage()
    await goToAdmin(adminPage)
    await adminPage.getByRole('button', { name: 'Bookings', exact: true }).click()
    await expect(adminPage.locator('td').filter({ hasText: 'user@test.com' }).first()).toBeVisible()
    await adminCtx.close()

    // Clean up: cancel to leave a clean state for subsequent tests
    await userPage.getByRole('button', { name: 'My Bookings' }).click()
    userPage.once('dialog', d => d.accept())
    await userPage.getByRole('button', { name: 'Cancel' }).first().click()
    await userCtx.close()
  })
})
