import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestApp, insertUser } from './helpers'

describe('Waitlist API', () => {
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

  describe('GET /api/waitlist', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/waitlist')
      expect(res.status).toBe(401)
    })

    it('returns empty array when user is not on any waitlist', async () => {
      const res = await request(app).get('/api/waitlist').set('Authorization', `Bearer ${userToken}`)
      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it('returns only the current user\'s waitlist entries', async () => {
      db.prepare('INSERT INTO waitlist (class_id, user_id, email) VALUES (?, ?, ?)').run(1, userId, 'user@example.com')
      const other = insertUser(db, { email: 'other@example.com' })
      db.prepare('INSERT INTO waitlist (class_id, user_id, email) VALUES (?, ?, ?)').run(1, other.userId, 'other@example.com')

      const res = await request(app).get('/api/waitlist').set('Authorization', `Bearer ${userToken}`)
      expect(res.body.length).toBe(1)
      expect(res.body[0]).toMatchObject({ classId: 1, email: 'user@example.com' })
    })
  })

  describe('POST /api/waitlist', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).post('/api/waitlist').send({ classId: 1, email: 'a@a.com' })
      expect(res.status).toBe(401)
    })

    it('joins the waitlist and returns { ok: true }', async () => {
      const res = await request(app)
        .post('/api/waitlist')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ classId: 1, email: 'user@example.com' })

      expect(res.status).toBe(201)
      expect(res.body.ok).toBe(true)
    })

    it('returns 409 on duplicate waitlist entry', async () => {
      await request(app)
        .post('/api/waitlist')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ classId: 1, email: 'user@example.com' })

      const res = await request(app)
        .post('/api/waitlist')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ classId: 1, email: 'user@example.com' })

      expect(res.status).toBe(409)
      expect(res.body.error).toBe('Already on waitlist')
    })
  })
})
