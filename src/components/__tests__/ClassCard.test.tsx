import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ClassCard from '../ClassCard.tsx'
import type { YogaClass } from '../../types.ts'

const baseClass: YogaClass = {
  id: 1,
  title: 'Morning Paws Flow',
  instructor: 'Sarah',
  date: '2026-07-01',
  time: '9:00 AM',
  duration: '60 min',
  spots: 5,
  totalSpots: 10,
  level: 'All Levels',
  dogs: ['Golden Retriever', 'Labrador'],
  price: 35,
  emoji: '🐕',
  avgRating: null,
  reviewCount: 0,
}

function renderCard(overrides: Partial<YogaClass> = {}, props: Partial<{ isBooked: boolean; onWaitlist: boolean }> = {}) {
  const onBook = vi.fn()
  const onJoinWaitlist = vi.fn()
  render(
    <ClassCard
      classItem={{ ...baseClass, ...overrides }}
      isBooked={props.isBooked ?? false}
      onWaitlist={props.onWaitlist ?? false}
      onBook={onBook}
      onJoinWaitlist={onJoinWaitlist}
    />
  )
  return { onBook, onJoinWaitlist }
}

describe('ClassCard', () => {
  it('renders class title, instructor and emoji', () => {
    renderCard()
    expect(screen.getByText('Morning Paws Flow')).toBeInTheDocument()
    expect(screen.getByText('Sarah')).toBeInTheDocument()
    expect(screen.getByText('🐕')).toBeInTheDocument()
  })

  it('renders dog tags', () => {
    renderCard()
    expect(screen.getByText('Golden Retriever')).toBeInTheDocument()
    expect(screen.getByText('Labrador')).toBeInTheDocument()
  })

  it('renders price', () => {
    renderCard()
    expect(screen.getByText('$35')).toBeInTheDocument()
  })

  it('renders level badge', () => {
    renderCard()
    expect(screen.getByText('All Levels')).toBeInTheDocument()
  })

  it('shows spots available text', () => {
    renderCard({ spots: 3, totalSpots: 10 })
    expect(screen.getByText('3 of 10 spots left')).toBeInTheDocument()
  })

  it('shows "Class full" when spots is 0', () => {
    renderCard({ spots: 0, totalSpots: 10 })
    expect(screen.getByText('Class full')).toBeInTheDocument()
  })

  it('shows "Book Now" button when spots available and not booked', () => {
    renderCard({ spots: 5 })
    expect(screen.getByRole('button', { name: 'Book Now' })).toBeInTheDocument()
  })

  it('calls onBook when "Book Now" is clicked', () => {
    const { onBook } = renderCard({ spots: 5 })
    fireEvent.click(screen.getByRole('button', { name: 'Book Now' }))
    expect(onBook).toHaveBeenCalledOnce()
  })

  it('shows "✓ Booked" status when isBooked is true', () => {
    renderCard({}, { isBooked: true })
    expect(screen.getByText('✓ Booked')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Book Now' })).not.toBeInTheDocument()
  })

  it('shows "Join Waitlist" button when full and not on waitlist', () => {
    renderCard({ spots: 0 }, { onWaitlist: false })
    expect(screen.getByRole('button', { name: 'Join Waitlist' })).toBeInTheDocument()
  })

  it('calls onJoinWaitlist when "Join Waitlist" is clicked', () => {
    const { onJoinWaitlist } = renderCard({ spots: 0 }, { onWaitlist: false })
    fireEvent.click(screen.getByRole('button', { name: 'Join Waitlist' }))
    expect(onJoinWaitlist).toHaveBeenCalledOnce()
  })

  it('shows "⏳ On Waitlist" when full and already on waitlist', () => {
    renderCard({ spots: 0 }, { onWaitlist: true })
    expect(screen.getByText('⏳ On Waitlist')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Join Waitlist' })).not.toBeInTheDocument()
  })

  it('shows rating when avgRating and reviewCount are set', () => {
    renderCard({ avgRating: 4.5, reviewCount: 3 })
    expect(screen.getByText('4.5 (3)')).toBeInTheDocument()
  })

  it('does not show rating when reviewCount is 0', () => {
    renderCard({ avgRating: null, reviewCount: 0 })
    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument()
  })
})
