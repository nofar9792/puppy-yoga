import { test, expect } from '@playwright/test'

async function openSignupModal(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.locator('.auth-switch button').click() // "Sign up" link inside the modal
}

async function loginAs(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.getByPlaceholder('jane@example.com').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: 'Log In', exact: true }).click()
}

// ── tests ─────────────────────────────────────────────────────────────────────

test('shows Log in button when not authenticated', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Log out' })).not.toBeVisible()
})

test('can switch between login and signup modes', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page.getByRole('button', { name: 'Log In', exact: true })).toBeVisible()

  // Switch to signup via the .auth-switch link (avoids matching header "Log in" button)
  await page.locator('.auth-switch button').click()
  await expect(page.getByRole('button', { name: 'Sign Up', exact: true })).toBeVisible()
  await expect(page.getByPlaceholder('Jane Smith')).toBeVisible()

  // Switch back to login
  await page.locator('.auth-switch button').click()
  await expect(page.getByRole('button', { name: 'Log In', exact: true })).toBeVisible()
})

test('login with correct credentials succeeds', async ({ page }) => {
  await loginAs(page, 'admin@test.com', 'admin123')
  await expect(page.getByText('👤 Admin User')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()
})

test('login with wrong password shows error', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.getByPlaceholder('jane@example.com').fill('admin@test.com')
  await page.getByPlaceholder('••••••••').fill('wrongpassword')
  await page.getByRole('button', { name: 'Log In', exact: true }).click()
  await expect(page.getByText('Invalid email or password')).toBeVisible()
  await expect(page.getByText('👤 Admin User')).not.toBeVisible()
})

test('signup with mismatched passwords shows error', async ({ page }) => {
  await page.goto('/')
  await openSignupModal(page)
  await page.getByPlaceholder('Jane Smith').fill('Test')
  await page.getByPlaceholder('jane@example.com').fill('mismatch@test.com')
  await page.getByPlaceholder('••••••••').nth(0).fill('pass1')
  await page.getByPlaceholder('••••••••').nth(1).fill('pass2')
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click()
  await expect(page.getByText('Passwords do not match')).toBeVisible()
})

test('signup with already registered email shows error', async ({ page }) => {
  await page.goto('/')
  await openSignupModal(page)
  await page.getByPlaceholder('Jane Smith').fill('Duplicate')
  await page.getByPlaceholder('jane@example.com').fill('admin@test.com') // already exists
  await page.getByPlaceholder('••••••••').nth(0).fill('pass123')
  await page.getByPlaceholder('••••••••').nth(1).fill('pass123')
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click()
  await expect(page.getByText('Email already registered')).toBeVisible()
})

test('new signup creates account and logs in', async ({ page }) => {
  await page.goto('/')
  await openSignupModal(page)
  await page.getByPlaceholder('Jane Smith').fill('Brand New')
  await page.getByPlaceholder('jane@example.com').fill('brandnew@test.com')
  await page.getByPlaceholder('••••••••').nth(0).fill('newpass123')
  await page.getByPlaceholder('••••••••').nth(1).fill('newpass123')
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click()
  await expect(page.getByText('👤 Brand New')).toBeVisible()
})

test('logout clears session and shows Log in button', async ({ page }) => {
  await loginAs(page, 'user@test.com', 'user123')
  await expect(page.getByText('👤 Regular User')).toBeVisible()
  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible()
  await expect(page.getByText('👤 Regular User')).not.toBeVisible()
})

test('admin user sees Admin nav button', async ({ page }) => {
  await loginAs(page, 'admin@test.com', 'admin123')
  await expect(page.getByRole('button', { name: 'Admin' })).toBeVisible()
})

test('regular user does not see Admin nav button', async ({ page }) => {
  await loginAs(page, 'user@test.com', 'user123')
  await expect(page.getByRole('button', { name: 'Admin' })).not.toBeVisible()
})

test('session persists across page reload', async ({ page }) => {
  await loginAs(page, 'user@test.com', 'user123')
  await expect(page.getByText('👤 Regular User')).toBeVisible()
  await page.reload()
  await expect(page.getByText('👤 Regular User')).toBeVisible()
})

test('modal closes when overlay is clicked', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page.locator('.modal')).toBeVisible()
  await page.locator('.modal-overlay').click({ position: { x: 5, y: 5 } })
  await expect(page.locator('.modal')).not.toBeVisible()
})
