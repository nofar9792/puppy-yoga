import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.tsx'

interface AuthModalProps {
  onClose: () => void
  initialMode?: 'login' | 'signup'
}

export default function AuthModal({ onClose, initialMode = 'login' }: AuthModalProps) {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match'); return
    }
    setLoading(true)
    try {
      if (mode === 'login') await login(email, password)
      else await signup(name, email, password)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-header">
          <h3>🐾 {mode === 'login' ? 'Welcome back!' : 'Create account'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" placeholder="Jane Smith" value={name}
                onChange={e => setName(e.target.value)} required />
            </div>
          )}
          <div className="form-group">
            <label>Email *</label>
            <input type="email" placeholder="jane@example.com" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password *</label>
            <input type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} required />
          </div>
          {mode === 'signup' && (
            <div className="form-group">
              <label>Confirm Password *</label>
              <input type="password" placeholder="••••••••" value={confirm}
                onChange={e => setConfirm(e.target.value)} required />
            </div>
          )}
          {error && <div className="form-error">{error}</div>}
        </form>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-confirm" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Loading…' : mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </div>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>No account? <button onClick={() => { setMode('signup'); setError('') }}>Sign up</button></>
          ) : (
            <>Already have one? <button onClick={() => { setMode('login'); setError('') }}>Log in</button></>
          )}
        </div>
      </div>
    </div>
  )
}
