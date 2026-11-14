import { useEffect, useState } from 'react'
import { api } from './api.js'

const ESSENTIALS = new Set(['produce', 'dairy_eggs', 'meat_fish', 'bakery', 'frozen', 'cupboard', 'household_cleaning', 'laundry', 'toiletries_personal_care', 'baby_care', 'feminine_care', 'health_medicine', 'pet'])
const ACCENTS = new Set(['drinks', 'alcohol', 'snacks_treats', 'ready_meals'])
const EARTH_PALETTE = ['#bd7861', '#d2a15f', '#9c7488', '#967e72']
const ACCENT_PALETTE = ['#e47761', '#eab753', '#718fa0', '#ce7180']

function categoryLabel(category) {
  return String(category).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function categoryColor(category, index) {
  if (ACCENTS.has(category)) return ACCENT_PALETTE[['snacks_treats', 'alcohol', 'drinks', 'ready_meals'].indexOf(category)]
  if (ESSENTIALS.has(category)) {
    const paletteIndex = ['produce', 'dairy_eggs', 'bakery', 'meat_fish'].indexOf(category)
    return EARTH_PALETTE[paletteIndex < 0 ? index % EARTH_PALETTE.length : paletteIndex]
  }
  return EARTH_PALETTE[index % EARTH_PALETTE.length]
}

function smoothPath(points) {
  if (points.length < 2) return ''

  return points.slice(0, -1).reduce((path, point, index) => {
    const next = points[index + 1]
    const previous = points[Math.max(0, index - 1)]
    const afterNext = points[Math.min(points.length - 1, index + 2)]
    const control1 = {
      x: point.x + (next.x - previous.x) / 6,
      y: point.y + (next.y - previous.y) / 6,
    }
    const control2 = {
      x: next.x - (afterNext.x - point.x) / 6,
      y: next.y - (afterNext.y - point.y) / 6,
    }
    const start = index === 0 ? `M ${point.x} ${point.y}` : path
    return `${start} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${next.x} ${next.y}`
  }, '')
}

// Keep the supporting charts lightweight; the tapestry is drawn from the same API data.
function Bars({ rows, label, value }) {
  const max = Math.max(...rows.map((r) => r[value]), 1)
  return (
    <div className="bars">
      {rows.map((r) => (
        <div key={r[label]} className="bar-row">
          <span className="bar-label">{String(r[label]).replace(/_/g, ' ')}</span>
          <span className="bar" style={{ width: `${(r[value] / max) * 100}%` }} />
          <span className="bar-value">£{r[value].toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}

function Tapestry({ rows, priceChanges }) {
  const categories = [...rows].sort((a, b) => b.spend - a.spend)
  const essentials = categories.filter((category) => !ACCENTS.has(category.category))
  const accents = categories.filter((category) => ACCENTS.has(category.category))
  const largestCategory = categories[0] ? categoryLabel(categories[0].category).toLowerCase() : 'everyday moments'
  const movement = Math.min(1, Math.max(0, ...priceChanges.map((item) =>
    item.unit_price_change_pct ?? item.price_change_pct ?? 0
  )) / 30)
  const skyColor = movement > 0.5 ? '#d98e8d' : '#bba8d1'
  const inflationWave = 12 + movement * 38
  const spendMax = Math.max(...categories.map((category) => category.spend), 1)
  const terrainPoints = essentials.map((category, index) => ({
    category,
    x: essentials.length === 1 ? 450 : 108 + index * (684 / (essentials.length - 1)),
    y: 310 - (category.spend / spendMax) * 100,
  }))
  const terrainCurvePoints = [{ x: 0, y: 310 }, ...terrainPoints, { x: 900, y: 310 }]
  const terrainLine = smoothPath(terrainCurvePoints)
  const terrainArea = terrainLine
    ? `${terrainLine} L 900 440 L 0 440 Z`
    : 'M 0 310 L 900 310 L 900 440 L 0 440 Z'
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.category ?? null)
  const [hoveredCategory, setHoveredCategory] = useState(null)
  const activeCategory = hoveredCategory ?? selectedCategory
  const activeRow = categories.find((category) => category.category === activeCategory)
  const activeTrends = priceChanges.filter((change) => change.category === activeCategory)

  return (
    <>
      <section className="tapestry-card">
        <div className="tapestry-copy">
          <div className="tapestry-kicker"><span className="live-dot" /> YOUR LIVING SPENDING LANDSCAPE</div>
          <h2>A landscape shaped by<br />{largestCategory} & everything else.</h2>
          <p>Essentials build the ground. Little treats rise above it. Changing prices shift the horizon.</p>
          <p className="landscape-hint">Hover, tap or focus a marker to explore its category.</p>
          <div className="landscape-key" aria-label="Landscape visual key">
            <span><i className="key-ground" /> Essentials</span>
            <span><i className="key-accent" /> Treats &amp; drinks</span>
            <span><i className="key-wave" /> Price trend</span>
            <span className="height-key">Higher ground = more essentials spend</span>
          </div>
          <div className="tapestry-legend" role="group" aria-label="Spending categories">
            {categories.map((category, index) => {
              const color = categoryColor(category.category, index)
              return (
                <button
                  type="button"
                  className="legend-item category-legend-item"
                  key={category.category}
                  style={{ '--category-color': color }}
                  aria-pressed={selectedCategory === category.category}
                  onMouseEnter={() => setHoveredCategory(category.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onFocus={() => setHoveredCategory(category.category)}
                  onBlur={() => setHoveredCategory(null)}
                  onClick={() => setSelectedCategory((current) => current === category.category ? null : category.category)}
                >
                  <i />
                  {categoryLabel(category.category)}
                </button>
              )
            })}
          </div>
        </div>
        <div className="tapestry-art">
          <svg viewBox="0 0 900 440" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="landscape-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={skyColor} />
              <stop offset=".38" stopColor="#dfa0b0" />
              <stop offset=".7" stopColor="#f39b75" />
              <stop offset=".9" stopColor="#ffd083" />
              <stop offset="1" stopColor="#ffe4a5" />
            </linearGradient>
            <linearGradient id="inflation-wave" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#8887b1" />
              <stop offset=".58" stopColor="#efb45e" />
              <stop offset="1" stopColor="#e47768" />
            </linearGradient>
            <radialGradient id="sunset-sun" cx=".35" cy=".28" r=".8">
              <stop offset="0" stopColor="#fff5bf" />
              <stop offset=".7" stopColor="#ffc66f" />
              <stop offset="1" stopColor="#f28a69" />
            </radialGradient>
            <clipPath id="sunset-disc">
              <circle cx="620" cy="210" r="52" />
            </clipPath>
            <clipPath id="landscape-ground">
              <path d={terrainArea} />
            </clipPath>
            <filter id="landscape-soft"><feGaussianBlur stdDeviation="18" /></filter>
          </defs>
          <rect width="900" height="440" fill="url(#landscape-sky)" />
          <circle cx="620" cy="210" r={84 + movement * 18} fill="#ff9b72" opacity={0.2 + movement * 0.2} filter="url(#landscape-soft)" />
          <circle cx="620" cy="210" r="52" fill="url(#sunset-sun)" />
          <g clipPath="url(#sunset-disc)" opacity=".34">
            <path d="M 565 211 H 675 M 565 222 H 675 M 565 233 H 675" stroke="#d86e6d" strokeWidth="3" />
          </g>
          <path d="M 0 273 L 120 165 L 214 252 L 343 132 L 496 270 L 624 176 L 765 261 L 836 199 L 900 255 L 900 330 L 0 330 Z" fill="#b09abf" opacity=".68" />
          <path d="M 0 298 C 136 244 223 299 354 268 S 588 254 704 279 S 826 294 900 256 L 900 360 L 0 360 Z" fill="#c47d83" opacity=".88" />
          <path d={terrainArea} fill="#80677d" />
          <path d={terrainLine || 'M 0 310 L 900 310'} fill="none" stroke="#f0c77e" strokeWidth="2" opacity=".86" />
          <path d="M 0 344 C 141 325 258 365 389 340 S 647 331 777 354 S 857 355 900 340 L 900 440 L 0 440 Z" fill="#5c5068" opacity=".9" />

          <g clipPath="url(#landscape-ground)" opacity=".42">
            {Array.from({ length: 19 }, (_, index) => {
              const x = index * 52
              return <path key={`vertical-${index}`} d={`M ${x} 250 V 445`} stroke="#d7d4a9" strokeWidth="1" />
            })}
            {Array.from({ length: 5 }, (_, index) => {
              const y = 316 + index * 25
              return <path key={`horizontal-${index}`} d={`M 0 ${y} H 900`} stroke="#d7d4a9" strokeWidth="1" />
            })}
            {terrainPoints.map(({ category, x, y }, index) => {
              return <path key={category.category} d={`M ${x} ${y + 3} C ${x - 8} 342 ${x + 7} 390 ${x} 440`} fill="none" stroke={categoryColor(category.category, index)} strokeWidth={4 + category.spend / spendMax * 7} opacity=".82" />
            })}
          </g>

          <path d={`M 0 245 C 130 ${245 - inflationWave}, 224 ${252 + inflationWave}, 360 240 S 612 ${236 - inflationWave}, 740 248 S 838 ${258 + inflationWave}, 900 236`}
            fill="none" stroke="url(#inflation-wave)" strokeWidth={2 + movement * 5} opacity={0.38 + movement * 0.46} />
          <path d={`M 0 252 C 130 ${252 - inflationWave}, 224 ${259 + inflationWave}, 360 247 S 612 ${243 - inflationWave}, 740 255 S 838 ${265 + inflationWave}, 900 243`}
            fill="none" stroke="#fff4dc" strokeWidth="1.5" opacity=".75" />

          {priceChanges.slice(0, 7).map((change, index) => {
            const x = 94 + index * 112
            const y = 238 + Math.sin(index * 1.7) * inflationWave * 0.45
            return <circle key={change.product} cx={x} cy={y} r={3 + movement * 3} fill={movement > 0.35 ? '#dd8358' : '#6d9ea1'} opacity=".8" />
          })}

          {accents.map((category, index) => {
            const x = accents.length === 1 ? 450 : 180 + index * (540 / (accents.length - 1))
            const spendRatio = category.spend / spendMax
            const y = 178 - spendRatio * 58
            const radius = 8 + spendRatio * 11
            const color = categoryColor(category.category, index)
            return (
              <g key={category.category}>
                <path d={`M ${x} ${y + radius} Q ${x - 20} ${y + 61} ${x + (index % 2 ? 34 : -28)} ${y + 95}`} fill="none" stroke={color} strokeWidth="2" strokeDasharray="3 7" opacity=".7" />
                <circle cx={x} cy={y} r={radius + 7} fill={color} opacity=".15" />
                <circle cx={x} cy={y} r={radius} fill={color} stroke="#fff7e7" strokeWidth="3" />
                {index % 2 === 0 && <path d={`M ${x + radius + 8} ${y - radius} l 7 -7 l 7 7 l -7 7 Z`} fill="#e8b75f" stroke="#fff7e7" strokeWidth="2" />}
              </g>
            )
          })}
          </svg>
          <div className="landscape-hotspots" role="group" aria-label="Select a category marker on the spending landscape">
            {categories.map((category, index) => {
              const isAccent = ACCENTS.has(category.category)
              const accentIndex = accents.findIndex((item) => item.category === category.category)
              const terrainPoint = terrainPoints.find((point) => point.category.category === category.category)
              const accentX = accents.length === 1 ? 450 : 180 + accentIndex * (540 / (accents.length - 1))
              const accentY = 178 - (category.spend / spendMax) * 58
              const left = (isAccent ? accentX : terrainPoint?.x ?? 450) / 900 * 100
              const top = (isAccent ? accentY : terrainPoint?.y ?? 310) / 440 * 100
              const color = categoryColor(category.category, index)
              return (
                <button
                  type="button"
                  key={category.category}
                  className={`landscape-hotspot${activeCategory === category.category ? ' selected' : ''}${isAccent ? ' accent' : ' essential'}`}
                  style={{ left: `${left}%`, top: `${top}%`, '--category-color': color }}
                  aria-label={`${categoryLabel(category.category)}, £${category.spend.toFixed(2)} spent`}
                  aria-pressed={selectedCategory === category.category}
                  onMouseEnter={() => setHoveredCategory(category.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onFocus={() => setHoveredCategory(category.category)}
                  onBlur={() => setHoveredCategory(null)}
                  onClick={() => setSelectedCategory((current) => current === category.category ? null : category.category)}
                >
                  <span className="hotspot-marker">{index + 1}</span>
                  <span className="hotspot-label">{categoryLabel(category.category)}</span>
                </button>
              )
            })}
          </div>
          <span className="art-note">ESSENTIALS BELOW <span>·</span> PRICE TIDE ABOVE</span>
        </div>
      </section>
      {activeRow && (
        <section className="category-detail" aria-live="polite">
          <div className="category-summary">
            <span className="category-detail-swatch" style={{ '--category-color': categoryColor(activeRow.category, categories.indexOf(activeRow)), backgroundColor: categoryColor(activeRow.category, categories.indexOf(activeRow)) }} />
            <div>
              <p className="eyebrow">LANDSCAPE MARKER {categories.indexOf(activeRow) + 1}</p>
              <h3>{categoryLabel(activeRow.category)}</h3>
            </div>
            <div className="category-total">
              <strong>£{activeRow.spend.toFixed(2)}</strong>
              <span>tracked spend</span>
            </div>
          </div>
          <div className="category-trends">
            <p className="eyebrow">PRICE TRENDS IN THIS CATEGORY</p>
            {activeTrends.length > 0 ? (
              <ul>
                {activeTrends.slice(0, 3).map((trend) => {
                  const change = trend.unit_price_change_pct ?? trend.price_change_pct
                  return (
                    <li key={trend.product}>
                      <span><b>{trend.product}</b><small>{trend.first_date} → {trend.last_date}</small></span>
                      <span className={change > 0 ? 'neg' : change < 0 ? 'pos' : ''}>
                        {change > 0 ? '+' : ''}{change ?? '—'}{change == null ? '' : '%'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="no-category-trend">No repeat-item price trend in this category yet. Scan another receipt to reveal how its prices move.</p>
            )}
          </div>
        </section>
      )}
    </>
  )
}

export default function Insights({ household }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api.insights(household.id).then(setData).catch((e) => setError(e.message))
  }, [household.id])
  if (error) return <p className="error card">{error}</p>
  if (!data) return <p className="muted card">Gathering your household's latest picture…</p>

  const shrunk = data.price_changes.filter((c) => c.shrinkflation)
  return (
    <div>
      <Tapestry rows={data.spend_by_category} priceChanges={data.price_changes} />
      <div className="insight-intro">
        <div>
          <p className="eyebrow">THE STORY IN YOUR RECEIPTS</p>
          <h2>Small details, bigger picture.</h2>
        </div>
        <p>Patterns to help your household spend with a little more intention.</p>
      </div>
      {shrunk.map((c) => (
        <section key={c.product} className="card alert shrink-alert">
          <span className="alert-icon">↗</span>
          <div>
            <h2>Shrinkflation spotted</h2>
            <p><b>{c.product}</b> still costs £{c.last_price.toFixed(2)}, but you now get less:
              the price per {c.unit_basis} is up <b>{c.unit_price_change_pct}%</b> since {c.first_date}.</p>
          </div>
        </section>
      ))}
      <section className="card chart-card">
        <div className="section-title"><div><p className="eyebrow">WHERE IT GOES</p><h2>Spend by category</h2></div><span className="section-mark">01</span></div>
        <Bars rows={data.spend_by_category} label="category" value="spend" />
      </section>
      <section className="card chart-card">
        <div className="section-title"><div><p className="eyebrow">THE RHYTHM</p><h2>Spend by week</h2></div><span className="section-mark">02</span></div>
        <Bars rows={data.spend_by_week} label="week" value="spend" />
      </section>
      <section className="card chart-card">
        <div className="section-title"><div><p className="eyebrow">THE LITTLE SHIFTS</p><h2>Price changes</h2></div><span className="section-mark">03</span></div>
        <table>
          <thead><tr><th>Product</th><th>Then</th><th>Now</th><th>Per-unit change</th></tr></thead>
          <tbody>
            {data.price_changes.slice(0, 10).map((c) => (
              <tr key={c.product}>
                <td>{c.product}</td>
                <td>£{c.first_price.toFixed(2)}</td>
                <td>£{c.last_price.toFixed(2)}</td>
                <td className={(c.unit_price_change_pct ?? c.price_change_pct) > 0 ? 'neg' : 'pos'}>
                  {(c.unit_price_change_pct ?? c.price_change_pct) > 0 ? '+' : ''}{c.unit_price_change_pct ?? c.price_change_pct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
