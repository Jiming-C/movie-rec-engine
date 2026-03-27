import { useState, useEffect, useRef } from 'react'

const API = 'http://localhost:8000'

const NARRATION = [
  "The model starts out knowing nothing. It makes random guesses, so the error is very high.",
  "After seeing some data, it starts to learn patterns. The error drops quickly.",
  "It keeps adjusting its internal numbers to make better predictions.",
  "The blue line (training error) keeps going down as it memorizes the training data.",
  "But we also check against data it has NEVER seen (red line). That's the real test.",
  "If the red line stops improving while blue keeps dropping, the model is 'overfitting' -- memorizing instead of learning.",
  "The gap between the lines tells us how well the model generalizes to new data.",
  "Training is done! The model learned to predict movie ratings from user preferences.",
]

export default function TrainingChart() {
  const [history, setHistory] = useState(null)
  const [visibleEpochs, setVisibleEpochs] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [hoveredEpoch, setHoveredEpoch] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    fetch(`${API}/training/history`)
      .then((r) => r.json())
      .then(setHistory)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!playing || !history) return
    if (visibleEpochs >= history.length) {
      setPlaying(false)
      return
    }
    timerRef.current = setTimeout(() => {
      setVisibleEpochs((v) => v + 1)
    }, 400)
    return () => clearTimeout(timerRef.current)
  }, [playing, visibleEpochs, history])

  if (!history) return <div style={{ padding: 8 }}>Loading training data...</div>

  function handlePlay() {
    setVisibleEpochs(0)
    setPlaying(true)
  }

  function handleSkip() {
    setPlaying(false)
    setVisibleEpochs(history.length)
  }

  const visible = history.slice(0, visibleEpochs)
  const current = visible.length > 0 ? visible[visible.length - 1] : null

  // Narration index
  const narIdx = visibleEpochs === 0 ? 0
    : visibleEpochs <= 2 ? 1
    : visibleEpochs <= 5 ? 2
    : visibleEpochs <= 8 ? 3
    : visibleEpochs <= 12 ? 4
    : visibleEpochs <= 15 ? 5
    : visibleEpochs <= 18 ? 6
    : 7

  const W = 680, H = 240, PAD = { top: 20, right: 60, bottom: 30, left: 55 }
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const maxLoss = Math.max(...history.map((h) => h.train_loss))
  const minLoss = Math.min(...history.map((h) => h.train_loss))
  const lossRange = maxLoss - minLoss || 1
  const maxRmse = Math.max(...history.map((h) => h.test_rmse))
  const minRmse = Math.min(...history.map((h) => h.test_rmse))
  const rmseRange = maxRmse - minRmse || 1

  function toX(i) { return PAD.left + (i / (history.length - 1)) * plotW }
  function toLossY(v) { return PAD.top + (1 - (v - minLoss) / lossRange) * plotH }
  function toRmseY(v) { return PAD.top + (1 - (v - minRmse) / rmseRange) * plotH }

  const lossPath = visible.map((h, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toLossY(h.train_loss)}`).join(' ')
  const rmsePath = visible.map((h, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toRmseY(h.test_rmse)}`).join(' ')

  const hovered = hoveredEpoch !== null && hoveredEpoch < visible.length ? visible[hoveredEpoch] : null

  return (
    <div>
      {/* Narration box */}
      <div style={{
        background: '#ffffcc', border: '1px solid #cca700', padding: '6px 10px',
        fontSize: '11px', marginBottom: 8, minHeight: 30,
        transition: 'opacity 0.3s',
      }}>
        <b>&#128161; What's happening:</b>{' '}
        {NARRATION[narIdx]}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
        <button onClick={handlePlay} disabled={playing} style={{
          padding: '3px 12px', background: '#ece9d8', border: '2px outset #d4d0c8',
          fontSize: '11px', fontFamily: 'Tahoma, sans-serif', cursor: playing ? 'default' : 'pointer',
        }}>
          &#9654; {visibleEpochs > 0 ? 'Replay' : 'Watch Training'}
        </button>
        <button onClick={handleSkip} style={{
          padding: '3px 12px', background: '#ece9d8', border: '2px outset #d4d0c8',
          fontSize: '11px', fontFamily: 'Tahoma, sans-serif', cursor: 'pointer',
        }}>
          &#9654;&#9654; Skip to End
        </button>
        {current && (
          <span style={{
            fontSize: '11px', fontWeight: 'bold',
            background: '#fff', border: '1px solid #d4d0c8', padding: '2px 8px',
          }}>
            Epoch {current.epoch}/20 &mdash; Loss: {current.train_loss.toFixed(4)} &mdash; RMSE: {current.test_rmse.toFixed(4)}
          </span>
        )}
        {!current && <span style={{ fontSize: '11px', color: '#888' }}>Press play to watch the model learn!</span>}
      </div>

      {/* Progress bar */}
      <div style={{ background: '#d4d0c8', border: '1px inset #d4d0c8', height: 14, marginBottom: 8 }}>
        <div style={{
          background: 'linear-gradient(180deg, #3a6ea5, #0a246a)',
          height: '100%',
          width: `${(visibleEpochs / history.length) * 100}%`,
          transition: 'width 0.3s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {visibleEpochs > 0 && (
            <span style={{ color: '#fff', fontSize: '9px', fontWeight: 'bold' }}>
              {Math.round((visibleEpochs / history.length) * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: '#fff', border: '2px inset #d4d0c8', padding: 4 }}>
        <svg width={W} height={H} style={{ display: 'block' }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left - PAD.left
            const idx = Math.round((x / plotW) * (history.length - 1))
            if (idx >= 0 && idx < visible.length) setHoveredEpoch(idx)
            else setHoveredEpoch(null)
          }}
          onMouseLeave={() => setHoveredEpoch(null)}
        >
          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1={PAD.left} x2={W - PAD.right}
                y1={PAD.top + f * plotH} y2={PAD.top + f * plotH}
                stroke="#e8e8e8" />
              <text x={PAD.left - 4} y={PAD.top + f * plotH + 3}
                textAnchor="end" fontSize="9" fill="#666">
                {(maxLoss - f * lossRange).toFixed(1)}
              </text>
              <text x={W - PAD.right + 4} y={PAD.top + f * plotH + 3}
                textAnchor="start" fontSize="9" fill="#c00">
                {(maxRmse - f * rmseRange).toFixed(2)}
              </text>
            </g>
          ))}

          {/* Ghost of full chart (faint) */}
          {visibleEpochs < history.length && (
            <g opacity="0.1">
              <path d={history.map((h, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toLossY(h.train_loss)}`).join(' ')}
                fill="none" stroke="#0a246a" strokeWidth="1" />
              <path d={history.map((h, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toRmseY(h.test_rmse)}`).join(' ')}
                fill="none" stroke="#c00" strokeWidth="1" />
            </g>
          )}

          {/* Epoch labels */}
          {history.filter((_, i) => i % 5 === 0 || i === history.length - 1).map((h) => (
            <text key={h.epoch} x={toX(h.epoch - 1)} y={H - 5}
              textAnchor="middle" fontSize="9" fill="#666">{h.epoch}</text>
          ))}

          {/* Animated lines */}
          {visible.length > 1 && (
            <>
              <path d={lossPath} fill="none" stroke="#0a246a" strokeWidth="2.5" />
              <path d={rmsePath} fill="none" stroke="#c00" strokeWidth="2.5" strokeDasharray="5,3" />
            </>
          )}

          {/* Animated points */}
          {visible.map((h, i) => (
            <g key={i}>
              <circle cx={toX(i)} cy={toLossY(h.train_loss)} r={i === visible.length - 1 ? 5 : 3}
                fill="#0a246a" stroke={i === visible.length - 1 ? '#fff' : 'none'} strokeWidth="2">
                {i === visible.length - 1 && (
                  <animate attributeName="r" values="5;7;5" dur="0.8s" repeatCount="indefinite" />
                )}
              </circle>
              <circle cx={toX(i)} cy={toRmseY(h.test_rmse)} r={i === visible.length - 1 ? 5 : 3}
                fill="#c00" stroke={i === visible.length - 1 ? '#fff' : 'none'} strokeWidth="2">
                {i === visible.length - 1 && (
                  <animate attributeName="r" values="5;7;5" dur="0.8s" repeatCount="indefinite" />
                )}
              </circle>
            </g>
          ))}

          {/* Hover */}
          {hovered && (
            <>
              <line x1={toX(hoveredEpoch)} x2={toX(hoveredEpoch)}
                y1={PAD.top} y2={PAD.top + plotH} stroke="#000" strokeDasharray="2,2" opacity="0.3" />
              <rect x={toX(hoveredEpoch) - 60} y={5} width={120} height={14} fill="#ffffcc" stroke="#000" strokeWidth="0.5" rx="1" />
              <text x={toX(hoveredEpoch)} y={15} textAnchor="middle" fontSize="9">
                Epoch {hovered.epoch}: Loss={hovered.train_loss.toFixed(3)} RMSE={hovered.test_rmse.toFixed(3)}
              </text>
            </>
          )}
        </svg>

        <div style={{ display: 'flex', gap: 16, fontSize: '10px', padding: '4px 0 0', justifyContent: 'center' }}>
          <span><span style={{ color: '#0a246a', fontSize: 14 }}>&#9644;</span> Train Loss - how wrong it is on data it's seen</span>
          <span><span style={{ color: '#c00', fontSize: 14 }}>- -</span> Test RMSE - how wrong it is on NEW data</span>
        </div>
      </div>
    </div>
  )
}
