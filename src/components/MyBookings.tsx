import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext.tsx'
import ReviewModal from './ReviewModal.tsx'
import StarRating from './StarRating.tsx'
import { downloadICS } from './BookingConfirmation.tsx'
import type { Booking, YogaClass } from '../types.ts'

interface MyBookingsProps {
  bookings: Booking[]
  classes: YogaClass[]
  onCancel: (classId: number) => void
  onBrowse: () => void
}

export default function MyBookings({ bookings, classes, onCancel, onBrowse }: MyBookingsProps) {
  const { authFetch } = useAuth()
  const [reviewedClassIds, setReviewedClassIds] = useState<number[]>([])
  const [reviewTarget, setReviewTarget] = useState<YogaClass | null>(null)

  const fetchReviewed = useCallback(async () => {
    const res = await authFetch('/api/reviews/user/mine')
    setReviewedClassIds(await res.json() as number[])
  }, [authFetch])

  useEffect(() => { fetchReviewed() }, [fetchReviewed])

  const today = new Date().toISOString().split('T')[0]

  if (bookings.length === 0) {
    return (
      <main className="main">
        <div className="empty-state">
          <div className="empty-emoji">🐾</div>
          <h3>No bookings yet</h3>
          <p>You haven't booked any classes. Find one that looks fun!</p>
          <button className="btn-book" onClick={onBrowse}>Browse Classes</button>
        </div>
      </main>
    )
  }

  return (
    <main className="main">
      <section className="hero" style={{ paddingBottom: '1rem' }}>
        <h2>My Bookings</h2>
        <p>{bookings.length} class{bookings.length > 1 ? 'es' : ''}</p>
      </section>

      <div className="bookings-list">
        {bookings.map(booking => {
          const classItem = classes.find(c => c.id === booking.classId)
          if (!classItem) return null

          const isPast = classItem.date < today
          const alreadyReviewed = reviewedClassIds.includes(classItem.id)

          const formattedDate = new Date(classItem.date).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric',
          })
          const bookedOn = new Date(booking.bookedAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })

          return (
            <div key={booking.classId} className="booking-card">
              <div className="booking-emoji">{classItem.emoji}</div>
              <div className="booking-info">
                <div className="booking-title">{classItem.title}</div>
                <div className="booking-meta">
                  <span>📅 {formattedDate} · {classItem.time}</span>
                  <span>⏱ {classItem.duration}</span>
                  <span>💰 ${classItem.price}</span>
                </div>
                <div className="booking-attendee">
                  <span>👤 {booking.name}</span>
                  <span>✉️ {booking.email}</span>
                  {booking.phone && <span>📞 {booking.phone}</span>}
                </div>
                <div className="booking-footer">
                  <span className="booking-date">Booked on {bookedOn}</span>
                  <div className="booking-actions">
                    <button className="btn-cal" onClick={() => downloadICS(classItem, booking.name)} title="Add to Calendar">
                      📅
                    </button>
                    {isPast && (
                      alreadyReviewed
                        ? <span className="reviewed-badge">✓ Reviewed</span>
                        : <button className="btn-review" onClick={() => setReviewTarget(classItem)}>Rate & Review</button>
                    )}
                    {!isPast && (
                      <button className="btn-cancel-booking" onClick={() => {
                        if (window.confirm(`Cancel "${classItem.title}"?`)) onCancel(booking.classId)
                      }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {reviewTarget && (
        <ReviewModal
          classItem={reviewTarget}
          onSubmitted={() => { setReviewTarget(null); fetchReviewed() }}
          onClose={() => setReviewTarget(null)}
        />
      )}

      {/* Star display for visual reference */}
      <div style={{ display: 'none' }}><StarRating value={0} /></div>
    </main>
  )
}
