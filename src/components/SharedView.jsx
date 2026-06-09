import DreamBoard from './DreamBoard'

// The shared zone. Dream List is a live cork board shown inline. The remaining
// sections are visible placeholders for now — each will get built out the same
// way in later sessions.

const PLACEHOLDERS = [
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'contentEngine', label: 'Content Engine' },
  { key: 'businessGoals', label: 'Business Goals' },
  { key: 'launchpad', label: 'Launchpad' },
  { key: 'syncSpace', label: 'Sync Space' },
  { key: 'parkingLot', label: 'Parking Lot' },
  { key: 'winsWall', label: 'Wins Wall' },
  { key: 'bookshelf', label: 'Bookshelf' },
]

export default function SharedView({ data, setData }) {
  return (
    <div>
      <div className="view-heading">
        <h1>Shared</h1>
        <span className="sub">our common space</span>
      </div>

      <DreamBoard data={data} setData={setData} />

      <div className="placeholder-grid" style={{ marginTop: 22 }}>
        {PLACEHOLDERS.map((s) => (
          <div className="placeholder-card" key={s.key}>
            <h3>{s.label}</h3>
            <span>Coming soon</span>
          </div>
        ))}
      </div>
    </div>
  )
}
