import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestApp, insertUser } from './helpers'

describe('Bookings API', () => {
  let app: ReturnType<typeof createTestApp>['app']
  let db: ReturnType<typeof createTestApp>['db']
  let userToken: string
  let userId: number

  beforeEach(() => {
    const result = createTestApp()
    app = result.app
    db = result.db
    const user = insertUser(db)
    userToken = user.token
    userId = user.userId
  })

  describe('GET /api/bookings', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/bookings')
      expect(res.status).toBe(401)
    })

    it('returns empty array when user has no bookings', async () => {
      const res = await request(app).get('/api/bookings').set('Authorization', `Bearer ${userToken}`)
      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it('returns only the current user\'s bookings', async () => {
      db.prepare('INSERT INTO bookings (class_id, user_id, name, email, phone, booked_at) VALUES (?, ?, ?, ?, ?, ?)').run(1, userId, 'Test', 'test@example.com', '', new Date().toISOString())

      const other = insertUser(db, { email: 'other@example.com' })
      db.prepare('INSERT INTO bookings (class_id, user_id, name, email, phone, booked_at) VALUES (?, ?, ?, ?, ?, ?)').run(1, other.userId, 'Other', 'other@example.com', '', new Date().toISOString())

      const res = await request(app).get('/api/bookings').set('Authorization', `Bearer ${userToken}`)
      expect(res.body.length).toBe(1)
      expect(res.body[0].classId).toBe(1)
    })
  })

  describe('POST /api/bookings', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).post('/api/bookings').send({ classId: 1, name: 'A', email: 'a@a.com' })
      expect(res.status).toBe(401)
    })

    it('books a class and returns { ok: true }', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ classId: 1, name: 'Test User', email: 'test@example.com', phone: '555-1234' })

      expect(res.status).toBe(201)
      expect(res.body.ok).toBe(true)
    })

    it('returns 409 when class is full', async () => {
      const u1 = insertUser(db, { email: 'u1@example.com' })
      const u2 = insertUser(db, { email: 'u2@example.com' })
      db.prepare('INSERT INTO bookings (class_id, user_id, name, email, phone, booked_at) VALUES (?, ?, ?, ?, ?, ?)').run(1, u1.userId, 'U1', 'u1@example.com', '', new Date().toISOString())
      db.prepare('INSERT INTO bookings (class_id, user_id, name, email, phone, booked_at) VALUES (?, ?, ?, ?, ?, ?)').run(1, u2.userId, 'U2', 'u2@example.com', '', new Date().toISOString())

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ classId: 1, name: 'Overflow', email: 'over@example.com' })

      expect(res.status).toBe(409)
      expect(res.body.error).toBe('No spots available')
    })

    it('returns 409 when user already booked the same class', async () => {
      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ classId: 1, name: 'Test', email: 'test@example.com' })

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ classId: 1, name: 'Test', email: 'test@example.com' })

      expect(res.status).toBe(409)
      expect(res.body.error).toBe('Already booked')
    })
  })

  describe('DELETE /api/bookings/:classId', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).delete('/api/bookings/1')
      expect(res.status).toBe(401)
    })

    it('cancels a booking', async () => {
      db.prepare('INSERT INTO bookings (class_id, user_id, name, email, phone, booked_at) VALUES (?, ?, ?, ?, ?, ?)').run(1, userId, 'Test', 'test@example.com', '', new Date().toISOString())

      const res = await request(app)
        .delete('/api/bookings/1')
        .set('Authorization', `Bearer ${userToken}`)

      expect(res.status).toBe(200)
      expect(res.body.ok).toBe(true)

      const count = (db.prepare('SELECT COUNT(*) as n FROM bookings WHERE user_id = ?').get(userId) as { n: number }).n
      expect(count).toBe(0)
    })

    it('returns 200 even if no booking existed (idempotent)', async () => {
      const res = await request(app)
        .delete('/api/bookings/1')
        .set('Authorization', `Bearer ${userToken}`)
      expect(res.status).toBe(200)
    })
  })
})
