import type { Booking, YogaClass } from '../types.ts'

interface MyBookingsProps {
  bookings: Booking[]
  classes: YogaClass[]
  onCancel: (classId: number) => void
  onBrowse: () => void
}

export default function MyBookings({ bookings, classes, onCancel, onBrowse }: MyBookingsProps) {
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
        <p>{bookings.length} upcoming class{bookings.length > 1 ? 'es' : ''}</p>
      </section>

      <div className="bookings-list">
        {bookings.map(booking => {
          const classItem = classes.find(c => c.id === booking.classId)
          if (!classItem) return null

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
                  <button
                    className="btn-cancel-booking"
                    onClick={() => {
                      if (window.confirm(`Cancel "${classItem.title}"?`)) {
                        onCancel(booking.classId)
                      }
                    }}
                  >
                    Cancel Booking
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
