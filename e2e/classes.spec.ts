import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('shows the seeded classes on load', async ({ page }) => {
  await expect(page.locator('.card').first()).toBeVisible()
  await expect(page.getByText('Morning Paws Flow')).toBeVisible()
  await expect(page.getByText('Sunset Stretch & Snuggles')).toBeVisible()
})

test('search by class title filters results', async ({ page }) => {
  await page.getByPlaceholder('Search by class name, instructor, or dog breed...').fill('Morning')
  await expect(page.getByText('Morning Paws Flow')).toBeVisible()
  await expect(page.getByText('Sunset Stretch & Snuggles')).not.toBeVisible()
})

test('search by instructor name filters results', async ({ page }) => {
  await page.getByPlaceholder('Search by class name, instructor, or dog breed...').fill('Emma')
  await expect(page.getByText('Power Yoga & Puppies')).toBeVisible()
  await expect(page.getByText('Morning Paws Flow')).not.toBeVisible()
})

test('search by dog breed filters results', async ({ page }) => {
  await page.getByPlaceholder('Search by class name, instructor, or dog breed...').fill('Pomeranian')
  await expect(page.getByText('Gentle Flow & Fluffballs')).toBeVisible()
  await expect(page.getByText('Morning Paws Flow')).not.toBeVisible()
})

test('clear search button (×) restores all classes', async ({ page }) => {
  const searchInput = page.getByPlaceholder('Search by class name, instructor, or dog breed...')
  await searchInput.fill('Morning')
  await expect(page.getByText('Sunset Stretch & Snuggles')).not.toBeVisible()
  await page.getByLabel('Clear search').click()
  await expect(page.getByText('Morning Paws Flow')).toBeVisible()
  await expect(page.getByText('Sunset Stretch & Snuggles')).toBeVisible()
})

test('search with no match shows empty state message', async ({ page }) => {
  await page.getByPlaceholder('Search by class name, instructor, or dog breed...').fill('xyznonexistent999')
  await expect(page.getByText('No classes match your search.')).toBeVisible()
  await expect(page.locator('.card')).toHaveCount(0)
})

test('"Clear filters" button in empty state resets all filters', async ({ page }) => {
  await page.getByPlaceholder('Search by class name, instructor, or dog breed...').fill('xyznonexistent')
  await expect(page.getByText('No classes match your search.')).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.locator('.card').first()).toBeVisible()
})

test('Beginner level filter shows only beginner classes', async ({ page }) => {
  await page.getByRole('button', { name: 'Beginner', exact: true }).click()
  // Seeded beginner classes: Sunset Stretch & Snuggles, Gentle Flow & Fluffballs
  await expect(page.getByText('Sunset Stretch & Snuggles')).toBeVisible()
  await expect(page.getByText('Gentle Flow & Fluffballs')).toBeVisible()
  // Non-beginner should be hidden
  await expect(page.getByText('Morning Paws Flow')).not.toBeVisible()
  await expect(page.getByText('Power Yoga & Puppies')).not.toBeVisible()
})

test('Intermediate level filter shows only intermediate classes', async ({ page }) => {
  await page.getByRole('button', { name: 'Intermediate', exact: true }).click()
  await expect(page.getByText('Power Yoga & Puppies')).toBeVisible()
  await expect(page.getByText('Morning Paws Flow')).not.toBeVisible()
})

test('"All Levels" filter shows only All Levels classes', async ({ page }) => {
  await page.getByRole('button', { name: 'All Levels', exact: true }).click()
  await expect(page.getByText('Morning Paws Flow')).toBeVisible()
  await expect(page.getByText('Weekend Wag & Warrior')).toBeVisible()
  await expect(page.getByText('Mindful Mutts Meditation')).toBeVisible()
  await expect(page.getByText('Sunset Stretch & Snuggles')).not.toBeVisible() // Beginner
})

test('"All" filter restores all classes after a level filter', async ({ page }) => {
  await page.getByRole('button', { name: 'Beginner', exact: true }).click()
  await expect(page.getByText('Morning Paws Flow')).not.toBeVisible()
  await page.getByRole('button', { name: 'All', exact: true }).click()
  await expect(page.getByText('Morning Paws Flow')).toBeVisible()
  await expect(page.getByText('Sunset Stretch & Snuggles')).toBeVisible()
})

test('date range "From" filter excludes classes before that date', async ({ page }) => {
  // Morning Paws Flow is 2026-06-07; set From = 2026-06-08 to exclude it
  await page.locator('input[type="date"]').nth(0).fill('2026-06-08')
  await expect(page.getByText('Morning Paws Flow')).not.toBeVisible()
  await expect(page.getByText('Sunset Stretch & Snuggles')).toBeVisible() // 2026-06-08
})

test('date range "To" filter excludes classes after that date', async ({ page }) => {
  // Set To = 2026-06-07 to show only Morning Paws Flow
  await page.locator('input[type="date"]').nth(1).fill('2026-06-07')
  await expect(page.getByText('Morning Paws Flow')).toBeVisible()
  await expect(page.getByText('Sunset Stretch & Snuggles')).not.toBeVisible() // 2026-06-08
})

test('clicking Book Now without being logged in opens the auth modal', async ({ page }) => {
  await page.getByRole('button', { name: 'Book Now' }).first().click()
  await expect(page.getByText('Welcome back!')).toBeVisible()
})

test('class card displays price, level badge and dog tags', async ({ page }) => {
  const card = page.locator('.card').first()
  await expect(card.getByText('$35')).toBeVisible()
  await expect(card.locator('.level-badge')).toBeVisible()
  await expect(card.locator('.dog-tag').first()).toBeVisible()
})
