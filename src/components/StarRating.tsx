interface StarRatingProps {
  value: number
  max?: number
  onChange?: (v: number) => void
  size?: 'sm' | 'md' | 'lg'
}

export default function StarRating({ value, max = 5, onChange, size = 'md' }: StarRatingProps) {
  const sizes = { sm: '0.9rem', md: '1.3rem', lg: '1.8rem' }

  return (
    <div className="star-rating" style={{ fontSize: sizes[size] }}>
      {Array.from({ length: max }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          type="button"
          className={`star ${star <= value ? 'filled' : ''} ${onChange ? 'interactive' : ''}`}
          onClick={() => onChange?.(star)}
          aria-label={`${star} star`}
        >
          {star <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  )
}
