import { useState } from 'react'
import { uid } from '../lib/uid'

// Rename, recolor, add, and remove lanes. Lanes live in settings.lanes and
// tasks reference them by id, so the week / carry-forward logic never depends
// on which lanes exist.
export default function LaneSettings({ lanes, setData, onClose }) {
  // Edit a working copy so changes only commit on Save.
  const [draft, setDraft] = useState(() => lanes.map((l) => ({ ...l })))

  function update(id, patch) {
    setDraft((d) => d.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  function remove(id) {
    setDraft((d) => d.filter((l) => l.id !== id))
  }

  function add() {
    setDraft((d) => [
      ...d,
      { id: uid(), label: 'New lane', color: '#9FADF4' },
    ])
  }

  function save() {
    // Drop blank-labeled lanes; keep the rest in order.
    const cleaned = draft
      .map((l) => ({ ...l, label: l.label.trim() }))
      .filter((l) => l.label.length)
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, lanes: cleaned },
    }))
    onClose()
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Task lanes</h2>
          <button className="del-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {draft.length === 0 && (
          <p className="empty-hint">No lanes yet — add one below.</p>
        )}

        {draft.map((lane) => (
          <div className="lane-row" key={lane.id}>
            <input
              type="color"
              value={lane.color}
              onChange={(e) => update(lane.id, { color: e.target.value })}
              aria-label="Lane color"
            />
            <input
              className="text-input"
              value={lane.label}
              onChange={(e) => update(lane.id, { label: e.target.value })}
              placeholder="Lane name"
            />
            <span className="lane-chip-preview" style={{ background: lane.color }}>
              {lane.label || 'Lane'}
            </span>
            <button
              className="del-btn"
              onClick={() => remove(lane.id)}
              aria-label="Remove lane"
            >
              🗑
            </button>
          </div>
        ))}

        <div className="modal-actions">
          <button className="add-btn subtle" onClick={add}>
            + Add lane
          </button>
          <button className="primary-btn" onClick={save}>
            Save lanes
          </button>
        </div>
      </div>
    </div>
  )
}
