import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './contexts/AuthContext.tsx'
import Header from './components/Header.tsx'
import ClassCard from './components/ClassCard.tsx'
import BookingModal from './components/BookingModal.tsx'
import WaitlistModal from './components/WaitlistModal.tsx'
import MyBookings from './components/MyBookings.tsx'
import AdminPanel from './components/AdminPanel.tsx'
import SearchBar from './components/SearchBar.tsx'
import AuthModal from './components/AuthModal.tsx'
import type { YogaClass, Booking, BookingFormData, WaitlistEntry } from './types.ts'
import './App.css'

type LevelFilter = 'All' | YogaClass['level']
type View = 'classes' | 'my-bookings' | 'admin'

const LEVELS: LevelFilter[] = ['All', 'Beginner', 'Intermediate', 'All Levels']

export default function App() {
  const { user, authFetch } = useAuth()
  const [view, setView] = useState<View>('classes')
  const [classes, setClasses] = useState<YogaClass[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState<YogaClass | null>(null)
  const [waitlistClass, setWaitlistClass] = useState<YogaClass | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [filterLevel, setFilterLevel] = useState<LevelFilter>('All')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [toast, setToast] = useState('')

  const fetchClasses = useCallback(async () => {
    const res = await fetch('/api/classes')
    setClasses(await res.json() as YogaClass[])
  }, [])

  const fetchBookings = useCallback(async () => {
    if (!user) { setBookings([]); return }
    const res = await authFetch('/api/bookings')
    if (res.ok) setBookings(await res.json() as Booking[])
  }, [user, authFetch])

  const fetchWaitlist = useCallback(async () => {
    if (!user) { setWaitlist([]); return }
    const res = await authFetch('/api/waitlist')
    if (res.ok) setWaitlist(await res.json() as WaitlistEntry[])
  }, [user, authFetch])

  useEffect(() => {
    Promise.all([fetchClasses(), fetchBookings(), fetchWaitlist()])
      .finally(() => setLoading(false))
  }, [fetchClasses, fetchBookings, fetchWaitlist])

  // Re-fetch user data when they log in/out
  useEffect(() => { fetchBookings(); fetchWaitlist() }, [user, fetchBookings, fetchWaitlist])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 4000) }

  function handleBookClick(classItem: YogaClass) {
    if (!user) { setShowLoginPrompt(true); return }
    setSelectedClass(classItem)
  }

  function handleWaitlistClick(classItem: YogaClass) {
    if (!user) { setShowLoginPrompt(true); return }
    setWaitlistClass(classItem)
  }

  async function handleBook(classItem: YogaClass, formData: BookingFormData) {
    const res = await authFetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: classItem.id, ...formData }),
    })
    if (!res.ok) {
      const { error } = await res.json() as { error: string }
      showToast(`Error: ${error}`); return
    }
    await Promise.all([fetchClasses(), fetchBookings()])
    setSelectedClass(null)
    showToast(`Booked! See you at "${classItem.title}" 🐾`)
  }

  async function handleCancel(classId: number) {
    await authFetch(`/api/bookings/${classId}`, { method: 'DELETE' })
    await Promise.all([fetchClasses(), fetchBookings()])
    showToast('Booking cancelled.')
  }

  async function handleWaitlist(classItem: YogaClass, email: string) {
    const res = await authFetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: classItem.id, email }),
    })
    if (!res.ok) { showToast('You are already on the waitlist.'); setWaitlistClass(null); return }
    await fetchWaitlist()
    setWaitlistClass(null)
    showToast(`Added to waitlist for "${classItem.title}" 🐾`)
  }

  const filtered = classes.filter(c => {
    if (filterLevel !== 'All' && c.level !== filterLevel) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!c.title.toLowerCase().includes(q) && !c.instructor.toLowerCase().includes(q) &&
          !c.dogs.some(d => d.toLowerCase().includes(q))) return false
    }
    if (dateFrom && c.date < dateFrom) return false
    if (dateTo && c.date > dateTo) return false
    return true
  })

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-emoji">🐾</div>
          <p>Loading classes…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Header bookingCount={bookings.length} view={view} onViewChange={setView} />
      {toast && <div className="toast">{toast}</div>}

      {view === 'admin' && user?.isAdmin ? (
        <AdminPanel />
      ) : view === 'my-bookings' && user ? (
        <MyBookings
          bookings={bookings}
          classes={classes}
          onCancel={handleCancel}
          onBrowse={() => setView('classes')}
        />
      ) : (
        <main className="main">
          <section className="hero">
            <div className="hero-emoji">🐕‍🦺</div>
            <h2>Puppy Yoga Classes</h2>
            <p>Stretch, breathe, and play with adorable puppies. Spaces are limited!</p>
          </section>

          <SearchBar
            search={search} dateFrom={dateFrom} dateTo={dateTo}
            onSearchChange={setSearch} onDateFromChange={setDateFrom} onDateToChange={setDateTo}
          />

          <div className="filters">
            <span className="filter-label">Level:</span>
            {LEVELS.map(level => (
              <button key={level} className={`filter-btn ${filterLevel === level ? 'active' : ''}`}
                onClick={() => setFilterLevel(level)}>
                {level}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-emoji">🔍</div>
              <p>No classes match your search.</p>
              <button className="btn-book" onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setFilterLevel('All') }}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid">
              {filtered.map(classItem => (
                <ClassCard
                  key={classItem.id}
                  classItem={classItem}
                  isBooked={bookings.some(b => b.classId === classItem.id)}
                  onWaitlist={waitlist.some(w => w.classId === classItem.id)}
                  onBook={() => handleBookClick(classItem)}
                  onJoinWaitlist={() => handleWaitlistClick(classItem)}
                />
              ))}
            </div>
          )}
        </main>
      )}

      {selectedClass && (
        <BookingModal
          classItem={selectedClass}
          onConfirm={formData => handleBook(selectedClass, formData)}
          onClose={() => setSelectedClass(null)}
        />
      )}
      {waitlistClass && (
        <WaitlistModal
          classItem={waitlistClass}
          onConfirm={email => handleWaitlist(waitlistClass, email)}
          onClose={() => setWaitlistClass(null)}
        />
      )}
      {showLoginPrompt && (
        <AuthModal onClose={() => setShowLoginPrompt(false)} initialMode="login" />
      )}
    </div>
  )
}
