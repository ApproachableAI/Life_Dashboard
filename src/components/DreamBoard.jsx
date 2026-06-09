import { useRef, useState } from 'react'
import { uid } from '../lib/uid'

// A cute, interactive cork board for the shared Dream List. Notes are pinned
// paper cards you can drag anywhere, type into, and remove. Positions live in
// data.shared.dreamList so they persist and auto-save like everything else.

const PAPERS = ['#FFF6E0', '#F9DAD6', '#E9F3B8', '#E4E9FB', '#FFE0D2', '#D8EFE6']
const PINS = ['#e64b3a', '#217c82', '#3451a3', '#56213e', '#c9a227']
const NOTE_W = 190
const NOTE_H = 168

export default function DreamBoard({ data, setData, onBack }) {
  const notes = data.shared?.dreamList ?? []
  const boardRef = useRef(null)
  const dragRef = useRef(null)
  const [drag, setDrag] = useState(null)

  function setList(updater) {
    setData((prev) => ({
      ...prev,
      shared: {
        ...prev.shared,
        dreamList: updater(prev.shared?.dreamList ?? []),
      },
    }))
  }

  function addNote() {
    const i = notes.length
    setList((list) => [
      ...list,
      {
        id: uid(),
        text: '',
        x: 28 + (i % 5) * 36,
        y: 28 + (i % 5) * 28,
        color: PAPERS[i % PAPERS.length],
        pin: PINS[i % PINS.length],
        rot: Math.round((Math.random() * 8 - 4) * 10) / 10,
      },
    ])
  }

  const updateNote = (id, patch) =>
    setList((list) => list.map((n) => (n.id === id ? { ...n, ...patch } : n)))

  const deleteNote = (id) =>
    setList((list) => list.filter((n) => n.id !== id))

  function clampPos(x, y) {
    const rect = boardRef.current?.getBoundingClientRect()
    const maxX = rect ? rect.width - NOTE_W - 8 : 9999
    const maxY = rect ? rect.height - NOTE_H - 8 : 9999
    return {
      x: Math.max(8, Math.min(x, Math.max(8, maxX))),
      y: Math.max(8, Math.min(y, Math.max(8, maxY))),
    }
  }

  function onPointerDown(e, note) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      id: note.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: note.x,
      origY: note.y,
    }
    setDrag({ id: note.id, x: note.x, y: note.y })
  }

  function onPointerMove(e) {
    const d = dragRef.current
    if (!d) return
    const { x, y } = clampPos(
      d.origX + (e.clientX - d.startX),
      d.origY + (e.clientY - d.startY),
    )
    setDrag({ id: d.id, x, y })
  }

  function onPointerUp() {
    const d = dragRef.current
    if (d && drag) updateNote(d.id, { x: drag.x, y: drag.y })
    dragRef.current = null
    setDrag(null)
  }

  return (
    <div>
      <div className="board-head">
        <button className="icon-btn" onClick={onBack}>
          ← Shared
        </button>
        <h1 className="board-title">Dream List</h1>
        <button className="add-btn" onClick={addNote}>
          + Pin a dream
        </button>
      </div>

      <div className="corkboard" ref={boardRef}>
        {notes.length === 0 && (
          <div className="board-empty">Pin your first dream ✨</div>
        )}

        {notes.map((note) => {
          const pos = drag && drag.id === note.id ? drag : note
          return (
            <div
              key={note.id}
              className={`dream-note ${drag?.id === note.id ? 'dragging' : ''}`}
              style={{
                left: pos.x,
                top: pos.y,
                background: note.color,
                '--rot': `${note.rot || 0}deg`,
              }}
            >
              <div
                className="note-handle"
                onPointerDown={(e) => onPointerDown(e, note)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                title="Drag to move"
              >
                <span className="pin" style={{ '--pin': note.pin }} />
              </div>
              <textarea
                className="note-text"
                value={note.text}
                placeholder="A dream…"
                onChange={(e) => updateNote(note.id, { text: e.target.value })}
              />
              <button
                className="note-del"
                onClick={() => deleteNote(note.id)}
                aria-label="Remove note"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
      <div className="today-note" style={{ marginTop: 10 }}>
        Drag a note by its pin to move it. Click the paper to write.
      </div>
    </div>
  )
}
