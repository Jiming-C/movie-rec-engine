import MovieCard from './MovieCard'

export default function RecommendationList({ recommendations }) {
  return (
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      background: '#fff',
      border: '2px inset #d4d0c8',
      fontSize: '11px',
    }}>
      <thead>
        <tr style={{ background: '#ece9d8', textAlign: 'left' }}>
          <th style={{ padding: '3px 6px', borderBottom: '2px groove #d4d0c8', fontWeight: 'bold' }}>Title</th>
          <th style={{ padding: '3px 6px', borderBottom: '2px groove #d4d0c8', fontWeight: 'bold' }}>Genre</th>
          <th style={{ padding: '3px 6px', borderBottom: '2px groove #d4d0c8', fontWeight: 'bold' }}>Score</th>
        </tr>
      </thead>
      <tbody>
        {recommendations.map((movie) => (
          <MovieCard key={movie.movieId} movie={movie} />
        ))}
      </tbody>
    </table>
  )
}
