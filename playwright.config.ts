import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data', 'test.db')

// Set DB_PATH inline inside the shell command so the child process inherits
// its full environment without the broken `env` option spreading issues.
const serverCommand = process.platform === 'win32'
  ? `set "DB_PATH=${DB_PATH}" && npx tsx server/index.ts`
  : `DB_PATH="${DB_PATH}" npx tsx server/index.ts`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'e2e',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: serverCommand,
      url: 'http://localhost:3001/api/classes',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: 'npx vite',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
})
