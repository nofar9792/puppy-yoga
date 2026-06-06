import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import StarRating from '../StarRating.tsx'

describe('StarRating', () => {
  it('renders 5 stars by default', () => {
    render(<StarRating value={0} />)
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })

  it('renders max stars when max is customized', () => {
    render(<StarRating value={0} max={3} />)
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('fills stars up to value', () => {
    render(<StarRating value={3} />)
    const stars = screen.getAllByRole('button')
    expect(stars[0].textContent).toBe('★')
    expect(stars[1].textContent).toBe('★')
    expect(stars[2].textContent).toBe('★')
    expect(stars[3].textContent).toBe('☆')
    expect(stars[4].textContent).toBe('☆')
  })

  it('shows all empty stars when value is 0', () => {
    render(<StarRating value={0} />)
    screen.getAllByRole('button').forEach(star => expect(star.textContent).toBe('☆'))
  })

  it('shows all filled stars when value equals max', () => {
    render(<StarRating value={5} />)
    screen.getAllByRole('button').forEach(star => expect(star.textContent).toBe('★'))
  })

  it('calls onChange with star index when clicked', () => {
    const onChange = vi.fn()
    render(<StarRating value={0} onChange={onChange} />)
    fireEvent.click(screen.getAllByRole('button')[2]) // 3rd star (index 2 = star 3)
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('does not call onChange when onChange is not provided', () => {
    render(<StarRating value={2} />)
    // clicking should not throw
    expect(() => fireEvent.click(screen.getAllByRole('button')[0])).not.toThrow()
  })

  it('applies interactive class when onChange provided', () => {
    render(<StarRating value={0} onChange={vi.fn()} />)
    expect(screen.getAllByRole('button')[0]).toHaveClass('interactive')
  })

  it('does not apply interactive class without onChange', () => {
    render(<StarRating value={0} />)
    expect(screen.getAllByRole('button')[0]).not.toHaveClass('interactive')
  })

  it('applies filled class to stars at or below value', () => {
    render(<StarRating value={2} />)
    const stars = screen.getAllByRole('button')
    expect(stars[0]).toHaveClass('filled')
    expect(stars[1]).toHaveClass('filled')
    expect(stars[2]).not.toHaveClass('filled')
  })

  it('each star has aria-label', () => {
    render(<StarRating value={0} />)
    expect(screen.getByLabelText('1 star')).toBeInTheDocument()
    expect(screen.getByLabelText('5 star')).toBeInTheDocument()
  })
})
