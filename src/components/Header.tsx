import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.tsx'
import AuthModal from './AuthModal.tsx'

type View = 'classes' | 'my-bookings' | 'admin'

interface HeaderProps {
  bookingCount: number
  view: View
  onViewChange: (v: View) => void
}

export default function Header({ bookingCount, view, onViewChange }: HeaderProps) {
  const { user, logout } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  return (
    <>
      <header className="header">
        <div className="header-logo">
          <span>🐾</span>
          PuppyYoga
        </div>

        <nav className="header-nav">
          <button className={`nav-btn ${view === 'classes' ? 'active' : ''}`} onClick={() => onViewChange('classes')}>
            Classes
          </button>
          {user && (
            <button className={`nav-btn ${view === 'my-bookings' ? 'active' : ''}`} onClick={() => onViewChange('my-bookings')}>
              My Bookings
              {bookingCount > 0 && <span className="nav-badge">{bookingCount}</span>}
            </button>
          )}
          {user?.isAdmin && (
            <button className={`nav-btn ${view === 'admin' ? 'active' : ''}`} onClick={() => onViewChange('admin')}>
              Admin
            </button>
          )}
        </nav>

        <div className="header-user">
          {user ? (
            <>
              <span className="user-name">👤 {user.name}</span>
              <button className="btn-logout" onClick={logout}>Log out</button>
            </>
          ) : (
            <button className="btn-login" onClick={() => setShowAuth(true)}>Log in</button>
          )}
        </div>
      </header>

      <nav className="bottom-nav">
        <button
          className={`bottom-nav-btn ${view === 'classes' ? 'active' : ''}`}
          onClick={() => onViewChange('classes')}
        >
          <span className="bottom-nav-icon">🏠</span>
          <span className="bottom-nav-label">Classes</span>
        </button>

        {user && (
          <button
            className={`bottom-nav-btn ${view === 'my-bookings' ? 'active' : ''}`}
            onClick={() => onViewChange('my-bookings')}
          >
            <span className="bottom-nav-icon-wrap">
              <span className="bottom-nav-icon">📅</span>
              {bookingCount > 0 && <span className="bottom-nav-badge">{bookingCount}</span>}
            </span>
            <span className="bottom-nav-label">My Bookings</span>
          </button>
        )}

        {user?.isAdmin && (
          <button
            className={`bottom-nav-btn ${view === 'admin' ? 'active' : ''}`}
            onClick={() => onViewChange('admin')}
          >
            <span className="bottom-nav-icon">⚙️</span>
            <span className="bottom-nav-label">Admin</span>
          </button>
        )}

        {user ? (
          <button className="bottom-nav-btn" onClick={logout}>
            <span className="bottom-nav-icon">👤</span>
            <span className="bottom-nav-label">Log out</span>
          </button>
        ) : (
          <button className="bottom-nav-btn" onClick={() => setShowAuth(true)}>
            <span className="bottom-nav-icon">👤</span>
            <span className="bottom-nav-label">Log in</span>
          </button>
        )}
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
