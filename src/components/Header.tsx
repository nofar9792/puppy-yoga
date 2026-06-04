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

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
