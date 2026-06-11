import { useState } from 'react'
import { uid } from '../lib/uid'

// A cute bookshelf for the shared zone: colored book spines you can title, plus
// little trinkets/plants to decorate the shelves. Lives in data.shared.bookshelf
// and auto-saves like everything else.

const SPINES = [
  '#c0566f', '#e0a85e', '#6a8e4e', '#3f7a8c',
  '#7a5aa0', '#c97b9a', '#4f6d7a', '#d98b54',
]
const TRINKETS = ['🪴', '🌵', '🌸', '🕯️', '🧸', '🐚', '⭐', '🍄', '🌿', '🦋', '🫖', '📷']

const randomSpine = () => SPINES[Math.floor(Math.random() * SPINES.length)]

export default function Bookshelf({ data, setData }) {
  const items = data.shared?.bookshelf ?? []
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(randomSpine)
  const [trayOpen, setTrayOpen] = useState(false)

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
    setList((l) => [...l, { id: uid(), type: 'book', title: title.trim(), color }])
    setTitle('')
    setColor(randomSpine())
  }

  function addTrinket(emoji) {
    setList((l) => [...l, { id: uid(), type: 'decor', emoji }])
    setTrayOpen(false)
  }

  const remove = (id) => setList((l) => l.filter((i) => i.id !== id))

  return (
    <div className="bookshelf-section">
      <div className="board-head">
        <h2 className="board-title">Bookshelf</h2>
        <button className="add-btn subtle" onClick={() => setTrayOpen((o) => !o)}>
          🪴 Trinket
        </button>
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

      <div className="bookshelf">
        {items.length === 0 && (
          <div className="shelf-empty">Add a book to start your shelf 📚</div>
        )}
        <div className="shelf-books">
          {items.map((it) =>
            it.type === 'decor' ? (
              <div className="trinket" key={it.id}>
                <span>{it.emoji}</span>
                <button
                  className="item-del"
                  onClick={() => remove(it.id)}
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                className="book"
                key={it.id}
                style={{ background: it.color }}
                title={it.title}
              >
                <span className="book-title">{it.title}</span>
                <button
                  className="item-del"
                  onClick={() => remove(it.id)}
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ),
          )}
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
    </div>
  )
}
