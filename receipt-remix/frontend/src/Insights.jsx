import { useEffect, useState } from 'react'
import { api } from './api.js'

const ESSENTIALS = new Set(['produce', 'dairy_eggs', 'meat_fish', 'bakery', 'frozen', 'cupboard', 'household_cleaning', 'laundry', 'toiletries_personal_care', 'baby_care', 'feminine_care', 'health_medicine', 'pet'])
const ACCENTS = new Set(['drinks', 'alcohol', 'snacks_treats', 'ready_meals'])
const EARTH_PALETTE = ['#839477', '#a8a876', '#667f69', '#bd9668']
const ACCENT_PALETTE = ['#e58057', '#e7b45f', '#6e9fa0', '#ca7565']

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
  const skyColor = movement > 0.5 ? '#e8c89c' : '#bdd3d4'
  const inflationWave = 12 + movement * 38
  const spendMax = Math.max(...categories.map((category) => category.spend), 1)
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
              <stop offset="1" stopColor="#f3dfc5" />
            </linearGradient>
            <linearGradient id="inflation-wave" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#6d9ea1" />
              <stop offset=".58" stopColor="#d7a35f" />
              <stop offset="1" stopColor="#df805b" />
            </linearGradient>
            <clipPath id="landscape-ground">
              <path d="M 0 281 C 140 258 214 307 352 285 S 579 248 710 284 S 827 310 900 270 L 900 440 L 0 440 Z" />
            </clipPath>
            <filter id="landscape-soft"><feGaussianBlur stdDeviation="18" /></filter>
          </defs>
          <rect width="900" height="440" fill="url(#landscape-sky)" />
          <circle cx="707" cy="128" r={86 + movement * 24} fill="#e89562" opacity={0.12 + movement * 0.28} filter="url(#landscape-soft)" />
          <circle cx="172" cy="155" r="96" fill="#fff5df" opacity=".48" />
          <path d="M 0 273 L 120 165 L 214 252 L 343 132 L 496 270 L 624 176 L 765 261 L 836 199 L 900 255 L 900 330 L 0 330 Z" fill="#a3b2a1" opacity=".48" />
          <path d="M 0 298 C 136 244 223 299 354 268 S 588 254 704 279 S 826 294 900 256 L 900 360 L 0 360 Z" fill="#829985" opacity=".72" />
          <path d="M 0 281 C 140 258 214 307 352 285 S 579 248 710 284 S 827 310 900 270 L 900 440 L 0 440 Z" fill="#5f795f" />
          <path d="M 0 344 C 141 325 258 365 389 340 S 647 331 777 354 S 857 355 900 340 L 900 440 L 0 440 Z" fill="#526b55" opacity=".82" />

          <g clipPath="url(#landscape-ground)" opacity=".42">
            {Array.from({ length: 19 }, (_, index) => {
              const x = index * 52
              return <path key={`vertical-${index}`} d={`M ${x} 250 V 445`} stroke="#d7d4a9" strokeWidth="1" />
            })}
            {Array.from({ length: 5 }, (_, index) => {
              const y = 316 + index * 25
              return <path key={`horizontal-${index}`} d={`M 0 ${y} H 900`} stroke="#d7d4a9" strokeWidth="1" />
            })}
            {essentials.map((category, index) => {
              const x = essentials.length === 1 ? 450 : 108 + index * (684 / (essentials.length - 1))
              return <path key={category.category} d={`M ${x} 282 C ${x - 8} 326 ${x + 7} 372 ${x} 440`} fill="none" stroke={categoryColor(category.category, index)} strokeWidth={4 + category.spend / spendMax * 7} opacity=".82" />
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
            const y = 108 + (index % 2) * 44
            const radius = 8 + category.spend / spendMax * 11
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
              const groupIndex = isAccent
                ? accents.findIndex((item) => item.category === category.category)
                : essentials.findIndex((item) => item.category === category.category)
              const groupLength = isAccent ? accents.length : essentials.length
              const left = isAccent
                ? groupLength === 1 ? 50 : 20 + groupIndex * (60 / (groupLength - 1))
                : groupLength === 1 ? 50 : 12 + groupIndex * (76 / (groupLength - 1))
              const top = isAccent ? 25 + (groupIndex % 2) * 10 : 74 + (groupIndex % 2) * 8
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
