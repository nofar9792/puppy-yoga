import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.tsx'
import type { UserProfile as UserProfileType } from '../types.ts'

interface Props {
  onBack: () => void
}

export default function UserProfile({ onBack }: Props) {
  const { authFetch } = useAuth()
  const [profile, setProfile] = useState<UserProfileType | null>(null)
  const [form, setForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' })
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    authFetch('/api/users/me').then(r => r.json()).then((p: UserProfileType) => {
      setProfile(p)
      setForm(f => ({ ...f, name: p.name, email: p.email }))
    })
  }, [authFetch])

  function showMsg(msg: string, isError = false) {
    if (isError) setError(msg)
    else setToast(msg)
    setTimeout(() => { setToast(''); setError('') }, 3000)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      showMsg('New passwords do not match', true); return
    }
    if (form.newPassword && form.newPassword.length < 6) {
      showMsg('Password must be at least 6 characters', true); return
    }
    setSaving(true)
    const body: Record<string, string> = {}
    if (form.name !== profile?.name) body.name = form.name
    if (form.email !== profile?.email) body.email = form.email
    if (form.newPassword) { body.currentPassword = form.currentPassword; body.newPassword = form.newPassword }

    const res = await authFetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (!res.ok) {
      const { error } = await res.json() as { error: string }
      showMsg(error, true); return
    }
    setProfile(p => p ? { ...p, name: form.name, email: form.email } : p)
    setForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }))
    showMsg('Profile updated!')
  }

  if (!profile) {
    return (
      <main className="main">
        <div className="loading-screen"><div className="loading-emoji">🐾</div><p>Loading…</p></div>
      </main>
    )
  }

  return (
    <main className="main">
      <section className="hero" style={{ paddingBottom: '1rem' }}>
        <h2>My Profile</h2>
        <p>Manage your account details</p>
      </section>

      {toast && <div className="toast">{toast}</div>}
      {error && <div className="toast toast-error">{error}</div>}

      <div className="profile-wrap">
        <div className="profile-avatar">{profile.name.charAt(0).toUpperCase()}</div>
        <p className="profile-since">Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        {profile.isAdmin && <span className="admin-badge-inline">Admin</span>}

        <form className="profile-form" onSubmit={handleSave}>
          <div className="form-group">
            <label>Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>

          <h4 className="profile-section-title">Change Password</h4>
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} placeholder="Leave blank to keep current" />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Min 6 characters" />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat new password" />
          </div>

          <div className="profile-footer">
            <button type="button" className="btn-cancel" onClick={onBack}>Back</button>
            <button type="submit" className="btn-confirm" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
