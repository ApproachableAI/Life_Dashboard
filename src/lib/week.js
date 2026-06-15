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

// Carry forward still-unchecked tasks into the current (or a future) week.
//
// Rules:
//   * Only ever touches the current or future weeks. Past weeks are read/edit
//     only and never auto-modified.
//   * Pulls in every still-unchecked task from the most recent prior week that
//     hasn't already been carried here. Checked-off tasks never carry and stay
//     in their own week's history (the original copy is left untouched).
//   * Idempotent: each carried task's origin id is remembered in the week's
//     `carriedIds`, so we never duplicate, and a carried task you delete is
//     never resurrected. A text check also guards older records that predate
//     `carriedIds`. Because it re-checks on every open, a task left unchecked
//     in the prior week reliably follows you forward even if this week's record
//     was created early.
//
// Returns the same `data` reference when nothing changed, so callers can pass
// the result straight to setData without causing a render loop.
export function ensureWeek(data, person, key, currentKey) {
  if (key < currentKey) return data // past weeks: never auto-carry

  const weeks = data[person].weeks
  const existing = weeks[key]

  const priorKey = mostRecentPriorWeek(weeks, key)
  const prior = priorKey ? weeks[priorKey] : null
  const priorUnchecked = (prior?.tasks || []).filter((t) => !t.done)

  const carried = new Set(existing?.carriedIds || [])
  const presentText = new Set(
    (existing?.tasks || []).map((t) => (t.text || '').trim().toLowerCase()),
  )

  const toCarry = priorUnchecked.filter((t) => {
    if (carried.has(t.id)) return false // already carried (or carried then deleted)
    const text = (t.text || '').trim().toLowerCase()
    if (text && presentText.has(text)) return false // safety dedupe by text
    return true
  })

  if (toCarry.length === 0) return data

  const base = existing || emptyWeek()
  // Fresh ids so checking/deleting a carried copy never touches the original.
  const newTasks = toCarry.map((t) => ({ ...t, id: uid(), from: t.id }))
  toCarry.forEach((t) => carried.add(t.id))

  return {
    ...data,
    [person]: {
      ...data[person],
      weeks: {
        ...weeks,
        [key]: {
          ...base,
          tasks: [...(base.tasks || []), ...newTasks],
          carriedForward: true,
          carriedIds: Array.from(carried),
        },
      },
    },
  }
}

