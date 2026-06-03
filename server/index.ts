import express, { Request, Response } from 'express'
import cors from 'cors'
import path from 'path'
import db from './db'

const app = express()
const isProd = process.env.NODE_ENV === 'production'
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: isProd ? false : 'http://localhost:5173' }))
app.use(express.json())

interface ClassRow {
  id: number
  title: string
  instructor: string
  date: string
  time: string
  duration: string
  total_spots: number
  spots: number
  level: string
  dogs: string
  price: number
  emoji: string
}

interface BookingRow {
  class_id: number
  name: string
  email: string
  phone: string
  booked_at: string
}

interface WaitlistRow {
  class_id: number
  email: string
}

// GET /api/classes — spots computed live from bookings count
app.get('/api/classes', (_req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT c.*, (c.total_spots - COUNT(b.id)) AS spots
    FROM classes c
    LEFT JOIN bookings b ON b.class_id = c.id
    GROUP BY c.id
    ORDER BY c.date
  `).all() as ClassRow[]

  res.json(rows.map(r => ({
    id: r.id,
    title: r.title,
    instructor: r.instructor,
    date: r.date,
    time: r.time,
    duration: r.duration,
    totalSpots: r.total_spots,
    spots: r.spots,
    level: r.level,
    dogs: JSON.parse(r.dogs) as string[],
    price: r.price,
    emoji: r.emoji,
  })))
})

// GET /api/bookings
app.get('/api/bookings', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM bookings ORDER BY booked_at DESC').all() as BookingRow[]
  res.json(rows.map(r => ({
    classId: r.class_id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    bookedAt: r.booked_at,
  })))
})

// POST /api/bookings
app.post('/api/bookings', (req: Request, res: Response) => {
  const { classId, name, email, phone } = req.body as {
    classId: number; name: string; email: string; phone?: string
  }

  const spotsRow = db.prepare(`
    SELECT (c.total_spots - COUNT(b.id)) AS spots
    FROM classes c LEFT JOIN bookings b ON b.class_id = c.id
    WHERE c.id = ? GROUP BY c.id
  `).get(classId) as { spots: number } | undefined

  if (!spotsRow || spotsRow.spots <= 0) {
    res.status(409).json({ error: 'No spots available' })
    return
  }

  const existing = db.prepare('SELECT id FROM bookings WHERE class_id = ? AND email = ?').get(classId, email)
  if (existing) {
    res.status(409).json({ error: 'Already booked with this email' })
    return
  }

  db.prepare(
    'INSERT INTO bookings (class_id, name, email, phone, booked_at) VALUES (?, ?, ?, ?, ?)'
  ).run(classId, name, email, phone ?? '', new Date().toISOString())

  res.status(201).json({ ok: true })
})

// DELETE /api/bookings/:classId
app.delete('/api/bookings/:classId', (req: Request, res: Response) => {
  db.prepare('DELETE FROM bookings WHERE class_id = ?').run(Number(req.params.classId))
  res.json({ ok: true })
})

// GET /api/waitlist
app.get('/api/waitlist', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM waitlist').all() as WaitlistRow[]
  res.json(rows.map(r => ({ classId: r.class_id, email: r.email })))
})

// POST /api/waitlist
app.post('/api/waitlist', (req: Request, res: Response) => {
  const { classId, email } = req.body as { classId: number; email: string }
  try {
    db.prepare('INSERT INTO waitlist (class_id, email) VALUES (?, ?)').run(classId, email)
    res.status(201).json({ ok: true })
  } catch {
    res.status(409).json({ error: 'Already on waitlist' })
  }
})

// Serve built React app in production
if (isProd) {
  const distDir = path.join(process.cwd(), 'dist')
  app.use(express.static(distDir))
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`API server → http://localhost:${PORT}`)
})
