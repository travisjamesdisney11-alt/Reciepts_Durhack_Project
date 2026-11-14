import { useEffect, useState } from 'react'
import { api } from './api.js'

export default function Balances({ household }) {
  const [data, setData] = useState(null)
  useEffect(() => { api.balances(household.id).then(setData) }, [household.id])
  if (!data) return <p className="muted">Loading…</p>

  return (
    <div>
      <section className="card">
        <h2>Settle up</h2>
        {data.settle_up.length === 0
          ? <p className="muted">All square 🎉</p>
          : <ul className="plain">{data.settle_up.map((t, i) => (
              <li key={i} className="transfer"><b>{t.from}</b> pays <b>{t.to}</b> <span className="amount">£{t.amount.toFixed(2)}</span></li>
            ))}</ul>}
      </section>
      <section className="card">
        <h2>Running balances</h2>
        <ul className="plain">{data.net.map((n) => (
          <li key={n.member}>{n.member}: <span className={n.balance >= 0 ? 'pos' : 'neg'}>
            {n.balance >= 0 ? 'is owed' : 'owes'} £{Math.abs(n.balance).toFixed(2)}</span></li>
        ))}</ul>
      </section>
    </div>
  )
}
