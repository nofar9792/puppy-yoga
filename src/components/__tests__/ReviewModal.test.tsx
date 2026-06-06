import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ReviewModal from '../ReviewModal.tsx'
import { useAuth } from '../../contexts/AuthContext.tsx'
import type { YogaClass } from '../../types.ts'

vi.mock('../../contexts/AuthContext.tsx', () => ({
  useAuth: vi.fn(),
}))

const testClass: YogaClass = {
  id: 1,
  title: 'Morning Paws Flow',
  instructor: 'Sarah',
  date: '2026-07-01',
  time: '9:00 AM',
  duration: '60 min',
  spots: 0,
  totalSpots: 10,
  level: 'All Levels',
  dogs: ['Golden Retriever'],
  price: 35,
  emoji: '🐕',
  avgRating: null,
  reviewCount: 0,
}

let mockAuthFetch: ReturnType<typeof vi.fn>

beforeEach(() => {
  mockAuthFetch = vi.fn()
  vi.mocked(useAuth).mockReturnValue({
    user: { userId: 1, name: 'Alice', email: 'alice@example.com', isAdmin: false },
    token: 'tok',
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    authFetch: mockAuthFetch,
  })
})

function renderModal(onSubmitted = vi.fn(), onClose = vi.fn()) {
  render(<ReviewModal classItem={testClass} onSubmitted={onSubmitted} onClose={onClose} />)
  return { onSubmitted, onClose }
}

describe('ReviewModal', () => {
  it('shows class title and date', () => {
    renderModal()
    expect(screen.getByText('Morning Paws Flow')).toBeInTheDocument()
  })

  it('renders 5 star buttons', () => {
    renderModal()
    expect(screen.getAllByRole('button').filter(b => b.getAttribute('aria-label')?.includes('star'))).toHaveLength(5)
  })

  it('shows error when submitting without selecting a rating', async () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }))
    expect(screen.getByText('Please select a rating')).toBeInTheDocument()
    expect(mockAuthFetch).not.toHaveBeenCalled()
  })

  it('calls authFetch with classId, rating and comment on valid submit', async () => {
    mockAuthFetch.mockResolvedValue({ ok: true })
    const { onSubmitted } = renderModal()

    fireEvent.click(screen.getByLabelText('4 star'))
    fireEvent.change(screen.getByPlaceholderText(/How was the class/), { target: { value: 'Great experience!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }))

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledWith('/api/reviews', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ classId: 1, rating: 4, comment: 'Great experience!' }),
    })))
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledOnce())
  })

  it('submits with empty comment (comment is optional)', async () => {
    mockAuthFetch.mockResolvedValue({ ok: true })
    renderModal()

    fireEvent.click(screen.getByLabelText('5 star'))
    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }))

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledWith('/api/reviews', expect.objectContaining({
      body: JSON.stringify({ classId: 1, rating: 5, comment: '' }),
    })))
  })

  it('shows API error message on failed submit', async () => {
    mockAuthFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Already reviewed this class' }),
    })
    renderModal()

    fireEvent.click(screen.getByLabelText('3 star'))
    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }))

    await waitFor(() => expect(screen.getByText('Already reviewed this class')).toBeInTheDocument())
  })

  it('calls onClose when Cancel is clicked', () => {
    const { onClose } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('disables Submit button while loading', async () => {
    let resolve: (v: unknown) => void
    mockAuthFetch.mockReturnValue(new Promise(r => { resolve = r }))
    renderModal()

    fireEvent.click(screen.getByLabelText('5 star'))
    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Submitting…' })).toBeDisabled())
    resolve!({ ok: true })
  })
})
