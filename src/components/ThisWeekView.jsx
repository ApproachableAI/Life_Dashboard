import { useEffect, useState } from 'react'
import { emptyWeek } from '../lib/data'
import {
  weekKey,
  addWeeks,
  weekRange,
  monthValue,
  weekKeyForMonth,
  ensureWeek,
} from '../lib/week'
import { uid } from '../lib/uid'
import { celebrate } from '../lib/confetti'
import TodayCard from './TodayCard'

const PERSON_LABEL = { jordyn: 'Jordyn', ty: 'Ty' }

export default function ThisWeekView({ person, data, setData, lanes }) {
  // Recomputed each render; only its value (a string) matters for effects.
  const currentKey = weekKey(new Date())
  const [activeKey, setActiveKey] = useState(currentKey)

  const isCurrent = activeKey === currentKey
  const isPast = activeKey < currentKey

  // Carry-forward: when the current/future week is first opened, pull over the
  // still-unchecked tasks from the most recent prior week — exactly once.
  useEffect(() => {
    setData((prev) => ensureWeek(prev, person, activeKey, currentKey))
  }, [person, activeKey, currentKey, setData])

  const week = data[person].weeks[activeKey] ?? emptyWeek()

  // Apply an update to the active week, lazily creating its record (used when
  // editing an empty past week, which doesn't auto-create on open).
  function setWeek(produceNext) {
    setData((prev) => {
      const weeks = prev[person].weeks
      const existing = weeks[activeKey] ?? emptyWeek()
      const next = produceNext(existing)
      return {
        ...prev,
        [person]: { ...prev[person], weeks: { ...weeks, [activeKey]: next } },
      }
    })
  }

  // --- Tasks -----------------------------------------------------------------
  function addTask(text) {
    const t = text.trim()
    if (!t) return
    setWeek((w) => ({
      ...w,
      tasks: [...(w.tasks || []), { id: uid(), text: t, done: false, lane: null }],
    }))
  }

  function toggleTask(id, event) {
    const willBeDone = !(week.tasks.find((t) => t.id === id)?.done)
    if (willBeDone && event) {
      const rect = event.currentTarget.getBoundingClientRect()
      celebrate(rect.left + rect.width / 2, rect.top + rect.height / 2)
    }
    setWeek((w) => ({
      ...w,
      tasks: (w.tasks || []).map((t) =>
        t.id === id ? { ...t, done: !t.done } : t,
      ),
    }))
  }

  function editTask(id, text) {
    setWeek((w) => ({
      ...w,
      tasks: (w.tasks || []).map((t) => (t.id === id ? { ...t, text } : t)),
    }))
  }

  function setTaskLane(id, lane) {
    setWeek((w) => ({
      ...w,
      tasks: (w.tasks || []).map((t) =>
        t.id === id ? { ...t, lane: lane || null } : t,
      ),
    }))
  }

  function deleteTask(id) {
    setWeek((w) => ({
      ...w,
      tasks: (w.tasks || []).filter((t) => t.id !== id),
    }))
  }

  // --- Today list ------------------------------------------------------------
  function addTodayItem() {
    setWeek((w) => ({
      ...w,
      today: [...(w.today || []), { id: uid(), time: '', text: '' }],
    }))
  }

  function updateTodayItem(id, patch) {
    setWeek((w) => ({
      ...w,
      today: (w.today || []).map((it) =>
        it.id === id ? { ...it, ...patch } : it,
      ),
    }))
  }

  function deleteTodayItem(id) {
    setWeek((w) => ({
      ...w,
      today: (w.today || []).filter((it) => it.id !== id),
    }))
  }

  // --- Misc fields -----------------------------------------------------------
  const setFocus = (focus) => setWeek((w) => ({ ...w, focus }))
  const setReflection = (reflection) => setWeek((w) => ({ ...w, reflection }))

  // --- Week navigation -------------------------------------------------------
  const { start, end } = weekRange(activeKey)
  const rangeLabel = formatRange(start, end)

  return (
    <div>
      <div className="view-heading">
        <h1>{PERSON_LABEL[person]}</h1>
        <span className="sub">This Week</span>
      </div>

      <div className="week-nav">
        <button
          className="arrow-btn"
          onClick={() => setActiveKey(addWeeks(activeKey, -1))}
          aria-label="Previous week"
        >
          ‹
        </button>
        <span className="range">
          {rangeLabel}
          {isCurrent && <span className="tag">This week</span>}
          {isPast && <span className="tag past">Past</span>}
        </span>
        <button
          className="arrow-btn"
          onClick={() => setActiveKey(addWeeks(activeKey, 1))}
          aria-label="Next week"
        >
          ›
        </button>

        {!isCurrent && (
          <button className="icon-btn" onClick={() => setActiveKey(currentKey)}>
            Today
          </button>
        )}

        <div className="month-jump">
          <label htmlFor="month-jump">Jump to</label>
          <input
            id="month-jump"
            type="month"
            value={monthValue(activeKey)}
            onChange={(e) => {
              if (e.target.value) setActiveKey(weekKeyForMonth(e.target.value))
            }}
          />
        </div>
      </div>

      {/* Weekly focus */}
      <div className="card focus-card">
        <div className="card-title">Weekly focus</div>
        <input
          className="focus-input"
          value={week.focus || ''}
          onChange={(e) => setFocus(e.target.value)}
          placeholder="The single most important thing this week…"
        />
      </div>

      {/* Task checklist */}
      <div className="card">
        <div className="card-title">To-do this week</div>
        <TaskList
          tasks={week.tasks || []}
          lanes={lanes}
          onToggle={toggleTask}
          onEdit={editTask}
          onLane={setTaskLane}
          onDelete={deleteTask}
        />
        <AddTask onAdd={addTask} />
      </div>

      {/* Today (Google Calendar when connected, manual list otherwise) */}
      <TodayCard
        person={person}
        isCurrent={isCurrent}
        manualItems={week.today || []}
        onAddManual={addTodayItem}
        onUpdateManual={updateTodayItem}
        onDeleteManual={deleteTodayItem}
      />

      {/* Reflection */}
      <div className="card">
        <div className="card-title">Daily reflection / notes</div>
        <textarea
          className="reflection-area"
          value={week.reflection || ''}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="How did today go? Anything worth remembering…"
        />
      </div>
    </div>
  )
}

// --- Task list ---------------------------------------------------------------
function TaskList({ tasks, lanes, onToggle, onEdit, onLane, onDelete }) {
  if (tasks.length === 0) {
    return <div className="empty-hint">No tasks yet — add your first below.</div>
  }
  const laneById = Object.fromEntries(lanes.map((l) => [l.id, l]))

  return (
    <ul className="task-list">
      {tasks.map((task) => {
        const lane = task.lane ? laneById[task.lane] : null
        return (
          <li
            className={`task ${task.done ? 'done' : ''}`}
            key={task.id}
            style={{ borderLeftColor: lane ? lane.color : 'var(--line)' }}
          >
            <input
              className="check"
              type="checkbox"
              checked={!!task.done}
              onChange={(e) => onToggle(task.id, e)}
              aria-label={task.done ? 'Mark not done' : 'Mark done'}
            />
            <input
              className="task-text"
              value={task.text}
              onChange={(e) => onEdit(task.id, e.target.value)}
            />
            <select
              className={`lane-select ${lane ? '' : 'none'}`}
              style={lane ? { background: lane.color } : undefined}
              value={lane ? task.lane : ''}
              onChange={(e) => onLane(task.id, e.target.value)}
              aria-label="Lane"
            >
              <option value="">No lane</option>
              {lanes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
            <button
              className="del-btn"
              onClick={() => onDelete(task.id)}
              aria-label="Delete task"
            >
              ✕
            </button>
          </li>
        )
      })}
    </ul>
  )
}

// --- Add task input ----------------------------------------------------------
function AddTask({ onAdd }) {
  const [text, setText] = useState('')
  function submit(e) {
    e.preventDefault()
    onAdd(text)
    setText('')
  }
  return (
    <form className="add-row" onSubmit={submit}>
      <input
        className="text-input"
        value={text}
        placeholder="Add a task…"
        onChange={(e) => setText(e.target.value)}
      />
      <button className="add-btn" type="submit">
        Add
      </button>
    </form>
  )
}

// --- Helpers -----------------------------------------------------------------
function formatRange(start, end) {
  const sameMonth = start.getMonth() === end.getMonth()
  const startStr = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  const endStr = end.toLocaleDateString(undefined, {
    month: sameMonth ? undefined : 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${startStr} – ${endStr}`
}
