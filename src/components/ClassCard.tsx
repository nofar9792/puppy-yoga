import StarRating from './StarRating.tsx'
import type { YogaClass } from '../types.ts'

interface ClassCardProps {
  classItem: YogaClass
  isBooked: boolean
  onWaitlist: boolean
  isPast?: boolean
  onBook: () => void
  onJoinWaitlist: () => void
}

function levelClass(level: YogaClass['level']): string {
  if (level === 'Beginner') return 'level-beginner'
  if (level === 'Intermediate') return 'level-intermediate'
  return 'level-all'
}

export default function ClassCard({ classItem, isBooked, onWaitlist, isPast, onBook, onJoinWaitlist }: ClassCardProps) {
  const { id, title, instructor, date, time, duration, spots, totalSpots, level, dogs, price, emoji, avgRating, reviewCount } = classItem
  const isFull = spots === 0
  const spotsPercent = Math.round((spots / totalSpots) * 100)
  const fillColor = spots <= 2 ? '#e74c3c' : spots <= 5 ? '#f39c12' : '#27ae60'

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })

  function handleShare() {
    const url = `${window.location.origin}/?class=${id}`
    if (navigator.share) {
      navigator.share({ title, text: `Join me at ${title} 🐾`, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => {
        const el = document.getElementById(`share-toast-${id}`)
        if (el) { el.style.display = 'block'; setTimeout(() => { el.style.display = 'none' }, 2000) }
      })
    }
  }

  function renderAction() {
    if (isPast) return <div className="btn-past">Past class</div>
    if (isBooked) return <div className="btn-booked">✓ Booked</div>
    if (isFull) {
      return onWaitlist
        ? <div className="btn-on-waitlist">⏳ On Waitlist</div>
        : <button className="btn-waitlist" onClick={onJoinWaitlist}>Join Waitlist</button>
    }
    return <button className="btn-book" onClick={onBook}>Book Now</button>
  }

  return (
    <div className={`card${isPast ? ' card-past' : ''}`}>
      <div className="card-header">
        {emoji}
        <button className="share-btn" onClick={handleShare} title="Share class link" aria-label="Share class">
          🔗
        </button>
        <span id={`share-toast-${id}`} className="share-copied" style={{ display: 'none' }}>Copied!</span>
      </div>
      <div className="card-body">
        <div className={`level-badge ${levelClass(level)}`}>{level}</div>
        <div className="card-title">{title}</div>
        <div className="card-instructor">{instructor}</div>

        {avgRating !== null && reviewCount > 0 && (
          <div className="card-rating">
            <StarRating value={Math.round(avgRating)} size="sm" />
            <span className="rating-text">{avgRating.toFixed(1)} ({reviewCount})</span>
          </div>
        )}

        <div className="card-details">
          <div className="card-detail">
            <span className="card-detail-icon">📅</span>
            {formattedDate} · {time}
          </div>
          <div className="card-detail">
            <span className="card-detail-icon">⏱</span>
            {duration}
          </div>
        </div>

        <div className="card-dogs">
          {dogs.map(dog => <span key={dog} className="dog-tag">{dog}</span>)}
        </div>

        {!isPast && (
          <div className="spots-bar">
            {isFull ? 'Class full' : `${spots} of ${totalSpots} spots left`}
            <div className="spots-track">
              <div className="spots-fill" style={{ width: `${spotsPercent}%`, background: fillColor }} />
            </div>
          </div>
        )}

        <div className="card-footer">
          <div className="card-price">${price}<span>/person</span></div>
          {renderAction()}
        </div>
      </div>
    </div>
  )
}
