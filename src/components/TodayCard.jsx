import { useEffect, useState } from 'react'
import { useGoogleCalendar, googleConfigured } from '../hooks/useGoogleCalendar'
import { listTodayEvents, createTodayEvent } from '../lib/googleCalendar'

// The "Today" card. When the person has connected Google Calendar (and we're
// viewing the current week, since "today" only means today), it shows live
// calendar events with add + join. Otherwise it falls back to the simple
// manual list, so the app works fully even before Google is set up.
export default function TodayCard({
  person,
  isCurrent,
  manualItems,
  onAddManual,
  onUpdateManual,
  onDeleteManual,
}) {
  const gcal = useGoogleCalendar(person)
  const showGoogle = googleConfigured && gcal.connected && isCurrent

  return (
    <div className="card">
      <div className="today-head">
        <div className="card-title">Today</div>
        {googleConfigured && isCurrent && (
          gcal.connected ? (
            <button className="link-btn" onClick={gcal.disconnect}>
              Disconnect{gcal.email ? ` · ${gcal.email}` : ''}
            </button>
          ) : (
            <button className="add-btn subtle" onClick={gcal.connect}>
              Connect Google Calendar
            </button>
          )
        )}
      </div>

      {showGoogle ? (
        <GoogleToday gcal={gcal} />
      ) : (
        <ManualToday
          items={manualItems}
          onAdd={onAddManual}
          onUpdate={onUpdateManual}
          onDelete={onDeleteManual}
        />
      )}

      {gcal.error && <div className="gcal-error">{gcal.error}</div>}

      {!googleConfigured && (
        <div className="today-note">
          Manual for now — add a Google Client ID (VITE_GOOGLE_CLIENT_ID) to
          turn on Google Calendar.
        </div>
      )}
      {googleConfigured && !gcal.connected && isCurrent && (
        <div className="today-note">
          Connect to see today's events, add events, and join meetings.
        </div>
      )}
    </div>
  )
}

// --- Live Google Calendar view ----------------------------------------------
function GoogleToday({ gcal }) {
  const [events, setEvents] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [text, setText] = useState('')
  const [time, setTime] = useState('')

  async function refresh() {
    setLoading(true)
    setErr(null)
    try {
      const token = await gcal.getToken()
      setEvents(await listTodayEvents(token))
    } catch {
      setErr("Couldn't load today's events. Try reconnecting.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function add(e) {
    e.preventDefault()
    if (!text.trim()) return
    try {
      const token = await gcal.getToken()
      await createTodayEvent(token, { summary: text.trim(), time })
      setText('')
      setTime('')
      refresh()
    } catch {
      setErr("Couldn't add the event.")
    }
  }

  return (
    <div>
      {loading && <div className="empty-hint">Loading today's events…</div>}

      {!loading && events && events.length === 0 && (
        <div className="empty-hint">Nothing on your calendar today. 🎉</div>
      )}

      {!loading &&
        events &&
        events.map((ev) => (
          <div className="gcal-event" key={ev.id}>
            <span className="gcal-time">{formatEventTime(ev)}</span>
            <span className="gcal-summary">{ev.summary}</span>
            {ev.joinUrl && (
              <a
                className="join-btn"
                href={ev.joinUrl}
                target="_blank"
                rel="noreferrer"
              >
                Join
              </a>
            )}
          </div>
        ))}

      <form className="today-row" onSubmit={add} style={{ marginTop: 10 }}>
        <input
          className="time-input"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <input
          className="text-input"
          value={text}
          placeholder="Add to Google Calendar…"
          onChange={(e) => setText(e.target.value)}
        />
        <button className="add-btn" type="submit">
          Add
        </button>
      </form>
      {err && <div className="gcal-error">{err}</div>}
    </div>
  )
}

function formatEventTime(ev) {
  if (ev.allDay || !ev.start) return 'All day'
  const d = new Date(ev.start)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

// --- Manual fallback list ----------------------------------------------------
function ManualToday({ items, onAdd, onUpdate, onDelete }) {
  return (
    <div>
      {(items || []).length === 0 && (
        <div className="empty-hint">Nothing on the calendar yet.</div>
      )}
      {(items || []).map((item) => (
        <div className="today-row" key={item.id}>
          <input
            className="time-input"
            type="time"
            value={item.time || ''}
            onChange={(e) => onUpdate(item.id, { time: e.target.value })}
          />
          <input
            className="text-input"
            value={item.text || ''}
            placeholder="Event…"
            onChange={(e) => onUpdate(item.id, { text: e.target.value })}
          />
          <button
            className="del-btn"
            onClick={() => onDelete(item.id)}
            aria-label="Remove event"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        className="add-btn subtle"
        onClick={onAdd}
        style={{ marginTop: 8 }}
      >
        + Add event
      </button>
    </div>
  )
}
