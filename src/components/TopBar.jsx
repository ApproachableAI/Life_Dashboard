import { useEffect, useState } from 'react'

const PEOPLE = [
  { id: 'jordyn', label: 'Jordyn' },
  { id: 'ty', label: 'Ty' },
  { id: 'shared', label: 'Shared' },
]

export default function TopBar({
  view,
  setView,
  saving,
  userEmail,
  onOpenSettings,
  onSignOut,
}) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Clock />

        <div className="topbar-spacer" />

        <nav className="switcher" aria-label="Switch view">
          {PEOPLE.map((p) => (
            <button
              key={p.id}
              data-person={p.id}
              className={view === p.id ? 'active' : ''}
              aria-pressed={view === p.id}
              onClick={() => setView(p.id)}
            >
              {p.label}
            </button>
          ))}
        </nav>

        <span className="save-pill" title={saving ? 'Saving…' : 'All changes saved'}>
          <span className={`save-dot ${saving ? 'busy' : ''}`} />
          {saving ? 'Saving' : 'Saved'}
        </span>

        <button className="icon-btn" onClick={onOpenSettings} title="Lane settings">
          ⚙︎ Lanes
        </button>

        <button className="icon-btn" onClick={onSignOut} title={userEmail}>
          Sign out
        </button>
      </div>
    </header>
  )
}

// Live date + time, updating every second as real time passes.
function Clock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
  const date = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="clock" aria-live="off">
      <span className="clock-time">{time}</span>
      <span className="clock-date">{date}</span>
    </div>
  )
}
