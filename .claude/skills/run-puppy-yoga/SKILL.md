---
name: run-puppy-yoga
description: Build and run the PuppyYoga app — a React SPA + Express REST API for yoga class booking
---

# Run: Puppy Yoga

This is a full-stack TypeScript app: React SPA frontend (Vite) on port 5173, Express REST API backend on port 3001. Both run together via `npm run dev`.

The driver (`driver.mjs`) uses Playwright to test and interact with the running app programmatically. It offers both automated smoke tests and an interactive REPL for manual exploration.

## Prerequisites

```bash
# Windows: Node.js (v18+) and npm are required
# Already installed in this repo
npm install
```

## Build and Start

```bash
# From repo root, start dev server (both frontend + backend)
npm run dev

# In another terminal, verify API is responding:
curl http://localhost:3001/api/classes
```

The dev server compiles TypeScript, watches for changes, and proxies `/api/*` from the frontend to the backend. Both stdout logs appear in the same terminal.

Frontfends runs at: http://localhost:5173  
API runs at: http://localhost:3001  

## Run: Agent Path

Once `npm run dev` is running, use the driver to test or explore the app:

### Automated Smoke Test

```bash
# Run all smoke tests in headless mode, save screenshots
node .claude/skills/run-puppy-yoga/driver.mjs smoke

# Results:
# - Screenshots saved to: screenshots/01-home-classes.png, 02-search-results.png, etc.
# - Output shows pass/fail for each test
# - Browser closes automatically
```

The smoke test:
1. Verifies the backend API responds (lists classes)
2. Loads the frontend and counts class cards
3. Tests search filtering (by title, instructor, dog breed)
4. Tests the signup flow (opens auth modal)
5. Takes screenshots at key points

Exit code `0` = all tests passed. Non-zero = at least one test failed.

### Interactive REPL

```bash
# Start interactive browser REPL (browser window opens)
node .claude/skills/run-puppy-yoga/driver.mjs

# At the prompt, available commands:
#   nav <url>           - Navigate to URL (default: http://localhost:5173/)
#   ss [name]           - Take screenshot (saved to screenshots/name.png)
#   test-browse         - Test class browsing
#   test-search         - Test search functionality
#   test-signup         - Test signup flow
#   test-api            - Verify backend API health
#   url                 - Print current URL
#   help                - Show command list
#   quit/exit           - Close browser and exit

# Example session:
# puppy-yoga> nav http://localhost:5173/
# puppy-yoga> ss home
# puppy-yoga> test-search
# puppy-yoga> quit
```

Screenshots are saved to `screenshots/` in the repo root. The REPL opens a real Chromium browser window you can watch.

## Run: Human Path

If you want to interact with the app manually:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Open http://localhost:5173 in your browser
# Click "Log in", fill in an email, explore classes, leave reviews, etc.

# Stop with Ctrl+C in the dev server terminal
```

The app will hot-reload as you edit files.

## Test

```bash
# Run all unit + E2E tests once
npm test

# Run in watch mode (re-run on file changes)
npm run test:watch

# Run a single test file
npx vitest run e2e/classes.spec.ts

# View coverage
npm run test:coverage
```

E2E tests use Playwright under `e2e/` and unit tests under `server/tests/` and `src/test/`.

## Gotchas

1. **Dev server must be running first.** The Vite proxy (`/api/*` → backend) only works if both processes are active. Start with `npm run dev`.

2. **Database resets on backend restart.** The SQLite database (`data/puppy-yoga.db`) is created fresh each run. Any classes/bookings/users you create disappear when the server restarts. This is by design for development.

3. **First user becomes admin.** If you sign up via the UI, the first email to sign up automatically gets `is_admin = 1`. Subsequent users are regular users. No admin setup required.

4. **Search is client-side.** The frontend fetches all classes once and filters locally. Very fast, but not suitable for 100k+ classes.

5. **Email is not validated/sent.** Signup accepts any string that looks like an email. No actual emails are sent anywhere.

6. **Auth token stored in localStorage.** Signing out = clearing `puppy-yoga-auth` from browser storage. Closing the browser window keeps you logged in (until you clear localStorage).

## Troubleshooting

**"Connection refused" on http://localhost:5173 or http://localhost:3001**  
→ Dev server not running. Check that `npm run dev` started successfully. Look for "VITE" and "Server running" messages in the terminal.

**"EADDRINUSE" (port already in use) when starting dev server**  
→ Another process is on port 5173 or 3001. Kill it:
```bash
# Windows: Find and kill by port
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Search/filters don't work on the page**  
→ Frontend didn't load. Check browser console for errors. Refresh the page. Ensure `npm run dev` is running both processes.

**E2E tests fail with "Page closed" or timeout**  
→ Dev server crashed or backend is unresponsive. Restart `npm run dev`. Ensure no port conflicts.

**Screenshots are blank or very small**  
→ Rendering issue. Try restarting the dev server. The Playwright viewport is 1280x720; ensure the app renders at that size.

## Architecture Notes

- **Frontend:** React SPA, all state in `App.tsx`, Vite dev server on port 5173.
- **Backend:** Express REST API on port 3001, SQLite database at `data/puppy-yoga.db`.
- **Shared code:** Only TypeScript types in `src/types.ts` (no runtime code shared).
- **Auth:** JWT token stored in localStorage under key `puppy-yoga-auth`. The first user to sign up is admin.
- **Database:** In-memory or file-based SQLite. Created fresh on backend startup with seeded classes.

## Next Steps

- **Edit code:** Files change hot-reload in dev mode.
- **Run tests:** `npm test` or `npm run test:watch`.
- **Build for production:** `npm run build` → `dist/`, then `npm start` (serves built app + API from Express).
- **Debug:** Use browser DevTools (F12) on the SPA, and server logs in the terminal.
