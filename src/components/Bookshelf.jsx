import { useRef, useState } from 'react'
import { uid } from '../lib/uid'

// A cute bookshelf for the shared zone: colored book spines you can title and
// recolor, plus trinkets/plants to decorate the shelves. Each book tracks a
// per-person reading status (none / reading / read) for Jordyn and Ty, so we
// can show "finished" counts and what each person is currently reading.
// Items are drag-to-rearrange. Lives in data.shared.bookshelf and auto-saves.

const SPINES = [
  '#c0566f', '#e0a85e', '#6a8e4e', '#3f7a8c',
  '#7a5aa0', '#c97b9a', '#4f6d7a', '#d98b54',
]
const TRINKETS = ['🪴', '🌵', '🌸', '🕯️', '🧸', '🐚', '⭐', '🍄', '🌿', '🦋', '🫖', '📷']
const PEOPLE = [
  ['jordyn', 'Jordyn'],
  ['ty', 'Ty'],
]

const randomSpine = () => SPINES[Math.floor(Math.random() * SPINES.length)]
const statusOf = (book) => book.status || { jordyn: 'none', ty: 'none' }

export default function Bookshelf({ data, setData }) {
  const items = data.shared?.bookshelf ?? []
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(randomSpine)
  const [trayOpen, setTrayOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const dragIndex = useRef(null)

  const editBook = editId ? items.find((i) => i.id === editId) : null

  function setList(updater) {
    setData((prev) => ({
      ...prev,
      shared: {
        ...prev.shared,
        bookshelf: updater(prev.shared?.bookshelf ?? []),
      },
    }))
  }

  function addBook(e) {
    e.preventDefault()
    if (!title.trim()) return
    setList((l) => [
      ...l,
      {
        id: uid(),
        type: 'book',
        title: title.trim(),
        color,
        status: { jordyn: 'none', ty: 'none' },
      },
    ])
    setTitle('')
    setColor(randomSpine())
  }

  function addTrinket(emoji) {
    setList((l) => [...l, { id: uid(), type: 'decor', emoji }])
    setTrayOpen(false)
  }

  const remove = (id) => setList((l) => l.filter((i) => i.id !== id))
  const updateBook = (id, patch) =>
    setList((l) => l.map((i) => (i.id === id ? { ...i, ...patch } : i)))

  function toggleStatus(id, person, target) {
    setList((l) =>
      l.map((it) => {
        if (it.id !== id) return it
        const st = { jordyn: 'none', ty: 'none', ...(it.status || {}) }
        st[person] = st[person] === target ? 'none' : target
        return { ...it, status: st }
      }),
    )
  }

  // Drag-to-rearrange (native DnD over the full items array).
  function onDrop(toIndex) {
    const from = dragIndex.current
    dragIndex.current = null
    if (from === null || from === toIndex) return
    setList((l) => {
      const next = [...l]
      const [moved] = next.splice(from, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  // Per-person tallies.
  const finished = { jordyn: 0, ty: 0 }
  const reading = { jordyn: [], ty: [] }
  items.forEach((it) => {
    if (it.type !== 'book') return
    const st = statusOf(it)
    for (const [p] of PEOPLE) {
      if (st[p] === 'read') finished[p] += 1
      if (st[p] === 'reading') reading[p].push(it.title)
    }
  })

  return (
    <div className="bookshelf-section">
      <div className="board-head">
        <h2 className="board-title">Bookshelf</h2>
        <button className="add-btn subtle" onClick={() => setTrayOpen((o) => !o)}>
          🪴 Trinket
        </button>
      </div>

      <div className="shelf-stats">
        {PEOPLE.map(([p, label]) => (
          <div className="stat" key={p}>
            <span className="stat-num">{finished[p]}</span>
            <span className="stat-label">{label} conquered</span>
          </div>
        ))}
      </div>

      <div className="reading-now">
        {PEOPLE.map(([p, label]) => (
          <div key={p}>
            <strong>{label} is reading:</strong>{' '}
            {reading[p].length ? reading[p].join(', ') : '—'}
          </div>
        ))}
      </div>

      {trayOpen && (
        <div className="trinket-tray">
          {TRINKETS.map((t) => (
            <button
              key={t}
              className="trinket-pick"
              onClick={() => addTrinket(t)}
              aria-label={`Add ${t}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="bookcase">
        <div className="bookcase-inner">
          {items.length === 0 && (
            <div className="shelf-empty">Add a book to start your shelf 📚</div>
          )}
          <div className="shelf-books">
          {items.map((it, i) => {
            const common = {
              draggable: true,
              onDragStart: () => (dragIndex.current = i),
              onDragOver: (e) => e.preventDefault(),
              onDrop: () => onDrop(i),
            }
            if (it.type === 'decor') {
              return (
                <div className="trinket" key={it.id} {...common}>
                  <span>{it.emoji}</span>
                  <button
                    className="item-del"
                    onClick={() => remove(it.id)}
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>
              )
            }
            const st = statusOf(it)
            return (
              <div
                className="book"
                key={it.id}
                style={{ background: it.color }}
                title={it.title}
                onClick={() => setEditId(it.id)}
                {...common}
              >
                <div className="book-badges">
                  {PEOPLE.map(([p, label]) =>
                    st[p] !== 'none' ? (
                      <span className={`bk-badge ${st[p]}`} key={p}>
                        {label[0]}
                      </span>
                    ) : null,
                  )}
                </div>
                <span className="book-title">{it.title}</span>
              </div>
            )
          })}
          </div>
        </div>
      </div>

      <form className="add-row book-add" onSubmit={addBook}>
        <input
          type="color"
          className="book-color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          aria-label="Book color"
        />
        <input
          className="text-input"
          value={title}
          placeholder="Book title…"
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="add-btn" type="submit">
          Add book
        </button>
      </form>

      {editBook && (
        <div className="modal-backdrop" onMouseDown={() => setEditId(null)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Edit book</h2>
              <button
                className="del-btn"
                onClick={() => setEditId(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="lane-row">
              <input
                type="color"
                value={editBook.color}
                onChange={(e) => updateBook(editBook.id, { color: e.target.value })}
                aria-label="Book color"
              />
              <input
                className="text-input"
                value={editBook.title}
                placeholder="Book title"
                onChange={(e) => updateBook(editBook.id, { title: e.target.value })}
              />
            </div>

            {PEOPLE.map(([p, label]) => {
              const s = statusOf(editBook)[p]
              return (
                <div className="status-row" key={p}>
                  <span className="status-name">{label}</span>
                  <button
                    className={`status-btn ${s === 'reading' ? 'on reading' : ''}`}
                    onClick={() => toggleStatus(editBook.id, p, 'reading')}
                  >
                    📖 Reading
                  </button>
                  <button
                    className={`status-btn ${s === 'read' ? 'on read' : ''}`}
                    onClick={() => toggleStatus(editBook.id, p, 'read')}
                  >
                    ✅ Read
                  </button>
                </div>
              )
            })}

            <div className="modal-actions">
              <button
                className="del-btn"
                onClick={() => {
                  remove(editBook.id)
                  setEditId(null)
                }}
              >
                🗑 Delete book
              </button>
              <button className="primary-btn" onClick={() => setEditId(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
