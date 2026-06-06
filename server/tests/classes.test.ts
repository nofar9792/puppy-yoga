import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestApp, insertUser } from './helpers'

describe('GET /api/classes', () => {
  let app: ReturnType<typeof createTestApp>['app']
  let db: ReturnType<typeof createTestApp>['db']

  beforeEach(() => {
    const result = createTestApp()
    app = result.app
    db = result.db
  })

  it('returns an array of classes with correct shape', async () => {
    const res = await request(app).get('/api/classes')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBe(1)

    const cls = res.body[0]
    expect(cls).toMatchObject({
      id: 1,
      title: 'Morning Paws Flow',
      instructor: 'Sarah',
      totalSpots: 2,
      spots: 2,
      level: 'All Levels',
      price: 35,
      emoji: '🐕',
    })
    expect(Array.isArray(cls.dogs)).toBe(true)
    expect(cls.dogs).toContain('Golden Retriever')
  })

  it('calculates available spots after a booking', async () => {
    const { userId } = insertUser(db)
    db.prepare(
      'INSERT INTO bookings (class_id, user_id, name, email, phone, booked_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(1, userId, 'Test', 'test@example.com', '', new Date().toISOString())

    const res = await request(app).get('/api/classes')
    expect(res.body[0].spots).toBe(1)
    expect(res.body[0].totalSpots).toBe(2)
  })

  it('includes avgRating and reviewCount', async () => {
    const { userId } = insertUser(db)
    db.prepare('INSERT INTO bookings (class_id, user_id, name, email, phone, booked_at) VALUES (?, ?, ?, ?, ?, ?)').run(1, userId, 'T', 't@t.com', '', new Date().toISOString())
    db.prepare('INSERT INTO reviews (class_id, user_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)').run(1, userId, 4, 'great', new Date().toISOString())

    const res = await request(app).get('/api/classes')
    expect(res.body[0].avgRating).toBe(4)
    expect(res.body[0].reviewCount).toBe(1)
  })

  it('returns avgRating as null when no reviews', async () => {
    const res = await request(app).get('/api/classes')
    expect(res.body[0].avgRating).toBeNull()
    expect(res.body[0].reviewCount).toBe(0)
  })
})
