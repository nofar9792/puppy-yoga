# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start both frontend (Vite, port 5173) and backend (Express, port 3001) concurrently
npm run server       # Backend only (tsx watch)
npm run build        # Vite production build → dist/
npm start            # Production: serves built frontend + API from Express on PORT (default 3001)
npm test             # Run all tests once
npm run test:watch   # Vitest in watch mode
npm run test:coverage
```

Run a single test file:
```bash
npx vitest run server/tests/auth.test.ts
```

## Architecture

**Full-stack TypeScript monorepo** — React SPA frontend + Express REST API backend, sharing no code other than types (which live only in `src/types.ts`).

### Backend (`server/`)

- `db.ts` — creates the SQLite database (`data/puppy-yoga.db`), runs `CREATE TABLE IF NOT EXISTS` migrations inline on startup, and seeds 6 classes when the table is empty. All migrations are additive `ALTER TABLE` calls wrapped in try/catch (column-already-exists pattern).
- `auth.ts` — exports `JWT_SECRET`, `requireAuth`, and `requireAdmin` middleware. The first user to sign up automatically becomes admin (`is_admin = 1`).
- `app.ts` — exports `createApp(db)`, which registers all API routes. Taking `db` as a parameter enables in-memory SQLite injection in tests.
- `index.ts` — entry point: imports the real `db`, calls `createApp(db)`, and in production serves `dist/` as static files with a catch-all for SPA routing.

### Frontend (`src/`)

- **State lives in `App.tsx`** — classes, bookings, and waitlist are fetched there and passed down as props. There is no global state library.
- **`AuthContext`** (`src/contexts/AuthContext.tsx`) — the only React context. Stores JWT + user in `localStorage` under key `puppy-yoga-auth`. Exposes `authFetch` (a `fetch` wrapper that injects the `Authorization: Bearer` header) used everywhere that needs auth.
- Vite dev server proxies `/api/*` to `http://localhost:3001`, so frontend code always calls `/api/...` without a host.

### Testing

Server tests use an **in-memory SQLite database** (`':memory:'`). `server/tests/helpers.ts` exports `createTestDb()`, `insertUser()`, and `createTestApp()` — use these in every server test. Tests run under `node` environment; frontend tests run under `jsdom` (configured via `environmentMatchGlobs` in `vitest.config.ts`).

### Database schema

Five tables: `classes`, `users`, `bookings`, `waitlist`, `reviews`. Notable constraints:
- `reviews` has `UNIQUE(class_id, user_id)` — one review per user per class, enforced at DB level.
- `waitlist` has `UNIQUE(class_id, email)`.
- `classes.dogs` is stored as a JSON string and parsed/serialised in `app.ts`.
- `spots` is computed at query time (`total_spots - COUNT(bookings)`), never stored.
