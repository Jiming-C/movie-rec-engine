function StarRating({ score }) {
  const maxStars = 5
  const normalized = Math.max(0, Math.min((score / 6) * 5, maxStars))
  const full = Math.floor(normalized)
  const partial = normalized - full
  const empty = maxStars - full - (partial > 0 ? 1 : 0)

  return (
    <span>
      {Array.from({ length: full }, (_, i) => (
        <span key={`f${i}`} style={{ color: '#daa520' }}>★</span>
      ))}
      {partial > 0 && <span style={{ color: '#ccc' }}>★</span>}
      {Array.from({ length: empty }, (_, i) => (
        <span key={`e${i}`} style={{ color: '#ccc' }}>★</span>
      ))}
      <span style={{ marginLeft: 4, color: '#555' }}>({score.toFixed(1)})</span>
    </span>
  )
}

export default function MovieCard({ movie }) {
  return (
    <tr>
      <td style={{ padding: '3px 6px', borderBottom: '1px solid #d4d0c8' }}>
        <b>{movie.title}</b>
      </td>
      <td style={{ padding: '3px 6px', borderBottom: '1px solid #d4d0c8', fontSize: '10px', color: '#555' }}>
        {movie.genres.split('|').join(', ')}
      </td>
      <td style={{ padding: '3px 6px', borderBottom: '1px solid #d4d0c8', whiteSpace: 'nowrap' }}>
        <StarRating score={movie.predicted_score} />
      </td>
    </tr>
  )
}
