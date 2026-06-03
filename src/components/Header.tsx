type View = 'classes' | 'my-bookings'

interface HeaderProps {
  bookingCount: number
  view: View
  onViewChange: (v: View) => void
}

export default function Header({ bookingCount, view, onViewChange }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-logo">
        <span>🐾</span>
        PuppyYoga
      </div>

      <nav className="header-nav">
        <button
          className={`nav-btn ${view === 'classes' ? 'active' : ''}`}
          onClick={() => onViewChange('classes')}
        >
          Classes
        </button>
        <button
          className={`nav-btn ${view === 'my-bookings' ? 'active' : ''}`}
          onClick={() => onViewChange('my-bookings')}
        >
          My Bookings
          {bookingCount > 0 && (
            <span className="nav-badge">{bookingCount}</span>
          )}
        </button>
      </nav>
    </header>
  )
}
