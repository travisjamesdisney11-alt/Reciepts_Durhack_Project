import { useEffect, useState } from 'react'
import { api } from './api.js'
import Setup from './Setup.jsx'
import Scan from './Scan.jsx'
import Balances from './Balances.jsx'
import Insights from './Insights.jsx'

const TABS = ['Scan', 'Balances', 'Insights']

function loadSaved() {
  try { return localStorage.getItem('householdId') } catch { return null }
}
function save(id) {
  try { id ? localStorage.setItem('householdId', id) : localStorage.removeItem('householdId') } catch {}
}

export default function App() {
  const [household, setHousehold] = useState(null)
  const [tab, setTab] = useState('Scan')
  const [error, setError] = useState('')

  const load = async (id) => {
    try {
      const h = await api.getHousehold(id)
      setHousehold(h)
      save(h.id)
    } catch (e) {
      setError(e.message)
      save(null)
    }
  }

  useEffect(() => {
    const id = loadSaved()
    if (id) load(id)
  }, [])

  if (!household) return <Setup onReady={(h) => { setHousehold(h); save(h.id) }} onLoad={load} error={error} />

  return (
    <div className="app">
      <header>
        <h1>Receipt Remix</h1>
        <span className="muted">{household.name} · {household.members.map((m) => m.name).join(', ')}</span>
        <button className="link" onClick={() => { setHousehold(null); save(null) }}>switch</button>
      </header>
      <nav>
        {TABS.map((t) => (
          <button key={t} className={t === tab ? 'tab active' : 'tab'} onClick={() => setTab(t)}>{t}</button>
        ))}
      </nav>
      <main>
        {tab === 'Scan' && <Scan household={household} onChange={() => load(household.id)} />}
        {tab === 'Balances' && <Balances household={household} />}
        {tab === 'Insights' && <Insights household={household} />}
      </main>
    </div>
  )
}
