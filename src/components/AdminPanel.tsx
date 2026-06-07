import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext.tsx'
import type { YogaClass, AdminStats } from '../types.ts'

type AdminTab = 'classes' | 'bookings' | 'waitlist' | 'dashboard'

interface AdminBooking {
  classId: number; classTitle: string; classDate: string; classTime: string
  name: string; email: string; phone: string; bookedAt: string
}

interface AdminWaitlist { classId: number; classTitle: string; email: string }

const EMPTY_FORM = {
  title: '', instructor: '', date: '', time: '', duration: '60 min',
  totalSpots: 10, level: 'All Levels' as YogaClass['level'],
  dogs: '', price: 35, emoji: '🐕', recurrenceWeeks: 1,
}

export default function AdminPanel() {
  const { authFetch } = useAuth()
  const [tab, setTab] = useState<AdminTab>('classes')
  const [classes, setClasses] = useState<YogaClass[]>([])
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [waitlist, setWaitlist] = useState<AdminWaitlist[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [editingClass, setEditingClass] = useState<YogaClass | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [toast, setToast] = useState('')

  function showMsg(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchClasses = useCallback(async () => {
    const res = await fetch('/api/classes')
    setClasses(await res.json() as YogaClass[])
  }, [])

  const fetchBookings = useCallback(async () => {
    const res = await authFetch('/api/admin/bookings')
    setBookings(await res.json() as AdminBooking[])
  }, [authFetch])

  const fetchWaitlist = useCallback(async () => {
    const res = await authFetch('/api/admin/waitlist')
    setWaitlist(await res.json() as AdminWaitlist[])
  }, [authFetch])

  const fetchStats = useCallback(async () => {
    const res = await authFetch('/api/admin/stats')
    if (res.ok) setStats(await res.json() as AdminStats)
  }, [authFetch])

  useEffect(() => { fetchClasses() }, [fetchClasses])
  useEffect(() => { if (tab === 'bookings') fetchBookings() }, [tab, fetchBookings])
  useEffect(() => { if (tab === 'waitlist') fetchWaitlist() }, [tab, fetchWaitlist])
  useEffect(() => { if (tab === 'dashboard') fetchStats() }, [tab, fetchStats])

  function openAdd() {
    setEditingClass(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(c: YogaClass) {
    setEditingClass(c)
    setForm({
      title: c.title, instructor: c.instructor, date: c.date, time: c.time,
      duration: c.duration, totalSpots: c.totalSpots, level: c.level,
      dogs: c.dogs.join(', '), price: c.price, emoji: c.emoji, recurrenceWeeks: 1,
    })
    setShowForm(true)
  }

  async function saveClass() {
    const body = {
      ...form,
      dogs: form.dogs.split(',').map(d => d.trim()).filter(Boolean),
      recurrenceWeeks: editingClass ? undefined : form.recurrenceWeeks,
    }
    if (editingClass) {
      await authFetch(`/api/admin/classes/${editingClass.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      showMsg('Class updated!')
    } else {
      await authFetch('/api/admin/classes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      showMsg(form.recurrenceWeeks > 1 ? `${form.recurrenceWeeks} weekly classes added!` : 'Class added!')
    }
    setShowForm(false)
    fetchClasses()
  }

  async function deleteClass(id: number, title: string) {
    if (!window.confirm(`Delete "${title}" and all its bookings?`)) return
    await authFetch(`/api/admin/classes/${id}`, { method: 'DELETE' })
    showMsg('Class deleted.')
    fetchClasses()
  }

  return (
    <main className="main">
      <section className="hero" style={{ paddingBottom: '1rem' }}>
        <h2>Admin Panel</h2>
        <p>Manage classes, bookings, and waitlist</p>
      </section>

      {toast && <div className="success-banner">{toast}</div>}

      <div className="admin-tabs">
        {(['classes', 'bookings', 'waitlist', 'dashboard'] as AdminTab[]).map(t => (
          <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'classes' && (
        <div className="admin-section">
          <div className="admin-header">
            <h3>{classes.length} classes</h3>
            <button className="btn-book" onClick={openAdd}>+ Add Class</button>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Class</th><th>Date</th><th>Spots</th><th>Price</th><th>Level</th><th></th></tr>
              </thead>
              <tbody>
                {classes.map(c => (
                  <tr key={c.id}>
                    <td><span className="admin-emoji">{c.emoji}</span>{c.title}</td>
                    <td>{new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {c.time}</td>
                    <td>{c.spots}/{c.totalSpots}</td>
                    <td>${c.price}</td>
                    <td><span className="admin-level">{c.level}</span></td>
                    <td className="admin-actions">
                      <button className="admin-btn-edit" onClick={() => openEdit(c)}>Edit</button>
                      <button className="admin-btn-del" onClick={() => deleteClass(c.id, c.title)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="admin-section">
          <h3>{bookings.length} total bookings</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Class</th><th>Date</th><th>Name</th><th>Email</th><th>Booked</th></tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <tr key={i}>
                    <td>{b.classTitle}</td>
                    <td>{new Date(b.classDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {b.classTime}</td>
                    <td>{b.name}</td>
                    <td>{b.email}</td>
                    <td>{new Date(b.bookedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'waitlist' && (
        <div className="admin-section">
          <h3>{waitlist.length} waitlist entries</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Class</th><th>Email</th></tr></thead>
              <tbody>
                {waitlist.map((w, i) => (
                  <tr key={i}><td>{w.classTitle}</td><td>{w.email}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'dashboard' && (
        <div className="admin-section">
          <h3>Dashboard</h3>
          {stats ? (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.totalBookings}</div>
                <div className="stat-label">Total Bookings</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">${stats.totalRevenue.toLocaleString()}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.totalClasses}</div>
                <div className="stat-label">Total Classes</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.upcomingClasses}</div>
                <div className="stat-label">Upcoming Classes</div>
              </div>
              <div className="stat-card stat-card-wide">
                <div className="stat-value">{stats.occupancyRate}%</div>
                <div className="stat-label">Overall Occupancy Rate</div>
              </div>
              {stats.mostPopularClass && (
                <div className="stat-card stat-card-wide">
                  <div className="stat-value">🏆 {stats.mostPopularClass}</div>
                  <div className="stat-label">Most Popular Class · {stats.popularClassBookings} bookings</div>
                </div>
              )}
            </div>
          ) : (
            <p>Loading stats…</p>
          )}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="modal modal-wide">
            <div className="modal-header">
              <h3>{editingClass ? 'Edit Class' : 'Add New Class'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-form class-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Morning Paws Flow" />
                </div>
                <div className="form-group">
                  <label>Emoji</label>
                  <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="🐕" style={{ width: 80 }} />
                </div>
              </div>
              <div className="form-group">
                <label>Instructor</label>
                <input value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} placeholder="Sarah & the Golden Trio" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} placeholder="9:00 AM" />
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="60 min" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Level</label>
                  <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as YogaClass['level'] }))}>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>All Levels</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Total Spots</label>
                  <input type="number" value={form.totalSpots} onChange={e => setForm(f => ({ ...f, totalSpots: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label>Price ($)</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Dogs (comma-separated)</label>
                <input value={form.dogs} onChange={e => setForm(f => ({ ...f, dogs: e.target.value }))} placeholder="Golden Retriever, Labrador" />
              </div>
              {!editingClass && (
                <div className="form-group">
                  <label>Repeat weekly for (weeks)</label>
                  <input
                    type="number" min={1} max={52} value={form.recurrenceWeeks}
                    onChange={e => setForm(f => ({ ...f, recurrenceWeeks: Number(e.target.value) }))}
                  />
                  {form.recurrenceWeeks > 1 && (
                    <small>Will create {form.recurrenceWeeks} classes, one per week starting from the chosen date.</small>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-confirm" onClick={saveClass}>
                {editingClass ? 'Save Changes' : 'Add Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
