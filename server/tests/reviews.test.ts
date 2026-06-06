import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestApp, insertUser } from './helpers'

describe('Reviews API', () => {
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
    // book class so user can review it
    db.prepare('INSERT INTO bookings (class_id, user_id, name, email, phone, booked_at) VALUES (?, ?, ?, ?, ?, ?)').run(1, userId, 'Test', 'test@example.com', '', new Date().toISOString())
  })

  describe('GET /api/reviews/:classId', () => {
    it('returns empty array when no reviews exist', async () => {
      const res = await request(app).get('/api/reviews/1')
      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it('returns reviews with user name', async () => {
      db.prepare('INSERT INTO reviews (class_id, user_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)').run(1, userId, 5, 'Amazing!', new Date().toISOString())

      const res = await request(app).get('/api/reviews/1')
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(1)
      expect(res.body[0]).toMatchObject({
        classId: 1,
        userId,
        rating: 5,
        comment: 'Amazing!',
        userName: 'Test User',
      })
    })

    it('is publicly accessible without auth', async () => {
      const res = await request(app).get('/api/reviews/1')
      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/reviews/user/mine', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/reviews/user/mine')
      expect(res.status).toBe(401)
    })

    it('returns class IDs the user has reviewed', async () => {
      db.prepare('INSERT INTO reviews (class_id, user_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)').run(1, userId, 4, '', new Date().toISOString())

      const res = await request(app).get('/api/reviews/user/mine').set('Authorization', `Bearer ${userToken}`)
      expect(res.status).toBe(200)
      expect(res.body).toContain(1)
    })

    it('returns empty array when user has no reviews', async () => {
      const res = await request(app).get('/api/reviews/user/mine').set('Authorization', `Bearer ${userToken}`)
      expect(res.body).toEqual([])
    })
  })

  describe('POST /api/reviews', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).post('/api/reviews').send({ classId: 1, rating: 5 })
      expect(res.status).toBe(401)
    })

    it('returns 403 when user has not booked the class', async () => {
      const other = insertUser(db, { email: 'other@example.com' })
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${other.token}`)
        .send({ classId: 1, rating: 5, comment: 'Nice' })
      expect(res.status).toBe(403)
      expect(res.body.error).toBe('You must have booked this class to review it')
    })

    it('creates a review and returns { ok: true }', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ classId: 1, rating: 4, comment: 'Great class!' })

      expect(res.status).toBe(201)
      expect(res.body.ok).toBe(true)
    })

    it('returns 409 on duplicate review', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ classId: 1, rating: 5 })

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ classId: 1, rating: 3 })

      expect(res.status).toBe(409)
      expect(res.body.error).toBe('Already reviewed this class')
    })
  })
})
