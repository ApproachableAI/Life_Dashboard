// The shape of the dashboard JSON blob and helpers to build / normalize it.

export const DEFAULT_LANES = [
  { id: 'ai', label: 'AI', color: '#217C82' },
  { id: 'realty', label: 'Realty', color: '#FFA589' },
  { id: 'personal', label: 'Personal', color: '#3451A3' },
]

// Empty placeholders for the shared sections we'll build in later sessions.
function emptyShared() {
  return {
    pipeline: [],
    contentEngine: [],
    businessGoals: [],
    launchpad: [],
    syncSpace: [],
    parkingLot: [],
    winsWall: [],
    bookshelf: [],
    dreamList: [],
  }
}

export function defaultData() {
  return {
    settings: {
      lanes: DEFAULT_LANES.map((l) => ({ ...l })),
    },
    shared: emptyShared(),
    jordyn: { weeks: {}, reflection: {} },
    ty: { weeks: {}, reflection: {} },
  }
}

// A single week's record, keyed in person.weeks by its Monday ISO date.
export function emptyWeek() {
  return {
    tasks: [], // { id, text, done, lane }   lane = lane id or null
    focus: '', // the single most important thing this week
    today: [], // { id, time, text }  (manual for now; Google Calendar later)
    reflection: '', // short daily reflection / notes
  }
}

// Fill in any missing top-level keys so older / partial blobs keep working as
// we add sections. This is the whole point of the single-JSON design: new keys,
// never migrations.
export function withDefaults(d) {
  const base = defaultData()
  if (!d || typeof d !== 'object') return base
  return {
    settings: {
      ...base.settings,
      ...(d.settings || {}),
      lanes:
        Array.isArray(d.settings?.lanes) && d.settings.lanes.length
          ? d.settings.lanes
          : base.settings.lanes,
    },
    shared: { ...base.shared, ...(d.shared || {}) },
    jordyn: { ...base.jordyn, ...(d.jordyn || {}) },
    ty: { ...base.ty, ...(d.ty || {}) },
  }
}
