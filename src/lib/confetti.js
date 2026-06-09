// A tiny, dependency-free confetti burst for the satisfying moment when a task
// gets checked off. Spawns a handful of colored pieces at (x, y) that fly out
// and fade, then clean themselves up.

const COLORS = ['#DAF561', '#FFA589', '#217C82', '#3451A3', '#9FADF4', '#56213E']

export function celebrate(x, y) {
  if (typeof document === 'undefined') return
  // Respect users who prefer reduced motion.
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  const pieces = 14
  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('span')
    piece.className = 'confetti-piece'

    const angle = (Math.PI * 2 * i) / pieces + Math.random() * 0.6
    const distance = 34 + Math.random() * 46
    const dx = Math.cos(angle) * distance
    const dy = Math.sin(angle) * distance - 24 // bias upward so it "pops"

    piece.style.left = `${x}px`
    piece.style.top = `${y}px`
    piece.style.background = COLORS[i % COLORS.length]
    piece.style.setProperty('--dx', `${dx}px`)
    piece.style.setProperty('--dy', `${dy}px`)

    document.body.appendChild(piece)
    setTimeout(() => piece.remove(), 800)
  }
}
