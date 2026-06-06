import { test, expect } from '@playwright/test'
import { ADMIN_STATE, USER_STATE } from './constants'

test.describe.configure({ mode: 'serial' })

test('create auth states for other tests', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('/')

  // ─── Create admin user ────────────────────────────────────────────────────

  await page.getByRole('button', { name: 'Log in' }).click()
  await page.locator('.auth-switch button').click() // "Sign up" link
  await page.getByPlaceholder('Jane Smith').fill('Admin User')
  await page.getByPlaceholder('jane@example.com').fill('admin@test.com')
  await page.getByPlaceholder('••••••••').nth(0).fill('admin123')
  await page.getByPlaceholder('••••••••').nth(1).fill('admin123')
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click()
  await expect(page.getByText('👤 Admin User')).toBeVisible()
  await context.storageState({ path: ADMIN_STATE })

  // ─── Log out and create regular user ───────────────────────────────────────

  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible()

  await page.getByRole('button', { name: 'Log in' }).click()
  await page.locator('.auth-switch button').click()
  await page.getByPlaceholder('Jane Smith').fill('Regular User')
  await page.getByPlaceholder('jane@example.com').fill('user@test.com')
  await page.getByPlaceholder('••••••••').nth(0).fill('user123')
  await page.getByPlaceholder('••••••••').nth(1).fill('user123')
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click()
  await expect(page.getByText('👤 Regular User')).toBeVisible()
  await context.storageState({ path: USER_STATE })

  await context.close()
})
