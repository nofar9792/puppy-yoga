import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AuthModal from '../AuthModal.tsx'
import { useAuth } from '../../contexts/AuthContext.tsx'

vi.mock('../../contexts/AuthContext.tsx', () => ({
  useAuth: vi.fn(),
}))

const mockLogin = vi.fn()
const mockSignup = vi.fn()

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    token: null,
    login: mockLogin,
    signup: mockSignup,
    logout: vi.fn(),
    authFetch: vi.fn(),
  })
  mockLogin.mockReset()
  mockSignup.mockReset()
})

describe('AuthModal – login mode', () => {
  it('shows email and password fields', () => {
    render(<AuthModal onClose={vi.fn()} initialMode="login" />)
    expect(screen.getByPlaceholderText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Full Name/)).not.toBeInTheDocument()
  })

  it('calls login() and onClose on successful submit', async () => {
    mockLogin.mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(<AuthModal onClose={onClose} initialMode="login" />)

    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'alice@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }))

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('alice@example.com', 'secret123'))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })

  it('shows error message when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid email or password'))
    render(<AuthModal onClose={vi.fn()} initialMode="login" />)

    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'x@x.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }))

    await waitFor(() => expect(screen.getByText('Invalid email or password')).toBeInTheDocument())
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(<AuthModal onClose={onClose} initialMode="login" />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('AuthModal – signup mode', () => {
  it('shows name, email, password and confirm password fields', () => {
    render(<AuthModal onClose={vi.fn()} initialMode="signup" />)
    expect(screen.getByPlaceholderText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('jane@example.com')).toBeInTheDocument()
    expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2)
  })

  it('shows error when passwords do not match', async () => {
    render(<AuthModal onClose={vi.fn()} initialMode="signup" />)

    fireEvent.change(screen.getByPlaceholderText('Jane Smith'), { target: { value: 'Alice' } })
    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'alice@example.com' } })
    const [password, confirm] = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(password, { target: { value: 'secret123' } })
    fireEvent.change(confirm, { target: { value: 'different' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }))

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    expect(mockSignup).not.toHaveBeenCalled()
  })

  it('calls signup() with name, email and password on valid submit', async () => {
    mockSignup.mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(<AuthModal onClose={onClose} initialMode="signup" />)

    fireEvent.change(screen.getByPlaceholderText('Jane Smith'), { target: { value: 'Alice' } })
    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'alice@example.com' } })
    const [password, confirm] = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(password, { target: { value: 'secret123' } })
    fireEvent.change(confirm, { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }))

    await waitFor(() => expect(mockSignup).toHaveBeenCalledWith('Alice', 'alice@example.com', 'secret123'))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })

  it('shows error when signup fails', async () => {
    mockSignup.mockRejectedValue(new Error('Email already registered'))
    render(<AuthModal onClose={vi.fn()} initialMode="signup" />)

    fireEvent.change(screen.getByPlaceholderText('Jane Smith'), { target: { value: 'Alice' } })
    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'alice@example.com' } })
    const [password, confirm] = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(password, { target: { value: 'secret123' } })
    fireEvent.change(confirm, { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }))

    await waitFor(() => expect(screen.getByText('Email already registered')).toBeInTheDocument())
  })
})

describe('AuthModal – mode switching', () => {
  it('switches from login to signup when "Sign up" link is clicked', () => {
    render(<AuthModal onClose={vi.fn()} initialMode="login" />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }))
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument()
  })

  it('switches from signup to login when "Log in" link is clicked', () => {
    render(<AuthModal onClose={vi.fn()} initialMode="signup" />)
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument()
  })

  it('clears error message when switching modes', async () => {
    mockLogin.mockRejectedValue(new Error('Some error'))
    render(<AuthModal onClose={vi.fn()} initialMode="login" />)

    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'x@x.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'pw' } })
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }))
    await waitFor(() => expect(screen.getByText('Some error')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }))
    expect(screen.queryByText('Some error')).not.toBeInTheDocument()
  })
})
