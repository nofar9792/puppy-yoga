import type { YogaClass, BookingFormData } from '../types.ts'

interface Props {
  classItem: YogaClass
  formData: BookingFormData
  onClose: () => void
}

function parseClassDatetime(date: string, time: string): { hours: number; minutes: number } {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return { hours: 9, minutes: 0 }
  let hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const ampm = match[3].toUpperCase()
  if (ampm === 'PM' && hours !== 12) hours += 12
  if (ampm === 'AM' && hours === 12) hours = 0
  return { hours, minutes }
}

function toICSDate(date: string, time: string, offsetMinutes = 0): string {
  const { hours, minutes } = parseClassDatetime(date, time)
  const totalMins = hours * 60 + minutes + offsetMinutes
  const h = Math.floor(totalMins / 60) % 24
  const m = totalMins % 60
  const d = date.replace(/-/g, '')
  return `${d}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`
}

function generateICS(classItem: YogaClass, name: string): string {
  const durationMins = parseInt(classItem.duration) || 60
  const start = toICSDate(classItem.date, classItem.time)
  const end = toICSDate(classItem.date, classItem.time, durationMins)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PuppyYoga//EN',
    'BEGIN:VEVENT',
    `UID:puppy-yoga-${classItem.id}-${Date.now()}@puppyyoga`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:🐾 ${classItem.title}`,
    `DESCRIPTION:Instructor: ${classItem.instructor}\\nAttendee: ${name}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadICS(classItem: YogaClass, name: string) {
  const content = generateICS(classItem, name)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${classItem.title.replace(/\s+/g, '-')}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function BookingConfirmation({ classItem, formData, onClose }: Props) {
  const formattedDate = new Date(classItem.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-header">
          <h3>🎉 Booking Confirmed!</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="confirmation-body">
          <div className="confirmation-emoji">{classItem.emoji}</div>
          <h4 className="confirmation-title">{classItem.title}</h4>
          <ul className="confirmation-details">
            <li>📅 {formattedDate} · {classItem.time}</li>
            <li>⏱ {classItem.duration}</li>
            <li>👤 {formData.name}</li>
            <li>✉️ {formData.email}</li>
            <li>💰 ${classItem.price}</li>
          </ul>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Close</button>
          <button
            className="btn-confirm"
            onClick={() => { downloadICS(classItem, formData.name); onClose() }}
          >
            📅 Add to Calendar
          </button>
        </div>
      </div>
    </div>
  )
}
