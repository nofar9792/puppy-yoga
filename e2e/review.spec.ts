import { test, expect } from '@playwright/test'
import { ADMIN_STATE, USER_STATE } from './constants'

async function createPastClass(page: import('@playwright/test').Page, title: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Admin' }).click()
  await page.getByRole('button', { name: '+ Add Class' }).click()
  const form = page.locator('.class-form')
  await form.getByPlaceholder('Morning Paws Flow').fill(title)
  await form.getByPlaceholder('Sarah & the Golden Trio').fill('Review Instructor')
  await form.locator('input[type="date"]').fill('2020-03-15') // past date → shows "Rate & Review"
  await form.getByPlaceholder('9:00 AM').fill('11:00 AM')
  await form.locator('input[type="number"]').nth(0).fill('10')
  await form.getByPlaceholder('Golden Retriever, Labrador').fill('Corgi')
  await page.getByRole('button', { name: 'Add Class', exact: true }).click()
  await expect(page.getByText('Class added!')).toBeVisible()
  await expect(page.getByText(title)).toBeVisible()
}

test('can leave a review for a past class', async ({ browser }) => {
  const CLASS_TITLE = 'E2E Review Past Class'

  const adminCtx = await browser.newContext({ storageState: ADMIN_STATE })
  const adminPage = await adminCtx.newPage()
  await createPastClass(adminPage, CLASS_TITLE)
  await adminCtx.close()

  const userCtx = await browser.newContext({ storageState: USER_STATE })
  const userPage = await userCtx.newPage()
  await userPage.goto('/')

  const pastCard = userPage.locator('.card').filter({ hasText: CLASS_TITLE })
  await pastCard.getByRole('button', { name: 'Book Now' }).click()
  await userPage.getByPlaceholder('Jane Smith').fill('Regular User')
  await userPage.getByPlaceholder('jane@example.com').fill('user@test.com')
  await userPage.getByRole('button', { name: /Confirm Booking/ }).click()
  await expect(userPage.locator('.toast')).toBeVisible()

  await userPage.getByRole('button', { name: 'My Bookings' }).click()
  const reviewBtn = userPage.getByRole('button', { name: 'Rate & Review' }).filter({ hasText: 'Rate & Review' }).first()
  await expect(reviewBtn).toBeVisible()

  await reviewBtn.click()
  const modal = userPage.locator('.modal')
  await modal.getByRole('button', { name: '4 star' }).click()
  await modal.getByPlaceholder(/How was the class/).fill('Amazing class, loved it!')
  await modal.getByRole('button', { name: 'Submit Review' }).click()

  await expect(userPage.getByText('✓ Reviewed')).toBeVisible()
  await expect(userPage.locator('.modal')).not.toBeVisible()

  await userCtx.close()
})

test('review modal requires a star rating before submitting', async ({ browser }) => {
  const CLASS_TITLE = 'E2E Review Validation Class'

  const adminCtx = await browser.newContext({ storageState: ADMIN_STATE })
  const adminPage = await adminCtx.newPage()
  await createPastClass(adminPage, CLASS_TITLE)
  await adminCtx.close()

  const userCtx = await browser.newContext({ storageState: USER_STATE })
  const userPage = await userCtx.newPage()
  await userPage.goto('/')

  const card = userPage.locator('.card').filter({ hasText: CLASS_TITLE })
  await card.getByRole('button', { name: 'Book Now' }).click()
  await userPage.getByPlaceholder('Jane Smith').fill('Regular User')
  await userPage.getByPlaceholder('jane@example.com').fill('user@test.com')
  await userPage.getByRole('button', { name: /Confirm Booking/ }).click()
  await expect(userPage.locator('.toast')).toBeVisible()

  await userPage.getByRole('button', { name: 'My Bookings' }).click()
  // Find the review button for this specific class
  const reviewBtn = userPage.locator('.booking-card').filter({ hasText: CLASS_TITLE }).getByRole('button', { name: 'Rate & Review' })
  await reviewBtn.click()
  await userPage.locator('.modal').getByRole('button', { name: 'Submit Review' }).click()
  await expect(userPage.getByText('Please select a rating')).toBeVisible()
  // Close without submitting
  await userPage.locator('.modal').getByRole('button', { name: 'Cancel' }).click()
  // Past classes don't have a Cancel button (they're read-only), so no cleanup needed

  await userCtx.close()
})

test.describe('future class', () => {
  test.use({ storageState: USER_STATE })

  test('shows Cancel button, not Rate & Review', async ({ page }) => {
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
    const bookingCard = page.locator('.booking-card').filter({ hasText: classTitle! })
    await expect(bookingCard.getByRole('button', { name: 'Cancel' })).toBeVisible()
    await expect(bookingCard.getByRole('button', { name: 'Rate & Review' })).not.toBeVisible()

    // Clean up
    page.once('dialog', d => d.accept())
    await bookingCard.getByRole('button', { name: 'Cancel' }).click()
  })
})
