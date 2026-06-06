import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import WaitlistModal from '../WaitlistModal.tsx'
import type { YogaClass } from '../../types.ts'

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

function renderModal(onConfirm = vi.fn(), onClose = vi.fn()) {
  render(<WaitlistModal classItem={testClass} onConfirm={onConfirm} onClose={onClose} />)
  return { onConfirm, onClose }
}

describe('WaitlistModal', () => {
  it('shows class title and time', () => {
    renderModal()
    expect(screen.getByText('Morning Paws Flow')).toBeInTheDocument()
    expect(screen.getByText(/9:00 AM/)).toBeInTheDocument()
  })

  it('shows the waitlist note', () => {
    renderModal()
    expect(screen.getByText(/This class is full/)).toBeInTheDocument()
  })

  it('calls onClose when × is clicked', () => {
    const { onClose } = renderModal()
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Cancel is clicked', () => {
    const { onClose } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows error when email is empty on submit', () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Join Waitlist' }))
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
  })

  it('shows error when email format is invalid', () => {
    renderModal()
    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'not-an-email' } })
    fireEvent.click(screen.getByRole('button', { name: 'Join Waitlist' }))
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
  })

  it('clears error when user starts typing after an invalid submit', () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Join Waitlist' }))
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'a' } })
    expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument()
  })

  it('calls onConfirm with the email when valid', () => {
    const { onConfirm } = renderModal()
    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'alice@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Join Waitlist' }))
    expect(onConfirm).toHaveBeenCalledWith('alice@example.com')
  })

  it('does not call onConfirm when email is invalid', () => {
    const { onConfirm } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Join Waitlist' }))
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
