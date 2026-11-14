import { useEffect, useState } from 'react'
import { api } from './api.js'

// Simple CSS bar charts so there are no chart dependencies to fight with.
// TODO (insights owner): basket portraits (p5.js) and the business dashboard.
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

export default function Insights({ household }) {
  const [data, setData] = useState(null)
  useEffect(() => { api.insights(household.id).then(setData) }, [household.id])
  if (!data) return <p className="muted">Loading…</p>

  const shrunk = data.price_changes.filter((c) => c.shrinkflation)
  return (
    <div>
      {shrunk.map((c) => (
        <section key={c.product} className="card alert">
          <h2>🕵️ Shrinkflation spotted</h2>
          <p><b>{c.product}</b> still costs £{c.last_price.toFixed(2)}, but you now get less:
            the price per {c.unit_basis} is up <b>{c.unit_price_change_pct}%</b> since {c.first_date}.</p>
        </section>
      ))}
      <section className="card">
        <h2>Spend by category</h2>
        <Bars rows={data.spend_by_category} label="category" value="spend" />
      </section>
      <section className="card">
        <h2>Spend by week</h2>
        <Bars rows={data.spend_by_week} label="week" value="spend" />
      </section>
      <section className="card">
        <h2>Price changes</h2>
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
