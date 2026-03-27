import { useState, useEffect, useRef } from 'react'

const API = 'http://localhost:8000'

const STEPS = [
  {
    title: "Step 1: Who is this user?",
    desc: "Every user gets a secret list of 64 numbers (an \"embedding\"). These numbers capture their taste -- do they like action? comedy? old movies? The model learned these numbers during training.",
  },
  {
    title: "Step 2: What about this movie?",
    desc: "Every movie also gets its own list of 64 numbers. These capture what the movie is like -- how much action, how funny, how artsy, etc.",
  },
  {
    title: "Step 3: Multiply them together",
    desc: "We multiply each user number with the matching movie number, one by one. If both numbers are big and positive, the user and movie agree on that \"taste dimension\" -- that's a strong match!",
  },
  {
    title: "Step 4: Add it all up",
    desc: "We sum all 64 products into a single score. A high score means the user's taste and the movie's qualities line up well. That's our predicted rating!",
  },
  {
    title: "Step 5: Pick the best ones",
    desc: "We do this for EVERY movie in the database, then sort by score. The top results are the recommendations!",
  },
]

export default function ExplainView({ userId }) {
  const [data, setData] = useState(null)
  const [selectedItem, setSelectedItem] = useState(0)
  const [step, setStep] = useState(0)
  const [animDim, setAnimDim] = useState(-1)
  const [runningSum, setRunningSum] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!userId) return
    fetch(`${API}/explain/${userId}?top_n=5`)
      .then((r) => r.json())
      .then((d) => { setData(d); setSelectedItem(0); setStep(0); setAnimDim(-1); setRunningSum(0) })
      .catch(() => {})
  }, [userId])

  // Animate dimension-by-dimension multiplication
  useEffect(() => {
    if (step !== 2 && step !== 3) { setAnimDim(-1); return }
    if (!data) return
    const item = data.items[selectedItem]
    const dims = item.elementwise_product.length

    if (step === 2) {
      // Animate multiplication row by row
      setAnimDim(-1)
      setRunningSum(0)
      let d = 0
      timerRef.current = setInterval(() => {
        if (d >= dims) { clearInterval(timerRef.current); return }
        setAnimDim(d)
        d++
      }, 350)
      return () => clearInterval(timerRef.current)
    }

    if (step === 3) {
      // Animate running sum
      setAnimDim(dims - 1)
      setRunningSum(0)
      let d = 0
      let sum = 0
      timerRef.current = setInterval(() => {
        if (d >= dims) { clearInterval(timerRef.current); return }
        sum += item.elementwise_product[d]
        setRunningSum(sum)
        setAnimDim(d)
        d++
      }, 300)
      return () => clearInterval(timerRef.current)
    }
  }, [step, data, selectedItem])

  if (!userId) return (
    <div style={{
      padding: 20, textAlign: 'center', color: '#666',
      background: '#fff', border: '2px inset #d4d0c8',
    }}>
      <div style={{ fontSize: '24px', marginBottom: 8 }}>&#128064;</div>
      <div style={{ fontSize: '12px' }}>
        <b>Go to the Recommendations tab first!</b><br />
        Search for a movie, then come back here to see how the magic works.
      </div>
    </div>
  )
  if (!data) return <div style={{ padding: 8 }}>Loading explanation...</div>

  const item = data.items[selectedItem]
  const maxAbsVal = Math.max(
    ...item.elementwise_product.map(Math.abs),
    ...data.user_embedding_sample.map(Math.abs),
    ...item.embedding_sample.map(Math.abs),
    0.01,
  )

  function bar(v, color, animated = false) {
    const w = Math.min(Math.abs(v) / maxAbsVal * 80, 80)
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 3,
        transition: animated ? 'opacity 0.3s' : 'none',
      }}>
        <div style={{
          width: animated ? w : w,
          height: 10, background: color || (v >= 0 ? '#3a6ea5' : '#c44'),
          transition: 'width 0.3s',
          border: '1px solid rgba(0,0,0,0.15)',
        }} />
        <span style={{ fontSize: '9px', color: '#555', fontFamily: 'monospace' }}>{v.toFixed(3)}</span>
      </div>
    )
  }

  return (
    <div>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 8 }}>
        {STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            style={{
              flex: 1,
              padding: '4px 2px',
              fontSize: '9px',
              border: '1px solid #aca899',
              background: i === step ? '#3a6ea5' : i < step ? '#c5d9c5' : '#d4d0c8',
              color: i === step ? '#fff' : '#333',
              fontWeight: i === step ? 'bold' : 'normal',
              cursor: 'pointer',
              fontFamily: 'Tahoma, sans-serif',
              transition: 'all 0.2s',
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Narration */}
      <div style={{
        background: '#ffffcc', border: '1px solid #cca700', padding: '8px 12px',
        fontSize: '11px', marginBottom: 8,
      }}>
        <b>{STEPS[step].title}</b><br />
        {STEPS[step].desc}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button disabled={step === 0} onClick={() => setStep(step - 1)} style={{
          padding: '3px 12px', background: '#ece9d8', border: '2px outset #d4d0c8',
          fontSize: '11px', fontFamily: 'Tahoma, sans-serif', cursor: step === 0 ? 'default' : 'pointer',
        }}>&#9664; Back</button>
        <button disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)} style={{
          padding: '3px 12px', background: '#ece9d8', border: '2px outset #d4d0c8',
          fontSize: '11px', fontFamily: 'Tahoma, sans-serif', cursor: step === STEPS.length - 1 ? 'default' : 'pointer',
        }}>Next &#9654;</button>

        {step >= 1 && (
          <select
            value={selectedItem}
            onChange={(e) => { setSelectedItem(Number(e.target.value)); setStep(1) }}
            style={{
              marginLeft: 'auto', fontSize: '10px', fontFamily: 'Tahoma, sans-serif',
              border: '2px inset #d4d0c8', padding: '1px 4px',
            }}
          >
            {data.items.map((it, i) => (
              <option key={it.movieId} value={i}>#{i + 1}: {it.title}</option>
            ))}
          </select>
        )}
      </div>

      {/* Visual content per step */}
      <div style={{ border: '2px inset #d4d0c8', background: '#fff', padding: 10, minHeight: 200 }}>

        {/* Step 1: User embedding */}
        {step === 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: 8 }}>
              &#128100; User {data.user_id}'s taste vector (first 8 of {data.embedding_dim} numbers):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {data.user_embedding_sample.map((v, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  animation: `fadeSlideIn 0.3s ${i * 0.1}s both`,
                }}>
                  <span style={{ fontSize: '9px', color: '#999', fontFamily: 'monospace', width: 20 }}>[{i}]</span>
                  {bar(v, '#3a6ea5')}
                  {i === 0 && <span style={{ fontSize: '9px', color: '#888', marginLeft: 8 }}>&larr; maybe "likes action"?</span>}
                  {i === 1 && <span style={{ fontSize: '9px', color: '#888', marginLeft: 8 }}>&larr; maybe "likes comedy"?</span>}
                  {i === 2 && <span style={{ fontSize: '9px', color: '#888', marginLeft: 8 }}>&larr; maybe "likes old movies"?</span>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: '10px', color: '#888', fontStyle: 'italic' }}>
              We don't know exactly what each number means -- the model figured them out on its own!
            </div>
          </div>
        )}

        {/* Step 2: Item embedding */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: 8 }}>
              &#127916; "{item.title}" taste vector:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {item.embedding_sample.map((v, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  animation: `fadeSlideIn 0.3s ${i * 0.1}s both`,
                }}>
                  <span style={{ fontSize: '9px', color: '#999', fontFamily: 'monospace', width: 20 }}>[{i}]</span>
                  {bar(v, '#2a7a2a')}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Multiply */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: 8 }}>
              Multiplying user &times; movie, dimension by dimension:
            </div>
            <table style={{ borderCollapse: 'collapse', fontSize: '10px', width: '100%' }}>
              <thead>
                <tr style={{ background: '#ece9d8' }}>
                  <th style={{ padding: '2px 4px', border: '1px solid #d4d0c8', width: 30 }}>Dim</th>
                  <th style={{ padding: '2px 4px', border: '1px solid #d4d0c8' }}>&#128100; User</th>
                  <th style={{ padding: '2px 4px', border: '1px solid #d4d0c8', width: 20 }}>&times;</th>
                  <th style={{ padding: '2px 4px', border: '1px solid #d4d0c8' }}>&#127916; Movie</th>
                  <th style={{ padding: '2px 4px', border: '1px solid #d4d0c8', width: 20 }}>=</th>
                  <th style={{ padding: '2px 4px', border: '1px solid #d4d0c8' }}>Result</th>
                </tr>
              </thead>
              <tbody>
                {data.user_embedding_sample.map((uv, i) => {
                  const visible = i <= animDim
                  const active = i === animDim
                  return (
                    <tr key={i} style={{
                      background: active ? '#ffffcc' : visible ? (i % 2 === 0 ? '#fff' : '#f8f7f2') : '#eee',
                      opacity: visible ? 1 : 0.3,
                      transition: 'all 0.3s',
                    }}>
                      <td style={{ padding: '2px 4px', fontFamily: 'monospace', color: '#999', border: '1px solid #eee' }}>[{i}]</td>
                      <td style={{ padding: '2px 4px', border: '1px solid #eee' }}>{bar(uv, '#3a6ea5', true)}</td>
                      <td style={{ padding: '2px 4px', textAlign: 'center', border: '1px solid #eee', fontWeight: active ? 'bold' : 'normal', fontSize: active ? '14px' : '10px' }}>&times;</td>
                      <td style={{ padding: '2px 4px', border: '1px solid #eee' }}>{bar(item.embedding_sample[i], '#2a7a2a', true)}</td>
                      <td style={{ padding: '2px 4px', textAlign: 'center', border: '1px solid #eee' }}>=</td>
                      <td style={{ padding: '2px 4px', border: '1px solid #eee' }}>
                        {visible ? bar(item.elementwise_product[i], item.elementwise_product[i] >= 0 ? '#d4a44c' : '#c44', true) : '?'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {animDim >= 0 && animDim < data.user_embedding_sample.length && (
              <div style={{ marginTop: 6, fontSize: '10px', background: '#ffffcc', border: '1px solid #cca700', padding: '3px 8px' }}>
                &#9997; {data.user_embedding_sample[animDim].toFixed(3)} &times; {item.embedding_sample[animDim].toFixed(3)} = <b>{item.elementwise_product[animDim].toFixed(4)}</b>
                {item.elementwise_product[animDim] > 0.1 && ' -- Strong positive match!'}
                {item.elementwise_product[animDim] < -0.1 && ' -- Mismatch on this dimension'}
                {Math.abs(item.elementwise_product[animDim]) <= 0.1 && ' -- Weak signal here'}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Sum */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: 8 }}>
              Adding up all the products into one score:
            </div>

            {/* Running sum visualization */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10,
              padding: 8, background: '#f5f4ee', border: '1px solid #d4d0c8',
            }}>
              {item.elementwise_product.map((v, i) => (
                <div key={i} style={{
                  width: 60, padding: '2px 4px', fontSize: '9px',
                  textAlign: 'center', fontFamily: 'monospace',
                  background: i <= animDim ? (v >= 0 ? '#d5f5d5' : '#fde8e8') : '#eee',
                  border: i === animDim ? '2px solid #000' : '1px solid #d4d0c8',
                  transition: 'all 0.2s',
                  opacity: i <= animDim ? 1 : 0.3,
                }}>
                  {v >= 0 ? '+' : ''}{v.toFixed(3)}
                </div>
              ))}
            </div>

            {/* Big running total */}
            <div style={{
              textAlign: 'center', padding: 12,
              background: 'linear-gradient(180deg, #f5f4ee, #ece9d8)',
              border: '2px groove #d4d0c8',
            }}>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: 4 }}>
                Running total (first 8 of {data.embedding_dim} dimensions):
              </div>
              <div style={{
                fontSize: '28px', fontWeight: 'bold', fontFamily: 'monospace',
                color: '#0a246a',
                transition: 'all 0.3s',
              }}>
                {runningSum.toFixed(4)}
              </div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: 4 }}>
                Full dot product across all {data.embedding_dim} dims = <b>{item.dot_product.toFixed(4)}</b>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Ranking */}
        {step === 4 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: 8 }}>
              Final ranking for User {data.user_id}:
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #d4d0c8' }}>
              <thead>
                <tr style={{ background: '#ece9d8' }}>
                  <th style={{ padding: '3px 6px', border: '1px solid #d4d0c8', width: 30 }}>Rank</th>
                  <th style={{ padding: '3px 6px', border: '1px solid #d4d0c8', textAlign: 'left' }}>Movie</th>
                  <th style={{ padding: '3px 6px', border: '1px solid #d4d0c8' }}>Dot Product Score</th>
                  <th style={{ padding: '3px 6px', border: '1px solid #d4d0c8' }}>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((it, i) => (
                  <tr key={it.movieId} style={{
                    animation: `fadeSlideIn 0.4s ${i * 0.15}s both`,
                    background: i === 0 ? '#fffce0' : i % 2 === 0 ? '#fff' : '#f8f7f2',
                  }}>
                    <td style={{ padding: '3px 6px', textAlign: 'center', border: '1px solid #eee', fontWeight: 'bold' }}>
                      {i === 0 ? '\u{1F3C6}' : `#${i + 1}`}
                    </td>
                    <td style={{ padding: '3px 6px', border: '1px solid #eee' }}>
                      <b>{it.title}</b>
                    </td>
                    <td style={{ padding: '3px 6px', textAlign: 'center', border: '1px solid #eee', fontFamily: 'monospace' }}>
                      {it.dot_product.toFixed(4)}
                      <div style={{
                        background: '#3a6ea5',
                        height: 6,
                        width: `${(it.dot_product / data.items[0].dot_product) * 100}%`,
                        marginTop: 2,
                        transition: 'width 0.5s',
                      }} />
                    </td>
                    <td style={{ padding: '3px 6px', textAlign: 'center', border: '1px solid #eee', fontSize: '9px' }}>
                      {i === 0 ? 'Best match!' : it.dot_product > data.items[0].dot_product * 0.95 ? 'Very close!' : 'Good match'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 8, fontSize: '10px', color: '#888', fontStyle: 'italic' }}>
              The model does this for all {Object.keys(data.items).length > 0 ? '9,000+' : ''} movies instantly, then picks the top results.
            </div>
          </div>
        )}
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
