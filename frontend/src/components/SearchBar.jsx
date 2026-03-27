import { useState, useEffect, useRef } from 'react'

const API = 'http://localhost:8000'

export default function SearchBar({ onRecommendations, onLoading, onError, onUserId }) {
  const [movies, setMovies] = useState([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    fetch(`${API}/movies`)
      .then((r) => r.json())
      .then(setMovies)
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = query.length >= 2
    ? movies.filter((m) => m.title.toLowerCase().includes(query.toLowerCase())).slice(0, 50)
    : []

  async function handleSelect(movie) {
    setQuery(movie.title)
    setOpen(false)
    onLoading(true)
    onError(null)
    try {
      const res = await fetch(`${API}/movies/${movie.movieId}/users`)
      const { user_ids } = await res.json()
      onUserId?.(user_ids[0])
      const recRes = await fetch(`${API}/recommend/${user_ids[0]}?top_n=10`)
      if (!recRes.ok) throw new Error('Failed to fetch recommendations')
      const recs = await recRes.json()
      onRecommendations(recs)
    } catch (e) {
      onError(e.message)
      onRecommendations([])
    } finally {
      onLoading(false)
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <label style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Movie name:</label>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder=""
          style={{
            flex: 1,
            padding: '2px 4px',
            border: '2px inset #d4d0c8',
            background: '#fff',
            fontSize: '11px',
            fontFamily: 'Tahoma, sans-serif',
            outline: 'none',
          }}
        />
        <button
          style={{
            padding: '2px 12px',
            background: '#ece9d8',
            border: '2px outset #d4d0c8',
            fontSize: '11px',
            fontFamily: 'Tahoma, sans-serif',
            cursor: 'pointer',
          }}
          onClick={() => {
            if (filtered.length > 0) handleSelect(filtered[0])
          }}
        >
          Search
        </button>
      </div>
      {open && filtered.length > 0 && (
        <ul style={{
          position: 'absolute',
          zIndex: 10,
          top: '100%',
          left: 0,
          right: 0,
          maxHeight: 200,
          overflowY: 'auto',
          background: '#fff',
          border: '1px solid #000',
          margin: 0,
          padding: 0,
          listStyle: 'none',
          fontSize: '11px',
        }}>
          {filtered.map((m) => (
            <li
              key={m.movieId}
              onClick={() => handleSelect(m)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0a246a'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff'
                e.currentTarget.style.color = '#000'
              }}
              style={{
                padding: '2px 4px',
                cursor: 'pointer',
                color: '#000',
                background: '#fff',
              }}
            >
              {m.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
