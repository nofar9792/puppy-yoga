import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestApp, createTestDb, insertUser } from './helpers'

describe('POST /api/auth/signup', () => {
  let app: ReturnType<typeof createTestApp>['app']

  beforeEach(() => {
    app = createTestApp().app
  })

  it('creates the first user as admin', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'secret123' })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeTruthy()
    expect(res.body.user.name).toBe('Alice')
    expect(res.body.user.email).toBe('alice@example.com')
    expect(res.body.user.isAdmin).toBe(true)
  })

  it('creates subsequent users as non-admin', async () => {
    await request(app).post('/api/auth/signup').send({ name: 'Alice', email: 'alice@example.com', password: 'pw' })
    const res = await request(app).post('/api/auth/signup').send({ name: 'Bob', email: 'bob@example.com', password: 'pw' })
    expect(res.status).toBe(201)
    expect(res.body.user.isAdmin).toBe(false)
  })

  it('returns 400 when any field is missing', async () => {
    const res = await request(app).post('/api/auth/signup').send({ name: 'Alice' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('All fields required')
  })

  it('returns 409 on duplicate email', async () => {
    await request(app).post('/api/auth/signup').send({ name: 'Alice', email: 'alice@example.com', password: 'pw' })
    const res = await request(app).post('/api/auth/signup').send({ name: 'Alice2', email: 'alice@example.com', password: 'pw' })
    expect(res.status).toBe(409)
    expect(res.body.error).toBe('Email already registered')
  })
})

describe('POST /api/auth/login', () => {
  let app: ReturnType<typeof createTestApp>['app']
  let db: ReturnType<typeof createTestApp>['db']

  beforeEach(() => {
    const result = createTestApp()
    app = result.app
    db = result.db
    insertUser(db, { name: 'Alice', email: 'alice@example.com', password: 'secret123' })
  })

  it('returns token and user on correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'alice@example.com', password: 'secret123' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()
    expect(res.body.user.name).toBe('Alice')
    expect(res.body.user.email).toBe('alice@example.com')
  })

  it('returns 401 on wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'alice@example.com', password: 'wrong' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid email or password')
  })

  it('returns 401 on unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'secret123' })
    expect(res.status).toBe(401)
  })
})
