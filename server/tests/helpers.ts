import BetterSQLite3 from 'better-sqlite3'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { createApp } from '../app'
import { JWT_SECRET } from '../auth'

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS classes (
    id          INTEGER PRIMARY KEY,
    title       TEXT NOT NULL,
    instructor  TEXT NOT NULL,
    date        TEXT NOT NULL,
    time        TEXT NOT NULL,
    duration    TEXT NOT NULL,
    total_spots INTEGER NOT NULL,
    level       TEXT NOT NULL,
    dogs        TEXT NOT NULL,
    price       INTEGER NOT NULL,
    emoji       TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_admin      INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS bookings (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id  INTEGER NOT NULL REFERENCES classes(id),
    user_id   INTEGER REFERENCES users(id),
    name      TEXT NOT NULL,
    email     TEXT NOT NULL,
    phone     TEXT NOT NULL DEFAULT '',
    booked_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS waitlist (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL REFERENCES classes(id),
    user_id  INTEGER REFERENCES users(id),
    email    TEXT NOT NULL,
    UNIQUE(class_id, email)
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id   INTEGER NOT NULL REFERENCES classes(id),
    user_id    INTEGER NOT NULL REFERENCES users(id),
    rating     INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment    TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    UNIQUE(class_id, user_id)
  );
`

export function createTestDb() {
  const db = new BetterSQLite3(':memory:')
  db.exec(SCHEMA)
  db.prepare(
    'INSERT INTO classes (id, title, instructor, date, time, duration, total_spots, level, dogs, price, emoji) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(1, 'Morning Paws Flow', 'Sarah', '2026-07-01', '9:00 AM', '60 min', 2, 'All Levels', JSON.stringify(['Golden Retriever']), 35, '🐕')
  return db
}

export function insertUser(
  db: BetterSQLite3.Database,
  opts: { name?: string; email?: string; password?: string; isAdmin?: boolean } = {}
) {
  const name = opts.name ?? 'Test User'
  const email = opts.email ?? 'user@example.com'
  const hash = bcrypt.hashSync(opts.password ?? 'password123', 1)
  const isAdmin = opts.isAdmin ? 1 : 0
  const result = db.prepare(
    'INSERT INTO users (name, email, password_hash, is_admin, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(name, email, hash, isAdmin, new Date().toISOString())
  const userId = result.lastInsertRowid as number
  const token = jwt.sign({ userId, name, email, isAdmin: opts.isAdmin ?? false }, JWT_SECRET, { expiresIn: '7d' })
  return { userId, name, email, isAdmin: opts.isAdmin ?? false, token }
}

export function createTestApp() {
  const db = createTestDb()
  const app = createApp(db)
  return { app, db }
}
