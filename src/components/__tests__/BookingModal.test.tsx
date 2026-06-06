import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import BookingModal from '../BookingModal.tsx'
import type { YogaClass } from '../../types.ts'

const testClass: YogaClass = {
  id: 1,
  title: 'Morning Paws Flow',
  instructor: 'Sarah',
  date: '2026-07-01',
  time: '9:00 AM',
  duration: '60 min',
  spots: 5,
  totalSpots: 10,
  level: 'All Levels',
  dogs: ['Golden Retriever'],
  price: 35,
  emoji: '🐕',
  avgRating: null,
  reviewCount: 0,
}

function renderModal(onConfirm = vi.fn(), onClose = vi.fn()) {
  render(<BookingModal classItem={testClass} onConfirm={onConfirm} onClose={onClose} />)
  return { onConfirm, onClose }
}

describe('BookingModal', () => {
  it('displays class title, time and price in summary', () => {
    renderModal()
    expect(screen.getByText('Morning Paws Flow')).toBeInTheDocument()
    expect(screen.getByText(/9:00 AM/)).toBeInTheDocument()
    expect(screen.getAllByText(/\$35/).length).toBeGreaterThan(0)
  })

  it('calls onClose when the × button is clicked', () => {
    const { onClose } = renderModal()
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Cancel button is clicked', () => {
    const { onClose } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when overlay is clicked', () => {
    const { onClose } = renderModal()
    fireEvent.click(screen.getByText('Morning Paws Flow').closest('.modal-overlay')!)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows name error when name is empty on submit', () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: /Confirm Booking/ }))
    expect(screen.getByText('Name is required')).toBeInTheDocument()
  })

  it('shows email error when email is empty on submit', () => {
    renderModal()
    fireEvent.change(screen.getByPlaceholderText('Jane Smith'), { target: { value: 'Alice' } })
    fireEvent.click(screen.getByRole('button', { name: /Confirm Booking/ }))
    expect(screen.getByText('Valid email required')).toBeInTheDocument()
  })

  it('shows email error when email format is invalid', () => {
    renderModal()
    fireEvent.change(screen.getByPlaceholderText('Jane Smith'), { target: { value: 'Alice' } })
    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'not-an-email' } })
    fireEvent.click(screen.getByRole('button', { name: /Confirm Booking/ }))
    expect(screen.getByText('Valid email required')).toBeInTheDocument()
  })

  it('calls onConfirm with form data when name and email are valid', () => {
    const { onConfirm } = renderModal()
    fireEvent.change(screen.getByPlaceholderText('Jane Smith'), { target: { value: 'Alice Smith' } })
    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'alice@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('+1 (555) 000-0000'), { target: { value: '555-1234' } })
    fireEvent.click(screen.getByRole('button', { name: /Confirm Booking/ }))
    expect(onConfirm).toHaveBeenCalledWith({ name: 'Alice Smith', email: 'alice@example.com', phone: '555-1234' })
  })

  it('calls onConfirm even with empty phone (phone is optional)', () => {
    const { onConfirm } = renderModal()
    fireEvent.change(screen.getByPlaceholderText('Jane Smith'), { target: { value: 'Alice' } })
    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'alice@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /Confirm Booking/ }))
    expect(onConfirm).toHaveBeenCalledWith({ name: 'Alice', email: 'alice@example.com', phone: '' })
  })

  it('does not call onConfirm when validation fails', () => {
    const { onConfirm } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: /Confirm Booking/ }))
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
