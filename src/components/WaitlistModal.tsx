import { useState } from 'react'
import type { YogaClass } from '../types.ts'

interface WaitlistModalProps {
  classItem: YogaClass
  onConfirm: (email: string) => void
  onClose: () => void
}

export default function WaitlistModal({ classItem, onConfirm, onClose }: WaitlistModalProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const { title, date, time, emoji } = classItem

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    onConfirm(email)
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-header">
          <h3>{emoji} Join Waitlist</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-summary">
          <strong>{title}</strong>
          <span>📅 {formattedDate} · {time}</span>
          <span className="waitlist-note">This class is full. We'll email you if a spot opens up.</span>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Email *</label>
            <input
              type="email"
              placeholder="jane@example.com"
              value={email}
              autoFocus
              onChange={e => { setEmail(e.target.value); setError('') }}
              style={error ? { borderColor: '#e74c3c' } : {}}
            />
            {error && <span style={{ color: '#e74c3c', fontSize: '0.8rem' }}>{error}</span>}
          </div>
        </form>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-confirm" onClick={handleSubmit}>
            Join Waitlist
          </button>
        </div>
      </div>
    </div>
  )
}
