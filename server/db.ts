import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir)

const db = new Database(path.join(dataDir, 'puppy-yoga.db'))

db.exec(`
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

  CREATE TABLE IF NOT EXISTS bookings (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id  INTEGER NOT NULL REFERENCES classes(id),
    name      TEXT NOT NULL,
    email     TEXT NOT NULL,
    phone     TEXT NOT NULL DEFAULT '',
    booked_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS waitlist (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL REFERENCES classes(id),
    email    TEXT NOT NULL,
    UNIQUE(class_id, email)
  );
`)

const { n } = db.prepare('SELECT COUNT(*) as n FROM classes').get() as { n: number }

if (n === 0) {
  const stmt = db.prepare(
    'INSERT INTO classes (id, title, instructor, date, time, duration, total_spots, level, dogs, price, emoji) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )

  const seed = [
    [1, 'Morning Paws Flow',          'Sarah & the Golden Trio',    '2026-06-07', '9:00 AM',  '60 min', 10, 'All Levels',   JSON.stringify(['Golden Retriever', 'Labrador', 'Beagle']),                   35, '🐕'],
    [2, 'Sunset Stretch & Snuggles',  'Mike & the Doodle Gang',     '2026-06-08', '5:30 PM',  '75 min', 10, 'Beginner',     JSON.stringify(['Goldendoodle', 'Labradoodle']),                               40, '🐩'],
    [3, 'Power Yoga & Puppies',        'Emma & the Terrier Crew',    '2026-06-10', '7:00 AM',  '60 min',  8, 'Intermediate', JSON.stringify(['Yorkshire Terrier', 'Jack Russell', 'Westie']),              38, '🐶'],
    [4, 'Gentle Flow & Fluffballs',    'Lily & the Pomeranian Pack', '2026-06-12', '11:00 AM', '60 min', 10, 'Beginner',     JSON.stringify(['Pomeranian', 'Shih Tzu', 'Maltese']),                        35, '🦮'],
    [5, 'Weekend Wag & Warrior',       'Tom & the Big Dog Club',     '2026-06-14', '10:00 AM', '90 min', 12, 'All Levels',   JSON.stringify(['Husky', 'German Shepherd', 'Bernese Mountain Dog']),         45, '🐾'],
    [6, 'Mindful Mutts Meditation',    'Zoe & the Rescue Pups',      '2026-06-15', '4:00 PM',  '60 min',  8, 'All Levels',   JSON.stringify(['Mixed Breeds']),                                             30, '🧘'],
  ] as const

  for (const row of seed) stmt.run(...row)
}

export default db
