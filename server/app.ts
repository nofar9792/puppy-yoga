import express, { Request, Response } from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type BetterSQLite3 from 'better-sqlite3'
import { requireAuth, requireAdmin, JWT_SECRET } from './auth'

interface ClassRow {
  id: number; title: string; instructor: string; date: string; time: string
  duration: string; total_spots: number; spots: number; level: string
  dogs: string; price: number; emoji: string; avg_rating: number | null; review_count: number
}

interface BookingRow {
  id: number; class_id: number; user_id: number | null
  name: string; email: string; phone: string; booked_at: string
}

interface WaitlistRow { id: number; class_id: number; user_id: number | null; email: string }

interface UserRow {
  id: number; name: string; email: string
  password_hash: string; is_admin: number; created_at: string
}

interface ReviewRow {
  id: number; class_id: number; user_id: number
  rating: number; comment: string; created_at: string; user_name: string
}

export function createApp(db: BetterSQLite3.Database) {
  const app = express()
  const isProd = process.env.NODE_ENV === 'production'

  app.use(cors({ origin: isProd ? false : 'http://localhost:5173' }))
  app.use(express.json())

  // ─── Auth ─────────────────────────────────────────────────────────────────────

  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    const { name, email, password } = req.body as { name: string; email: string; password: string }
    if (!name || !email || !password) {
      res.status(400).json({ error: 'All fields required' }); return
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) { res.status(409).json({ error: 'Email already registered' }); return }

    const hash = await bcrypt.hash(password, 10)
    const { count } = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
    const isAdmin = count === 0 ? 1 : 0

    const result = db.prepare(
      'INSERT INTO users (name, email, password_hash, is_admin, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(name, email, hash, isAdmin, new Date().toISOString())

    const payload = { userId: result.lastInsertRowid as number, name, email, isAdmin: isAdmin === 1 }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, user: payload })
  })

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body as { email: string; password: string }
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'Invalid email or password' }); return
    }
    const payload = { userId: user.id, name: user.name, email: user.email, isAdmin: user.is_admin === 1 }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: payload })
  })

  // ─── Classes ──────────────────────────────────────────────────────────────────

  app.get('/api/classes', (_req: Request, res: Response) => {
    const rows = db.prepare(`
      SELECT c.*,
             (c.total_spots - COUNT(DISTINCT b.id)) AS spots,
             AVG(r.rating)                           AS avg_rating,
             COUNT(DISTINCT r.id)                    AS review_count
      FROM classes c
      LEFT JOIN bookings b ON b.class_id = c.id
      LEFT JOIN reviews  r ON r.class_id = c.id
      GROUP BY c.id
      ORDER BY c.date
    `).all() as ClassRow[]

    res.json(rows.map(r => ({
      id: r.id, title: r.title, instructor: r.instructor, date: r.date,
      time: r.time, duration: r.duration, totalSpots: r.total_spots, spots: r.spots,
      level: r.level, dogs: JSON.parse(r.dogs) as string[], price: r.price, emoji: r.emoji,
      avgRating: r.avg_rating ? Math.round(r.avg_rating * 10) / 10 : null,
      reviewCount: r.review_count,
    })))
  })

  // ─── Bookings ─────────────────────────────────────────────────────────────────

  app.get('/api/bookings', requireAuth, (req: Request, res: Response) => {
    const rows = db.prepare(
      'SELECT * FROM bookings WHERE user_id = ? ORDER BY booked_at DESC'
    ).all(req.user!.userId) as BookingRow[]
    res.json(rows.map(r => ({
      classId: r.class_id, name: r.name, email: r.email, phone: r.phone, bookedAt: r.booked_at,
    })))
  })

  app.post('/api/bookings', requireAuth, (req: Request, res: Response) => {
    const { classId, name, email, phone } = req.body as {
      classId: number; name: string; email: string; phone?: string
    }
    const spotsRow = db.prepare(`
      SELECT (c.total_spots - COUNT(b.id)) AS spots
      FROM classes c LEFT JOIN bookings b ON b.class_id = c.id
      WHERE c.id = ? GROUP BY c.id
    `).get(classId) as { spots: number } | undefined

    if (!spotsRow || spotsRow.spots <= 0) { res.status(409).json({ error: 'No spots available' }); return }

    const existing = db.prepare('SELECT id FROM bookings WHERE class_id = ? AND user_id = ?').get(classId, req.user!.userId)
    if (existing) { res.status(409).json({ error: 'Already booked' }); return }

    db.prepare(
      'INSERT INTO bookings (class_id, user_id, name, email, phone, booked_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(classId, req.user!.userId, name, email, phone ?? '', new Date().toISOString())

    res.status(201).json({ ok: true })
  })

  app.delete('/api/bookings/:classId', requireAuth, (req: Request, res: Response) => {
    db.prepare('DELETE FROM bookings WHERE class_id = ? AND user_id = ?').run(
      Number(req.params.classId), req.user!.userId
    )
    res.json({ ok: true })
  })

  // ─── Waitlist ─────────────────────────────────────────────────────────────────

  app.get('/api/waitlist', requireAuth, (req: Request, res: Response) => {
    const rows = db.prepare('SELECT * FROM waitlist WHERE user_id = ?').all(req.user!.userId) as WaitlistRow[]
    res.json(rows.map(r => ({ classId: r.class_id, email: r.email })))
  })

  app.post('/api/waitlist', requireAuth, (req: Request, res: Response) => {
    const { classId, email } = req.body as { classId: number; email: string }
    try {
      db.prepare('INSERT INTO waitlist (class_id, user_id, email) VALUES (?, ?, ?)').run(classId, req.user!.userId, email)
      res.status(201).json({ ok: true })
    } catch {
      res.status(409).json({ error: 'Already on waitlist' })
    }
  })

  // ─── Reviews ──────────────────────────────────────────────────────────────────

  // specific route before parameterized to avoid ambiguity
  app.get('/api/reviews/user/mine', requireAuth, (req: Request, res: Response) => {
    const rows = db.prepare('SELECT class_id FROM reviews WHERE user_id = ?').all(req.user!.userId) as { class_id: number }[]
    res.json(rows.map(r => r.class_id))
  })

  app.get('/api/reviews/:classId', (_req: Request, res: Response) => {
    const rows = db.prepare(`
      SELECT r.*, u.name as user_name FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.class_id = ? ORDER BY r.created_at DESC
    `).all(Number(_req.params.classId)) as ReviewRow[]

    res.json(rows.map(r => ({
      id: r.id, classId: r.class_id, userId: r.user_id, userName: r.user_name,
      rating: r.rating, comment: r.comment, createdAt: r.created_at,
    })))
  })

  app.post('/api/reviews', requireAuth, (req: Request, res: Response) => {
    const { classId, rating, comment } = req.body as { classId: number; rating: number; comment: string }

    const booked = db.prepare('SELECT id FROM bookings WHERE class_id = ? AND user_id = ?').get(classId, req.user!.userId)
    if (!booked) { res.status(403).json({ error: 'You must have booked this class to review it' }); return }

    try {
      db.prepare(
        'INSERT INTO reviews (class_id, user_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run(classId, req.user!.userId, rating, comment ?? '', new Date().toISOString())
      res.status(201).json({ ok: true })
    } catch {
      res.status(409).json({ error: 'Already reviewed this class' })
    }
  })

  // ─── Admin ────────────────────────────────────────────────────────────────────

  app.get('/api/admin/bookings', requireAdmin, (_req: Request, res: Response) => {
    const rows = db.prepare(`
      SELECT b.*, c.title as class_title, c.date as class_date, c.time as class_time
      FROM bookings b JOIN classes c ON c.id = b.class_id
      ORDER BY b.booked_at DESC
    `).all() as (BookingRow & { class_title: string; class_date: string; class_time: string })[]

    res.json(rows.map(r => ({
      classId: r.class_id, classTitle: r.class_title, classDate: r.class_date, classTime: r.class_time,
      name: r.name, email: r.email, phone: r.phone, bookedAt: r.booked_at,
    })))
  })

  app.get('/api/admin/waitlist', requireAdmin, (_req: Request, res: Response) => {
    const rows = db.prepare(`
      SELECT w.*, c.title as class_title FROM waitlist w
      JOIN classes c ON c.id = w.class_id ORDER BY w.id DESC
    `).all() as (WaitlistRow & { class_title: string })[]
    res.json(rows.map(r => ({ classId: r.class_id, classTitle: r.class_title, email: r.email })))
  })

  app.post('/api/admin/classes', requireAdmin, (req: Request, res: Response) => {
    const { title, instructor, date, time, duration, totalSpots, level, dogs, price, emoji } = req.body as {
      title: string; instructor: string; date: string; time: string; duration: string
      totalSpots: number; level: string; dogs: string[]; price: number; emoji: string
    }
    const result = db.prepare(
      'INSERT INTO classes (title, instructor, date, time, duration, total_spots, level, dogs, price, emoji) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(title, instructor, date, time, duration, totalSpots, level, JSON.stringify(dogs), price, emoji)
    res.status(201).json({ id: result.lastInsertRowid })
  })

  app.put('/api/admin/classes/:id', requireAdmin, (req: Request, res: Response) => {
    const { title, instructor, date, time, duration, totalSpots, level, dogs, price, emoji } = req.body as {
      title: string; instructor: string; date: string; time: string; duration: string
      totalSpots: number; level: string; dogs: string[]; price: number; emoji: string
    }
    db.prepare(
      'UPDATE classes SET title=?, instructor=?, date=?, time=?, duration=?, total_spots=?, level=?, dogs=?, price=?, emoji=? WHERE id=?'
    ).run(title, instructor, date, time, duration, totalSpots, level, JSON.stringify(dogs), price, emoji, Number(req.params.id))
    res.json({ ok: true })
  })

  app.delete('/api/admin/classes/:id', requireAdmin, (req: Request, res: Response) => {
    db.prepare('DELETE FROM bookings WHERE class_id = ?').run(Number(req.params.id))
    db.prepare('DELETE FROM waitlist WHERE class_id = ?').run(Number(req.params.id))
    db.prepare('DELETE FROM reviews WHERE class_id = ?').run(Number(req.params.id))
    db.prepare('DELETE FROM classes WHERE id = ?').run(Number(req.params.id))
    res.json({ ok: true })
  })

  return app
}
