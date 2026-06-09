// Week math. Weeks start on Monday and are keyed by their Monday's local ISO
// date (e.g. "2026-06-08"). Everything here works in local time so the week a
// person sees matches the calendar on their wall.

import { emptyWeek } from './data'
import { uid } from './uid'

// Strip the time component to a clean local date.
function atMidnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function startOfWeek(date) {
  const d = atMidnight(date)
  const day = d.getDay() // 0 = Sunday … 6 = Saturday
  const sinceMonday = (day + 6) % 7
  d.setDate(d.getDate() - sinceMonday)
  return d
}

export function formatKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function weekKey(date) {
  return formatKey(startOfWeek(date))
}

export function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addWeeks(key, n) {
  const d = keyToDate(key)
  d.setDate(d.getDate() + n * 7)
  return formatKey(d)
}

export function weekRange(key) {
  const start = keyToDate(key)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return { start, end }
}

// "YYYY-MM" for the active week's Monday, used to seed the month jump control.
export function monthValue(key) {
  return key.slice(0, 7)
}

// Jump to the week containing the 1st of the given "YYYY-MM".
export function weekKeyForMonth(monthStr) {
  const [y, m] = monthStr.split('-').map(Number)
  return weekKey(new Date(y, m - 1, 1))
}

// The most recent existing week strictly before `key`. ISO date strings sort
// lexicographically, so plain string comparison is correct here.
export function mostRecentPriorWeek(weeks, key) {
  const keys = Object.keys(weeks).filter((k) => k < key)
  keys.sort()
  return keys.length ? keys[keys.length - 1] : null
}

// Ensure a week record exists, applying carry-forward exactly once.
//
// Rules:
//   * If the week already has a record, do nothing (so carry-forward never
//     runs twice for the same week — no duplicates).
//   * If we're opening the current or a future week with no record yet, create
//     it and carry over every still-unchecked task from the most recent prior
//     week. Checked-off tasks stay behind in their own week's history.
//   * Opening an empty *past* week does NOT auto-create or carry anything; past
//     weeks become real records only when edited (see ensureWeekForEdit).
//
// Returns the same `data` reference when nothing changed, so callers can pass
// the result straight to setData without causing a render loop.
export function ensureWeek(data, person, key, currentKey) {
  const weeks = data[person].weeks
  if (weeks[key]) return data
  if (key < currentKey) return data // browsing history backward; leave it alone

  const week = emptyWeek()
  const priorKey = mostRecentPriorWeek(weeks, key)
  if (priorKey) {
    const prior = weeks[priorKey]
    week.tasks = (prior.tasks || [])
      .filter((t) => !t.done)
      // Fresh ids: the carried copy is independent of its origin, so checking
      // it off here never touches the historical original.
      .map((t) => ({ ...t, id: uid() }))
  }
  week.carriedForward = true

  return {
    ...data,
    [person]: {
      ...data[person],
      weeks: { ...weeks, [key]: week },
    },
  }
}
