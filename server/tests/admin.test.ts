import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestApp, insertUser } from './helpers'

const CLASS_BODY = {
  title: 'New Class',
  instructor: 'Zara',
  date: '2026-08-01',
  time: '10:00 AM',
  duration: '60 min',
  totalSpots: 8,
  level: 'Beginner',
  dogs: ['Poodle'],
  price: 40,
  emoji: '🐾',
}

describe('Admin API', () => {
  let app: ReturnType<typeof createTestApp>['app']
  let db: ReturnType<typeof createTestApp>['db']
  let adminToken: string
  let userToken: string

  beforeEach(() => {
    const result = createTestApp()
    app = result.app
    db = result.db
    const admin = insertUser(db, { email: 'admin@example.com', isAdmin: true })
    adminToken = admin.token
    const user = insertUser(db, { email: 'user@example.com', isAdmin: false })
    userToken = user.token
  })

  describe('auth guards', () => {
    it.each([
      ['GET', '/api/admin/bookings'],
      ['GET', '/api/admin/waitlist'],
      ['POST', '/api/admin/classes'],
      ['PUT', '/api/admin/classes/1'],
      ['DELETE', '/api/admin/classes/1'],
    ])('%s %s returns 401 without token', async (method, path) => {
      const res = await (request(app) as any)[method.toLowerCase()](path)
      expect(res.status).toBe(401)
    })

    it.each([
      ['GET', '/api/admin/bookings'],
      ['GET', '/api/admin/waitlist'],
      ['POST', '/api/admin/classes'],
    ])('%s %s returns 403 for non-admin', async (method, path) => {
      const res = await (request(app) as any)[method.toLowerCase()](path)
        .set('Authorization', `Bearer ${userToken}`)
        .send(CLASS_BODY)
      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/admin/bookings', () => {
    it('returns all bookings with class info', async () => {
      const { userId } = insertUser(db, { email: 'booker@example.com' })
      db.prepare('INSERT INTO bookings (class_id, user_id, name, email, phone, booked_at) VALUES (?, ?, ?, ?, ?, ?)').run(1, userId, 'Booker', 'booker@example.com', '', new Date().toISOString())

      const res = await request(app).get('/api/admin/bookings').set('Authorization', `Bearer ${adminToken}`)
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(1)
      expect(res.body[0]).toMatchObject({
        classId: 1,
        classTitle: 'Morning Paws Flow',
        name: 'Booker',
        email: 'booker@example.com',
      })
    })
  })

  describe('GET /api/admin/waitlist', () => {
    it('returns all waitlist entries with class title', async () => {
      const { userId } = insertUser(db, { email: 'waiter@example.com' })
      db.prepare('INSERT INTO waitlist (class_id, user_id, email) VALUES (?, ?, ?)').run(1, userId, 'waiter@example.com')

      const res = await request(app).get('/api/admin/waitlist').set('Authorization', `Bearer ${adminToken}`)
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(1)
      expect(res.body[0]).toMatchObject({ classId: 1, classTitle: 'Morning Paws Flow', email: 'waiter@example.com' })
    })
  })

  describe('POST /api/admin/classes', () => {
    it('creates a new class and returns its id', async () => {
      const res = await request(app)
        .post('/api/admin/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(CLASS_BODY)

      expect(res.status).toBe(201)
      expect(typeof res.body.id).toBe('number')

      const row = db.prepare('SELECT title FROM classes WHERE id = ?').get(res.body.id) as { title: string } | undefined
      expect(row?.title).toBe('New Class')
    })
  })

  describe('PUT /api/admin/classes/:id', () => {
    it('updates an existing class', async () => {
      const res = await request(app)
        .put('/api/admin/classes/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...CLASS_BODY, title: 'Updated Class' })

      expect(res.status).toBe(200)
      expect(res.body.ok).toBe(true)

      const row = db.prepare('SELECT title FROM classes WHERE id = 1').get() as { title: string }
      expect(row.title).toBe('Updated Class')
    })
  })

  describe('DELETE /api/admin/classes/:id', () => {
    it('deletes the class and cascades to bookings, waitlist, reviews', async () => {
      const { userId } = insertUser(db, { email: 'u@example.com' })
      db.prepare('INSERT INTO bookings (class_id, user_id, name, email, phone, booked_at) VALUES (?, ?, ?, ?, ?, ?)').run(1, userId, 'U', 'u@example.com', '', new Date().toISOString())
      db.prepare('INSERT INTO waitlist (class_id, user_id, email) VALUES (?, ?, ?)').run(1, userId, 'u@example.com')
      db.prepare('INSERT INTO reviews (class_id, user_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)').run(1, userId, 5, '', new Date().toISOString())

      const res = await request(app)
        .delete('/api/admin/classes/1')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.ok).toBe(true)

      expect((db.prepare('SELECT COUNT(*) as n FROM classes WHERE id = 1').get() as { n: number }).n).toBe(0)
      expect((db.prepare('SELECT COUNT(*) as n FROM bookings WHERE class_id = 1').get() as { n: number }).n).toBe(0)
      expect((db.prepare('SELECT COUNT(*) as n FROM waitlist WHERE class_id = 1').get() as { n: number }).n).toBe(0)
      expect((db.prepare('SELECT COUNT(*) as n FROM reviews WHERE class_id = 1').get() as { n: number }).n).toBe(0)
    })
  })
})
