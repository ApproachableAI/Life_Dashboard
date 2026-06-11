import { useEffect, useRef, useState } from 'react'
import { uid } from '../lib/uid'
import { celebrate } from '../lib/confetti'

// Interactive cork board for the shared Dream List, shown inline on the Shared
// tab. Notes can be text or images (paste, drag-drop, or pick a file). Each can
// be dragged, recolored (swatches / native picker / typed hex), resized, and
// marked achieved — which moves it to the Achieved shelf below. Everything
// lives in data.shared.dreamList and auto-saves.

const PAPERS = ['#FFF6E0', '#F9DAD6', '#E9F3B8', '#E4E9FB', '#FFE0D2', '#D8EFE6']
const PINS = ['#e64b3a', '#217c82', '#3451a3', '#56213e', '#c9a227']
const DEFAULT_W = 190
const DEFAULT_H = 172
const MIN_W = 130
const MIN_H = 100

const sizeOf = (n) => ({ w: n.w || DEFAULT_W, h: n.h || DEFAULT_H })

// Shrink + compress an image file so it doesn't bloat the saved JSON blob.
function fileToDataURL(file, max = 760, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > height && width > max) {
          height = Math.round((height * max) / width)
          width = max
        } else if (height > max) {
          width = Math.round((width * max) / height)
          height = max
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function DreamBoard({ data, setData }) {
  const allNotes = data.shared?.dreamList ?? []
  const notes = allNotes.filter((n) => !n.done)
  const achieved = allNotes
    .filter((n) => n.done)
    .sort((a, b) => (b.achievedAt || '').localeCompare(a.achievedAt || ''))

  const boardRef = useRef(null)
  const fileRef = useRef(null)
  const dragRef = useRef(null)
  const resizeRef = useRef(null)
  const [drag, setDrag] = useState(null)
  const [resize, setResize] = useState(null)
  const [colorOpen, setColorOpen] = useState(null)
  const [showSaved, setShowSaved] = useState(false)

  function setList(updater) {
    setData((prev) => ({
      ...prev,
      shared: {
        ...prev.shared,
        dreamList: updater(prev.shared?.dreamList ?? []),
      },
    }))
  }

  function baseNote(i) {
    return {
      id: uid(),
      x: 28 + (i % 5) * 36,
      y: 28 + (i % 5) * 28,
      w: DEFAULT_W,
      h: DEFAULT_H,
      color: PAPERS[i % PAPERS.length],
      pin: PINS[i % PINS.length],
      rot: Math.round((Math.random() * 8 - 4) * 10) / 10,
    }
  }

  function addNote() {
    setList((list) => [...list, { ...baseNote(list.length), text: '' }])
  }

  function addImageNote(dataUrl, x, y) {
    setList((list) => {
      const n = baseNote(list.length)
      return [
        ...list,
        {
          ...n,
          type: 'image',
          img: dataUrl,
          color: '#ffffff',
          w: 210,
          h: 170,
          x: x ?? n.x,
          y: y ?? n.y,
        },
      ]
    })
  }

  const updateNote = (id, patch) =>
    setList((list) => list.map((n) => (n.id === id ? { ...n, ...patch } : n)))

  const deleteNote = (id) =>
    setList((list) => list.filter((n) => n.id !== id))

  function markDone(id, e) {
    if (e) celebrate(e.clientX, e.clientY)
    updateNote(id, { done: true, achievedAt: new Date().toISOString() })
  }

  const restoreNote = (id) => updateNote(id, { done: false, achievedAt: null })

  // --- Images: paste, drop, file picker -------------------------------------
  useEffect(() => {
    async function onPaste(e) {
      const items = e.clipboardData?.items || []
      for (const it of items) {
        if (it.type.startsWith('image/')) {
          const file = it.getAsFile()
          if (file) {
            e.preventDefault()
            addImageNote(await fileToDataURL(file), 36, 36)
          }
          break
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onDrop(e) {
    e.preventDefault()
    const file = [...(e.dataTransfer?.files || [])].find((f) =>
      f.type.startsWith('image/'),
    )
    if (!file) return
    const rect = boardRef.current?.getBoundingClientRect()
    const x = rect ? e.clientX - rect.left - 105 : 36
    const y = rect ? e.clientY - rect.top - 85 : 36
    addImageNote(await fileToDataURL(file), Math.max(8, x), Math.max(8, y))
  }

  async function onPickFile(e) {
    const file = e.target.files?.[0]
    if (file) addImageNote(await fileToDataURL(file), 36, 36)
    e.target.value = ''
  }

  // --- Dragging --------------------------------------------------------------
  function clampPos(x, y, note) {
    const rect = boardRef.current?.getBoundingClientRect()
    const { w, h } = sizeOf(note)
    const maxX = rect ? rect.width - w - 8 : 9999
    const maxY = rect ? rect.height - h - 8 : 9999
    return {
      x: Math.max(8, Math.min(x, Math.max(8, maxX))),
      y: Math.max(8, Math.min(y, Math.max(8, maxY))),
    }
  }

  function onDragDown(e, note) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      note,
      startX: e.clientX,
      startY: e.clientY,
      origX: note.x,
      origY: note.y,
    }
    setDrag({ id: note.id, x: note.x, y: note.y })
  }

  function onDragMove(e) {
    const d = dragRef.current
    if (!d) return
    const { x, y } = clampPos(
      d.origX + (e.clientX - d.startX),
      d.origY + (e.clientY - d.startY),
      d.note,
    )
    setDrag({ id: d.note.id, x, y })
  }

  function onDragUp() {
    const d = dragRef.current
    if (d && drag) updateNote(d.note.id, { x: drag.x, y: drag.y })
    dragRef.current = null
    setDrag(null)
  }

  // --- Resizing --------------------------------------------------------------
  function onResizeDown(e, note) {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const { w, h } = sizeOf(note)
    resizeRef.current = {
      id: note.id,
      startX: e.clientX,
      startY: e.clientY,
      origW: w,
      origH: h,
    }
    setResize({ id: note.id, w, h })
  }

  function onResizeMove(e) {
    const r = resizeRef.current
    if (!r) return
    setResize({
      id: r.id,
      w: Math.max(MIN_W, r.origW + (e.clientX - r.startX)),
      h: Math.max(MIN_H, r.origH + (e.clientY - r.startY)),
    })
  }

  function onResizeUp() {
    const r = resizeRef.current
    if (r && resize) updateNote(r.id, { w: resize.w, h: resize.h })
    resizeRef.current = null
    setResize(null)
  }

  return (
    <div className="dream-section">
      <div className="board-head">
        <h2 className="board-title">Dream List</h2>
        <button className="add-btn subtle" onClick={() => setShowSaved(true)}>
          ✨ Saved dreams{achieved.length ? ` (${achieved.length})` : ''}
        </button>
        <button className="add-btn subtle" onClick={() => fileRef.current?.click()}>
          📷 Add image
        </button>
        <button className="add-btn" onClick={addNote}>
          + Pin a dream
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onPickFile}
          style={{ display: 'none' }}
        />
      </div>

      <div className="cork-frame">
        <div
          className="corkboard"
          ref={boardRef}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {notes.length === 0 && (
            <div className="board-empty">
              Pin a dream, or paste / drop an image ✨
            </div>
          )}

          {notes.map((note) => {
            const pos = drag && drag.id === note.id ? drag : note
            const sz = resize && resize.id === note.id ? resize : sizeOf(note)
            return (
              <div
                key={note.id}
                className={`dream-note ${note.type === 'image' ? 'is-image' : ''} ${
                  drag?.id === note.id ? 'dragging' : ''
                }`}
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: sz.w,
                  height: sz.h,
                  background: note.color,
                  '--rot': `${note.rot || 0}deg`,
                }}
              >
                <div
                  className="note-handle"
                  onPointerDown={(e) => onDragDown(e, note)}
                  onPointerMove={onDragMove}
                  onPointerUp={onDragUp}
                  title="Drag to move"
                >
                  <span className="pin" style={{ '--pin': note.pin }} />
                </div>

                {note.type === 'image' ? (
                  <div className="note-img-wrap">
                    <img
                      className="note-img"
                      src={note.img}
                      alt=""
                      draggable={false}
                    />
                  </div>
                ) : (
                  <textarea
                    className="note-text"
                    value={note.text}
                    placeholder="A dream…"
                    onChange={(e) => updateNote(note.id, { text: e.target.value })}
                  />
                )}

                <div className="note-actions">
                  <button
                    className="note-act"
                    title="Change color"
                    onClick={() =>
                      setColorOpen(colorOpen === note.id ? null : note.id)
                    }
                  >
                    🎨
                  </button>
                  <button
                    className="note-act"
                    title="Mark as achieved"
                    onClick={(e) => markDone(note.id, e)}
                  >
                    ⭐
                  </button>
                </div>

                <button
                  className="note-del"
                  onClick={() => deleteNote(note.id)}
                  aria-label="Remove note"
                >
                  ✕
                </button>

                <div
                  className="note-resize"
                  onPointerDown={(e) => onResizeDown(e, note)}
                  onPointerMove={onResizeMove}
                  onPointerUp={onResizeUp}
                  title="Drag to resize"
                />

                {colorOpen === note.id && (
                  <ColorPopover
                    color={note.color}
                    pin={note.pin}
                    onColor={(c) => updateNote(note.id, { color: c })}
                    onPin={(p) => updateNote(note.id, { pin: p })}
                    onClose={() => setColorOpen(null)}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="today-note" style={{ marginTop: 10 }}>
        Drag by the pin · drag the corner to resize · paste or drop an image ·
        ⭐ to mark a dream achieved.
      </div>

      {showSaved && (
        <div className="modal-backdrop" onMouseDown={() => setShowSaved(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Achieved dreams ✨</h2>
              <button
                className="del-btn"
                onClick={() => setShowSaved(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            {achieved.length === 0 && (
              <p className="empty-hint">Nothing saved yet.</p>
            )}
            {achieved.map((n) => (
              <div className="achieved-row" key={n.id}>
                <span className="achieved-star">⭐</span>
                <span className="achieved-text">
                  {n.type === 'image' ? '📷 (image)' : n.text || '(untitled)'}
                </span>
                {n.achievedAt && (
                  <span className="achieved-date">
                    {new Date(n.achievedAt).toLocaleDateString()}
                  </span>
                )}
                <button className="link-btn" onClick={() => restoreNote(n.id)}>
                  Restore
                </button>
                <button
                  className="del-btn"
                  onClick={() => deleteNote(n.id)}
                  aria-label="Delete forever"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Color popover -----------------------------------------------------------
function ColorPopover({ color, pin, onColor, onPin, onClose }) {
  const [hex, setHex] = useState(color)

  function applyHex(value) {
    setHex(value)
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) onColor(value)
  }

  return (
    <div className="color-pop" onPointerDown={(e) => e.stopPropagation()}>
      <div className="color-pop-head">
        <span>Paper</span>
        <button className="link-btn" onClick={onClose}>
          Done
        </button>
      </div>

      <div className="swatch-row">
        {PAPERS.map((c) => (
          <button
            key={c}
            className="swatch"
            style={{ background: c }}
            onClick={() => {
              onColor(c)
              setHex(c)
            }}
            aria-label={c}
          />
        ))}
      </div>

      <div className="hex-row">
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(hex) ? hex : color}
          onChange={(e) => applyHex(e.target.value)}
          aria-label="Pick paper color"
        />
        <input
          className="text-input hex-input"
          value={hex}
          placeholder="#e79f31"
          onChange={(e) => applyHex(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div className="color-pop-head">
        <span>Pin</span>
      </div>
      <div className="swatch-row">
        {PINS.map((c) => (
          <button
            key={c}
            className={`swatch pin-swatch ${pin === c ? 'active' : ''}`}
            style={{ background: c }}
            onClick={() => onPin(c)}
            aria-label={c}
          />
        ))}
      </div>
    </div>
  )
}
