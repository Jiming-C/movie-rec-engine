import { useState } from 'react'
import SearchBar from './components/SearchBar'
import RecommendationList from './components/RecommendationList'
import TrainingChart from './components/TrainingChart'
import ExplainView from './components/ExplainView'
import EmbeddingMap from './components/EmbeddingMap'

function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <img
        src="data:image/gif;base64,R0lGODlhEAAQAPIAAP///2ZmZszMzJmZmTMzMwAAAAAAAAAAACH5BAkKAAUALAAAAAAQABAAAAMuWLrc/jDKSWepNAKQK9dAYA1kKI5kaZ5oq64hex4yvM50bd94ru98DzgcTiQCADs="
        alt="Loading..."
        style={{ display: 'inline' }}
      />
      <span style={{ marginLeft: 6 }}>Loading... Please wait.</span>
    </div>
  )
}

const TABS = [
  { id: 'search', label: 'Recommendations' },
  { id: 'training', label: 'Training Curves' },
  { id: 'explain', label: 'How It Works' },
  { id: 'embeddings', label: 'Embedding Map' },
]

export default function App() {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('search')
  const [userId, setUserId] = useState(null)

  function handleRecommendations(recs) {
    setRecommendations(recs)
  }

  return (
    <div style={{ background: '#ece9d8', minHeight: '100vh' }}>
      {/* Title bar */}
      <div style={{
        background: 'linear-gradient(180deg, #0a246a 0%, #3a6ea5 100%)',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '13px',
        padding: '4px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span>&#127916;</span>
        MovieMatch - Movie Recommendation System
      </div>

      {/* Menu bar */}
      <div style={{
        background: '#ece9d8',
        borderBottom: '1px solid #aca899',
        padding: '2px 6px',
        fontSize: '11px',
      }}>
        <span style={{ textDecoration: 'underline', marginRight: 12 }}>File</span>
        <span style={{ textDecoration: 'underline', marginRight: 12 }}>Edit</span>
        <span style={{ textDecoration: 'underline', marginRight: 12 }}>View</span>
        <span style={{ textDecoration: 'underline', marginRight: 12 }}>Help</span>
      </div>

      <div style={{ padding: '12px 16px', maxWidth: 760, margin: '0 auto', paddingBottom: 40 }}>
        {/* Tab strip */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 0 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '4px 14px',
                fontSize: '11px',
                border: '1px solid #aca899',
                borderBottom: activeTab === tab.id ? '1px solid #f5f4ee' : '1px solid #aca899',
                background: activeTab === tab.id ? '#f5f4ee' : '#d4d0c8',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                cursor: 'pointer',
                marginBottom: -1,
                position: 'relative',
                zIndex: activeTab === tab.id ? 1 : 0,
                fontFamily: 'Tahoma, sans-serif',
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content area */}
        <div style={{
          border: '1px solid #aca899',
          background: '#f5f4ee',
          padding: 12,
          minHeight: 300,
        }}>
          {/* === Recommendations tab === */}
          {activeTab === 'search' && (
            <div>
              <fieldset style={{
                border: '2px groove #d4d0c8',
                padding: '8px 12px',
                marginBottom: 12,
                background: '#f5f4ee',
              }}>
                <legend style={{ fontSize: '11px', fontWeight: 'bold', padding: '0 4px' }}>
                  Search for a Movie
                </legend>
                <SearchBar
                  onRecommendations={handleRecommendations}
                  onLoading={setLoading}
                  onError={setError}
                  onUserId={setUserId}
                />
              </fieldset>

              {loading && <Spinner />}

              {error && (
                <div style={{
                  border: '2px groove #d4d0c8', background: '#fff',
                  padding: 8, color: 'red', fontWeight: 'bold', marginBottom: 12,
                }}>
                  &#9888; Error: {error}
                </div>
              )}

              {!loading && !error && recommendations.length > 0 && (
                <fieldset style={{
                  border: '2px groove #d4d0c8',
                  padding: '8px 12px',
                  background: '#f5f4ee',
                }}>
                  <legend style={{ fontSize: '11px', fontWeight: 'bold', padding: '0 4px' }}>
                    Recommendations ({recommendations.length} results)
                  </legend>
                  <RecommendationList recommendations={recommendations} />
                </fieldset>
              )}
            </div>
          )}

          {/* === Training Curves tab === */}
          {activeTab === 'training' && <TrainingChart />}

          {/* === How It Works tab === */}
          {activeTab === 'explain' && <ExplainView userId={userId} />}

          {/* === Embedding Map tab === */}
          {activeTab === 'embeddings' && <EmbeddingMap />}
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#ece9d8',
        borderTop: '2px groove #d4d0c8',
        padding: '2px 8px',
        fontSize: '11px',
        color: '#333',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>{activeTab === 'search' ? 'Ready' : `Viewing: ${TABS.find((t) => t.id === activeTab)?.label}`}</span>
        <span>Powered by PyTorch &amp; FastAPI</span>
      </div>
    </div>
  )
}
