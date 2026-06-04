import { useState } from 'react'
import StarRating from './StarRating.tsx'
import { useAuth } from '../contexts/AuthContext.tsx'
import type { YogaClass } from '../types.ts'

interface ReviewModalProps {
  classItem: YogaClass
  onSubmitted: () => void
  onClose: () => void
}

export default function ReviewModal({ classItem, onSubmitted, onClose }: ReviewModalProps) {
  const { authFetch } = useAuth()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const formattedDate = new Date(classItem.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('Please select a rating'); return }
    setLoading(true)
    const res = await authFetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: classItem.id, rating, comment }),
    })
    setLoading(false)
    if (res.ok) { onSubmitted() }
    else {
      const { error: msg } = await res.json() as { error: string }
      setError(msg)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-header">
          <h3>{classItem.emoji} Leave a Review</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-summary">
          <strong>{classItem.title}</strong>
          <span>📅 {formattedDate}</span>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Rating *</label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
          <div className="form-group">
            <label>Comment (optional)</label>
            <textarea
              className="review-textarea"
              placeholder="How was the class? Tell others about the puppies!"
              value={comment}
              rows={3}
              onChange={e => setComment(e.target.value)}
            />
          </div>
          {error && <div className="form-error">{error}</div>}
        </form>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-confirm" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
