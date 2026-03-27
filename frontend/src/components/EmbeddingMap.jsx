import { useState, useEffect, useRef } from 'react'

const API = 'http://localhost:8000'

export default function EmbeddingMap() {
  const [data, setData] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [visibleCount, setVisibleCount] = useState(0)
  const [started, setStarted] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    fetch(`${API}/embeddings/map`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  function handleStart() {
    setStarted(true)
    setVisibleCount(0)
    let count = 0
    const total = data ? data.users.length + data.items.length : 0
    const batchSize = 5
    timerRef.current = setInterval(() => {
      count = Math.min(count + batchSize, total)
      setVisibleCount(count)
      if (count >= total) clearInterval(timerRef.current)
    }, 30)
  }

  function handleShowAll() {
    setStarted(true)
    clearInterval(timerRef.current)
    if (data) setVisibleCount(data.users.length + data.items.length)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  if (!data) return <div style={{ padding: 8 }}>Loading embedding map...</div>

  const W = 680, H = 400, PAD = 40
  const allPoints = [...data.users, ...data.items]
  const minX = Math.min(...allPoints.map((p) => p.x))
  const maxX = Math.max(...allPoints.map((p) => p.x))
  const minY = Math.min(...allPoints.map((p) => p.y))
  const maxY = Math.max(...allPoints.map((p) => p.y))
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1

  function toSvgX(x) { return PAD + ((x - minX) / rangeX) * (W - 2 * PAD) }
  function toSvgY(y) { return PAD + ((maxY - y) / rangeY) * (H - 2 * PAD) }

  // Items appear first, then users
  const visibleItems = data.items.slice(0, Math.min(visibleCount, data.items.length))
  const visibleUsers = data.users.slice(0, Math.max(0, visibleCount - data.items.length))

  const phase = !started ? 'waiting'
    : visibleCount <= data.items.length ? 'movies'
    : visibleCount < data.items.length + data.users.length ? 'users'
    : 'done'

  return (
    <div>
      {/* Narration */}
      <div style={{
        background: '#ffffcc', border: '1px solid #cca700', padding: '6px 10px',
        fontSize: '11px', marginBottom: 8,
      }}>
        <b>&#128161; What is this?</b>{' '}
        {phase === 'waiting' && "The model stores each user and movie as a point in a 64-dimensional space. We squish those 64 dimensions down to 2 so you can see them. Points that are close together are similar!"}
        {phase === 'movies' && `Placing movies on the map... (${visibleItems.length}/${data.items.length}) Movies with similar vibes end up near each other.`}
        {phase === 'users' && `Now adding users... (${visibleUsers.length}/${data.users.length}) Users appear near the movies they'd enjoy!`}
        {phase === 'done' && "Done! Notice how users cluster near movies they'd like. The model learned these positions entirely from rating data -- no one told it about genres or themes."}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
        <button onClick={handleStart} style={{
          padding: '3px 12px', background: '#ece9d8', border: '2px outset #d4d0c8',
          fontSize: '11px', fontFamily: 'Tahoma, sans-serif', cursor: 'pointer',
        }}>
          &#9654; {started ? 'Replay' : 'Watch Points Appear'}
        </button>
        <button onClick={handleShowAll} style={{
          padding: '3px 12px', background: '#ece9d8', border: '2px outset #d4d0c8',
          fontSize: '11px', fontFamily: 'Tahoma, sans-serif', cursor: 'pointer',
        }}>
          Show All
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#666' }}>
          {visibleCount} / {allPoints.length} points
        </span>
      </div>

      {/* Chart */}
      <div style={{ background: '#fff', border: '2px inset #d4d0c8' }}>
        <svg width={W} height={H} style={{ display: 'block' }}>
          {/* Grid */}
          {[0.25, 0.5, 0.75].map((f) => (
            <g key={f}>
              <line x1={PAD} x2={W - PAD} y1={PAD + f * (H - 2 * PAD)} y2={PAD + f * (H - 2 * PAD)} stroke="#f0f0f0" />
              <line x1={PAD + f * (W - 2 * PAD)} x2={PAD + f * (W - 2 * PAD)} y1={PAD} y2={H - PAD} stroke="#f0f0f0" />
            </g>
          ))}
          <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} stroke="#ccc" />
          <line x1={PAD} x2={PAD} y1={PAD} y2={H - PAD} stroke="#ccc" />

          {/* Item points */}
          {visibleItems.map((p, i) => (
            <circle
              key={`i${i}`}
              cx={toSvgX(p.x)} cy={toSvgY(p.y)} r="4"
              fill="#bbb" stroke="#999" strokeWidth="0.5"
              style={{ cursor: 'pointer' }}
              opacity={0.8}
              onMouseEnter={() => setHovered({ ...p, type: 'Movie' })}
              onMouseLeave={() => setHovered(null)}
            >
              <animate attributeName="r" from="0" to="4" dur="0.3s" fill="freeze" />
              <animate attributeName="opacity" from="0" to="0.8" dur="0.3s" fill="freeze" />
            </circle>
          ))}

          {/* User points */}
          {visibleUsers.map((p, i) => (
            <circle
              key={`u${i}`}
              cx={toSvgX(p.x)} cy={toSvgY(p.y)} r="6"
              fill="#0a246a" stroke="#fff" strokeWidth="1.5"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered({ ...p, type: 'User' })}
              onMouseLeave={() => setHovered(null)}
            >
              <animate attributeName="r" from="0" to="6" dur="0.3s" fill="freeze" />
            </circle>
          ))}

          {/* Hover */}
          {hovered && (
            <g>
              <circle
                cx={toSvgX(hovered.x)} cy={toSvgY(hovered.y)}
                r={hovered.type === 'User' ? 10 : 8}
                fill="none" stroke="#c00" strokeWidth="2"
              >
                <animate attributeName="r"
                  values={hovered.type === 'User' ? '10;13;10' : '8;11;8'}
                  dur="0.8s" repeatCount="indefinite" />
              </circle>
              <rect
                x={Math.min(toSvgX(hovered.x) + 12, W - 160)}
                y={toSvgY(hovered.y) - 22}
                width={Math.max(hovered.label.length * 5.5 + 40, 80)} height={18}
                fill="#ffffcc" stroke="#000" strokeWidth="0.5" rx="2"
              />
              <text
                x={Math.min(toSvgX(hovered.x) + 16, W - 156)}
                y={toSvgY(hovered.y) - 9}
                fontSize="10" fill="#000"
              >
                {hovered.type === 'User' ? '&#128100;' : '&#127916;'} {hovered.label}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, fontSize: '10px', marginTop: 6, alignItems: 'center' }}>
        <span>
          <svg width="12" height="12" style={{ verticalAlign: 'middle' }}>
            <circle cx="6" cy="6" r="5" fill="#0a246a" stroke="#fff" />
          </svg>
          {' '}Users ({data.users.length})
        </span>
        <span>
          <svg width="12" height="12" style={{ verticalAlign: 'middle' }}>
            <circle cx="6" cy="6" r="4" fill="#bbb" stroke="#999" />
          </svg>
          {' '}Movies ({data.items.length})
        </span>
        <span style={{ marginLeft: 'auto', color: '#888' }}>
          Variance captured: {((data.explained_variance[0] + data.explained_variance[1]) * 100).toFixed(1)}%
          (we're showing a flat shadow of a {data.explained_variance.length > 0 ? '64' : '?'}-dimensional world)
        </span>
      </div>
    </div>
  )
}
