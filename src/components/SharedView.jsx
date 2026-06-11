import DreamBoard from './DreamBoard'
import Bookshelf from './Bookshelf'

// The shared zone. Dream List (cork board) and Bookshelf sit side by side; the
// remaining sections are visible placeholders for now.

const PLACEHOLDERS = [
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'contentEngine', label: 'Content Engine' },
  { key: 'businessGoals', label: 'Business Goals' },
  { key: 'launchpad', label: 'Launchpad' },
  { key: 'syncSpace', label: 'Sync Space' },
  { key: 'parkingLot', label: 'Parking Lot' },
  { key: 'winsWall', label: 'Wins Wall' },
]

export default function SharedView({ data, setData }) {
  return (
    <div>
      <div className="view-heading">
        <h1>Shared</h1>
        <span className="sub">our common space</span>
      </div>

      <div className="shared-split">
        <div className="split-col">
          <DreamBoard data={data} setData={setData} />
        </div>
        <div className="split-col">
          <Bookshelf data={data} setData={setData} />
        </div>
      </div>

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
