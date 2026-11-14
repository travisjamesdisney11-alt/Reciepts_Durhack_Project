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
      <header className="app-header">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setTab('Scan') }}>
          <span className="brand-mark" aria-hidden="true">r.</span>
          <span>receipt<span className="brand-light">remix</span></span>
        </a>
        <div className="household-chip">
          <span className="status-dot" />
          <span>{household.name}</span>
          <span className="chip-divider" />
          <span>{household.members.map((m) => m.name).join(' · ')}</span>
        </div>
        <button className="link switch-link" onClick={() => { setHousehold(null); save(null) }}>Switch household</button>
      </header>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR HOUSEHOLD, IN FULL COLOUR</p>
          <h1>{tab === 'Scan' ? 'Make a receipt mean more.' : tab === 'Insights' ? 'Your week, remixed.' : 'Keep things fair.'}</h1>
          <p className="page-intro">{tab === 'Scan' ? 'Turn the little things you buy into a picture of everyday life.' : tab === 'Insights' ? 'A living picture of what you spend, and how prices are moving.' : 'A clear view of who paid and who owes what.'}</p>
        </div>
        <div className="week-label"><span className="week-spark" aria-hidden="true">✳</span> A better picture of spending</div>
      </div>
      <nav className="main-nav" aria-label="Main navigation">
        {TABS.map((t) => (
          <button key={t} className={t === tab ? 'tab active' : 'tab'} onClick={() => setTab(t)}>
            <span className={`nav-icon nav-icon-${t.toLowerCase()}`} aria-hidden="true">{t === 'Scan' ? '＋' : t === 'Balances' ? '↗' : '✳'}</span>
            {t}
          </button>
        ))}
      </nav>
      <main className="main-content">
        {tab === 'Scan' && <Scan household={household} onChange={() => load(household.id)} />}
        {tab === 'Balances' && <Balances household={household} />}
        {tab === 'Insights' && <Insights household={household} />}
      </main>
      <footer className="app-footer">
        <span>Made from the everyday.</span>
        <span>Receipt Remix <span className="footer-dot">·</span> {household.name}</span>
      </footer>
    </div>
  )
}
