import { useEffect, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { defaultData, withDefaults } from './lib/data'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import ConfigNeeded from './components/ConfigNeeded'

export default function App() {
  // Friendly setup screen instead of a crash when env vars aren't set yet.
  if (!isSupabaseConfigured) return <ConfigNeeded />
  return <AuthedApp />
}

function AuthedApp() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [data, setData] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  // Snapshot of what's currently persisted, so we only write real changes (and
  // never skip the carry-forward that runs right after load).
  const lastSaved = useRef(null)

  // --- Auth session wiring ---------------------------------------------------
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // --- Load (or create) this account's single dashboard row ------------------
  useEffect(() => {
    if (!session) {
      setData(null)
      setLoaded(false)
      lastSaved.current = null
      return
    }
    let cancelled = false
    ;(async () => {
      const { data: row, error } = await supabase
        .from('dashboards')
        .select('data')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        console.error('Failed to load dashboard:', error)
      }

      if (row && row.data && Object.keys(row.data).length) {
        const loadedData = withDefaults(row.data)
        setData(loadedData)
        lastSaved.current = JSON.stringify(loadedData)
      } else {
        // First time in: seed the default blob and persist it.
        const seeded = defaultData()
        setData(seeded)
        lastSaved.current = JSON.stringify(seeded)
        await supabase.from('dashboards').upsert(
          {
            user_id: session.user.id,
            data: seeded,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
      }
      setLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [session?.user?.id])

  // --- Debounced auto-save ---------------------------------------------------
  useEffect(() => {
    if (!loaded || !data || !session) return
    const snapshot = JSON.stringify(data)
    if (snapshot === lastSaved.current) return // nothing actually changed
    setSaving(true)
    const handle = setTimeout(async () => {
      const { error } = await supabase.from('dashboards').upsert(
        {
          user_id: session.user.id,
          data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      if (error) console.error('Auto-save failed:', error)
      else lastSaved.current = snapshot
      setSaving(false)
    }, 800)
    return () => clearTimeout(handle)
  }, [data, loaded])

  async function signOut() {
    await supabase.auth.signOut()
  }

  if (!authReady) return <LoadingScreen />
  if (!session) return <Auth />
  if (!loaded || !data) return <LoadingScreen />

  return (
    <Dashboard
      data={data}
      setData={setData}
      saving={saving}
      userEmail={session.user.email}
      onSignOut={signOut}
    />
  )
}

function LoadingScreen() {
  return (
    <div className="center-screen">
      <div className="auth-card">
        <div className="heart">☀️</div>
        <p>Warming up your dashboard…</p>
      </div>
    </div>
  )
}
