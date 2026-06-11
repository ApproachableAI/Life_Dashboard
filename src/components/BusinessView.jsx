// The Business zone — Approachable Intelligence work lives here. Sections are
// placeholders for now; each will be built out the same way as the shared ones.

const SECTIONS = [
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'contentEngine', label: 'Content Engine' },
  { key: 'businessGoals', label: 'Business Goals' },
  { key: 'launchpad', label: 'Launchpad' },
  { key: 'syncSpace', label: 'Sync Space' },
  { key: 'parkingLot', label: 'Parking Lot' },
]

export default function BusinessView({ data }) {
  const shared = data.shared ?? {}
  return (
    <div>
      <div className="view-heading">
        <h1>Business</h1>
        <span className="sub">Approachable Intelligence</span>
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
