import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AuthProvider, useAuth } from '../AuthContext.tsx'

function TestConsumer() {
  const { user, token, login, signup, logout, authFetch } = useAuth()
  return (
    <div>
      <div data-testid="user-name">{user?.name ?? 'none'}</div>
      <div data-testid="token">{token ?? 'none'}</div>
      <button onClick={() => login('test@example.com', 'pass123')}>login</button>
      <button onClick={() => signup('Test User', 'test@example.com', 'pass123')}>signup</button>
      <button onClick={logout}>logout</button>
      <button onClick={() => authFetch('/api/test')}>authFetch</button>
    </div>
  )
}

const STORAGE_KEY = 'puppy-yoga-auth'

function mockFetchSuccess(body: object) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(body),
  }))
}

function mockFetchFailure(body: object, status = 401) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  }))
}

beforeEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('AuthContext', () => {
  it('starts with no user when localStorage is empty', () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    expect(screen.getByTestId('user-name').textContent).toBe('none')
    expect(screen.getByTestId('token').textContent).toBe('none')
  })

  it('loads user from localStorage on mount', () => {
    const stored = { user: { userId: 1, name: 'Stored User', email: 's@s.com', isAdmin: false }, token: 'stored-token' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    expect(screen.getByTestId('user-name').textContent).toBe('Stored User')
    expect(screen.getByTestId('token').textContent).toBe('stored-token')
  })

  it('login() sets user, token and persists to localStorage', async () => {
    mockFetchSuccess({ token: 'jwt-token', user: { userId: 1, name: 'Alice', email: 'alice@example.com', isAdmin: false } })
    render(<AuthProvider><TestConsumer /></AuthProvider>)

    fireEvent.click(screen.getByText('login'))

    await waitFor(() => expect(screen.getByTestId('user-name').textContent).toBe('Alice'))
    expect(screen.getByTestId('token').textContent).toBe('jwt-token')
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy()
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.user.name).toBe('Alice')
    expect(stored.token).toBe('jwt-token')
  })

  it('login() throws when server returns an error', async () => {
    mockFetchFailure({ error: 'Invalid email or password' })
    let caught: Error | null = null

    function ErrConsumer() {
      const { login } = useAuth()
      return <button onClick={() => login('x@x.com', 'wrong').catch(e => { caught = e })}>go</button>
    }

    render(<AuthProvider><ErrConsumer /></AuthProvider>)
    fireEvent.click(screen.getByText('go'))
    await waitFor(() => expect(caught?.message).toBe('Invalid email or password'))
  })

  it('signup() sets user and token on success', async () => {
    mockFetchSuccess({ token: 'new-token', user: { userId: 2, name: 'Bob', email: 'bob@example.com', isAdmin: false } })
    render(<AuthProvider><TestConsumer /></AuthProvider>)

    fireEvent.click(screen.getByText('signup'))

    await waitFor(() => expect(screen.getByTestId('user-name').textContent).toBe('Bob'))
    expect(screen.getByTestId('token').textContent).toBe('new-token')
  })

  it('logout() clears user, token and removes localStorage entry', async () => {
    mockFetchSuccess({ token: 'tok', user: { userId: 1, name: 'Alice', email: 'a@a.com', isAdmin: false } })
    render(<AuthProvider><TestConsumer /></AuthProvider>)

    fireEvent.click(screen.getByText('login'))
    await waitFor(() => expect(screen.getByTestId('user-name').textContent).toBe('Alice'))

    fireEvent.click(screen.getByText('logout'))
    expect(screen.getByTestId('user-name').textContent).toBe('none')
    expect(screen.getByTestId('token').textContent).toBe('none')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('authFetch() adds Bearer token to request headers', async () => {
    const stored = { user: { userId: 1, name: 'A', email: 'a@a.com', isAdmin: false }, token: 'my-token' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
    vi.stubGlobal('fetch', fetchMock)

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    fireEvent.click(screen.getByText('authFetch'))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer my-token')
  })

  it('useAuth() throws outside AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    function Naked() { useAuth(); return null }
    expect(() => render(<Naked />)).toThrow('useAuth must be used inside AuthProvider')
    consoleError.mockRestore()
  })
})
