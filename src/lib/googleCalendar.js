// Google Calendar integration via Google Identity Services (GIS). Because this
// app has no backend, we authorize and call the Calendar API directly from the
// browser using short-lived access tokens. The "Today" section is the only
// place that uses this, so it stays cleanly separable from the rest.

const GIS_SRC = 'https://accounts.google.com/gsi/client'
let gisPromise = null

// Load the Google Identity Services script once, on demand.
export function loadGis() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('no window'))
  }
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (gisPromise) return gisPromise
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = GIS_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(s)
  })
  return gisPromise
}

// calendar.events covers reading + creating events; email lets us label which
// account is connected.
export const CALENDAR_SCOPE =
  'https://www.googleapis.com/auth/calendar.events email'

export async function fetchUserEmail(token) {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.email || null
  } catch {
    return null
  }
}

function dayBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
  return { start, end }
}

// Pull together a join link from the various places Google can stash one.
function joinLinkFor(ev) {
  if (ev.hangoutLink) return ev.hangoutLink
  const entry = ev.conferenceData?.entryPoints?.find(
    (e) => e.entryPointType === 'video',
  )
  if (entry?.uri) return entry.uri
  if (ev.location && /^https?:\/\//i.test(ev.location)) return ev.location
  return null
}

function normalizeEvent(ev) {
  return {
    id: ev.id,
    summary: ev.summary || '(no title)',
    start: ev.start?.dateTime || ev.start?.date || null,
    allDay: !ev.start?.dateTime,
    joinUrl: joinLinkFor(ev),
    htmlLink: ev.htmlLink || null,
  }
}

export async function listTodayEvents(token) {
  const { start, end } = dayBounds()
  const params = new URLSearchParams({
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '25',
  })
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!res.ok) {
    const err = new Error('calendar_fetch_failed')
    err.status = res.status
    throw err
  }
  const data = await res.json()
  return (data.items || []).map(normalizeEvent)
}

// Create a single-hour event today (or all-purpose default at 9am if no time).
export async function createTodayEvent(token, { summary, time }) {
  const now = new Date()
  let start
  if (time) {
    const [h, m] = time.split(':').map(Number)
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0)
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0)
  }
  const end = new Date(start.getTime() + 60 * 60 * 1000)

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      }),
    },
  )
  if (!res.ok) throw new Error('calendar_create_failed')
  return normalizeEvent(await res.json())
}
