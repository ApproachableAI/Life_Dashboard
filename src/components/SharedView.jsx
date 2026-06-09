import { useState } from 'react'
import DreamBoard from './DreamBoard'

// The shared zone. Most sections are still placeholders; Dream List is now a
// real interactive cork board. As we build the others, give them a `component`
// and they'll open the same way.

const SECTIONS = [
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'contentEngine', label: 'Content Engine' },
  { key: 'businessGoals', label: 'Business Goals' },
  { key: 'launchpad', label: 'Launchpad' },
  { key: 'syncSpace', label: 'Sync Space' },
  { key: 'parkingLot', label: 'Parking Lot' },
  { key: 'winsWall', label: 'Wins Wall' },
  { key: 'bookshelf', label: 'Bookshelf' },
  { key: 'dreamList', label: 'Dream List', ready: true },
]

export default function SharedView({ data, setData }) {
  const [open, setOpen] = useState(null)
  const shared = data.shared ?? {}

  if (open === 'dreamList') {
    return (
      <DreamBoard data={data} setData={setData} onBack={() => setOpen(null)} />
    )
  }

  return (
    <div>
      <div className="view-heading">
        <h1>Shared</h1>
        <span className="sub">our common space</span>
      </div>

      <div className="placeholder-grid">
        {SECTIONS.map((s) => {
          const count = Array.isArray(shared[s.key]) ? shared[s.key].length : 0
          if (s.ready) {
            return (
              <button
                key={s.key}
                className="placeholder-card ready"
                onClick={() => setOpen(s.key)}
              >
                <h3>{s.label}</h3>
                <span>
                  {count === 0 ? 'Open board →' : `${count} pinned · Open →`}
                </span>
              </button>
            )
          }
          return (
            <div className="placeholder-card" key={s.key}>
              <h3>{s.label}</h3>
              <span>Coming soon</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
