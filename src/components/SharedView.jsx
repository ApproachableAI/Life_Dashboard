// Placeholder for the shared zone. These sections are intentionally empty for
// now — we'll build them in later sessions. The data already lives under
// data.shared so wiring them up later is just rendering, no schema work.

const SECTIONS = [
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'contentEngine', label: 'Content Engine' },
  { key: 'businessGoals', label: 'Business Goals' },
  { key: 'launchpad', label: 'Launchpad' },
  { key: 'syncSpace', label: 'Sync Space' },
  { key: 'parkingLot', label: 'Parking Lot' },
  { key: 'winsWall', label: 'Wins Wall' },
  { key: 'bookshelf', label: 'Bookshelf' },
  { key: 'dreamList', label: 'Dream List' },
]

export default function SharedView({ data }) {
  const shared = data.shared ?? {}
  return (
    <div>
      <div className="view-heading">
        <h1>Shared</h1>
        <span className="sub">our common space</span>
      </div>

      <div className="placeholder-grid">
        {SECTIONS.map((s) => {
          const count = Array.isArray(shared[s.key]) ? shared[s.key].length : 0
          return (
            <div className="placeholder-card" key={s.key}>
              <h3>{s.label}</h3>
              <span>{count === 0 ? 'Coming soon' : `${count} items`}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
