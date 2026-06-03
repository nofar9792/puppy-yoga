import { useState } from 'react'
import type { YogaClass, BookingFormData } from '../types.ts'

interface BookingModalProps {
  classItem: YogaClass
  onConfirm: (formData: BookingFormData) => void
  onClose: () => void
}

interface FormErrors {
  name?: string
  email?: string
}

export default function BookingModal({ classItem, onConfirm, onClose }: BookingModalProps) {
  const [form, setForm] = useState<BookingFormData>({ name: '', email: '', phone: '' })
  const [errors, setErrors] = useState<FormErrors>({})

  const { title, date, time, price, emoji } = classItem

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required'
    return errs
  }

  function handleSubmit(e: React.FormEvent | React.MouseEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    onConfirm(form)
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-header">
          <h3>{emoji} Book Your Spot</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-summary">
          <strong>{title}</strong>
          <span>📅 {formattedDate} · {time}</span>
          <span>💰 ${price} per person</span>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              placeholder="Jane Smith"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={errors.name ? { borderColor: '#e74c3c' } : {}}
            />
            {errors.name && <span style={{ color: '#e74c3c', fontSize: '0.8rem' }}>{errors.name}</span>}
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              style={errors.email ? { borderColor: '#e74c3c' } : {}}
            />
            {errors.email && <span style={{ color: '#e74c3c', fontSize: '0.8rem' }}>{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Phone (optional)</label>
            <input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
        </form>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-confirm" onClick={handleSubmit}>
            Confirm Booking — ${price}
          </button>
        </div>
      </div>
    </div>
  )
}
