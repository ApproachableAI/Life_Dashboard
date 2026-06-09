import { useState } from 'react'
import { supabase } from '../lib/supabase'

// One shared email magic-link login that both Jordyn and Ty use.
export default function Auth() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setError(error.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="center-screen">
      <div className="auth-card">
        <div className="heart">🏡</div>
        <h1>Our Life Dashboard</h1>
        <p>Jordyn &amp; Ty — one login, one shared home base.</p>

        {status === 'sent' ? (
          <div className="sent-note">
            ✉️ Check your inbox at <strong>{email}</strong> and tap the magic
            link to sign in.
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              className="primary-btn"
              type="submit"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'Sending…' : 'Send magic link'}
            </button>
            {status === 'error' && <div className="error-note">{error}</div>}
          </form>
        )}
      </div>
    </div>
  )
}
