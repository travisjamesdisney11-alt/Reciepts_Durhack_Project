import { useEffect, useState } from 'react'
import { api } from './api.js'
import Setup from './Setup.jsx'
import Scan from './Scan.jsx'
import Balances from './Balances.jsx'
import Insights from './Insights.jsx'
import Auth from './Auth.jsx'
import Brand from './Brand.jsx'
import InviteCode from './InviteCode.jsx'

const TABS = ['Scan', 'Balances', 'Insights']

function loadSaved() {
  try { return localStorage.getItem('householdId') } catch { return null }
}
function save(id) {
  try { id ? localStorage.setItem('householdId', id) : localStorage.removeItem('householdId') } catch {}
}
function loadToken() {
  try { return localStorage.getItem('receiptRemixToken') } catch { return null }
}
function saveToken(token) {
  try { token ? localStorage.setItem('receiptRemixToken', token) : localStorage.removeItem('receiptRemixToken') } catch {}
}

export default function App() {
  const [token, setToken] = useState(loadToken)
  const [account, setAccount] = useState(null)
  const [households, setHouseholds] = useState([])
  const [authLoading, setAuthLoading] = useState(() => Boolean(loadToken()))
  const [household, setHousehold] = useState(null)
  const [showSetup, setShowSetup] = useState(false)
  const [tab, setTab] = useState('Scan')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return undefined
    let active = true
    setAuthLoading(true)
    const restoreSession = async () => {
      try {
        const profile = await api.me()
        if (!active) return
        setAccount(profile)
        setHouseholds(profile.households)
        const savedId = loadSaved()
        const selected = profile.households.find((item) => String(item.id) === savedId)
          ?? (profile.households.length === 1 ? profile.households[0] : null)
        if (selected) {
          const current = await api.getHousehold(selected.id)
          if (!active) return
          setHousehold(current)
          save(current.id)
          setShowSetup(false)
        } else {
          setHousehold(null)
          save(null)
          setShowSetup(true)
        }
        setError('')
      } catch (requestError) {
        if (!active) return
        saveToken(null)
        api.setToken(null)
        save(null)
        setToken(null)
        setAccount(null)
        setHouseholds([])
        setHousehold(null)
        setError(requestError.message)
      } finally {
        if (active) setAuthLoading(false)
      }
    }
    restoreSession()
    return () => { active = false }
  }, [token])

  const load = async (id) => {
    try {
      const h = await api.getHousehold(id)
      setHousehold(h)
      save(h.id)
      setError('')
      setShowSetup(false)
    } catch (e) {
      setError(e.message)
      if (!household) save(null)
    }
  }

  const activateHousehold = async (nextHousehold) => {
    setHousehold(nextHousehold)
    save(nextHousehold.id)
    setShowSetup(false)
    setError('')
    try {
      const profile = await api.me()
      setAccount(profile)
      setHouseholds(profile.households)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const signOut = async () => {
    let signOutError = ''
    try {
      await api.logout()
    } catch (requestError) {
      signOutError = requestError.message
    }
    saveToken(null)
    api.setToken(null)
    save(null)
    setToken(null)
    setAccount(null)
    setHouseholds([])
    setHousehold(null)
    setShowSetup(false)
    setError(signOutError)
  }

  if (!token) return <Auth onAuthenticated={(value) => { api.setToken(value); saveToken(value); setToken(value); setError('') }} initialError={error} />
  if (authLoading || !account) return <p className="muted card">Loading your account…</p>
  if (!household || showSetup) {
    return (
      <Setup
        currentHousehold={household}
        households={households}
        onCancel={() => setShowSetup(false)}
        onReady={activateHousehold}
        onSelectHousehold={load}
        onLogout={signOut}
        error={error}
      />
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <Brand onClick={(event) => { event.preventDefault(); setTab('Scan') }} />
        <div className="household-chip">
          <span className="status-dot" />
          <span>{household.name}</span>
          <span className="chip-divider" />
          <span>{household.members.map((m) => m.name).join(' · ')}</span>
        </div>
        <button className="link switch-link" onClick={() => { setError(''); setShowSetup(true) }}>Switch household</button>
        <button className="link sign-out-link" onClick={signOut}>Sign out</button>
      </header>
      {household.invite_code && <InviteCode code={household.invite_code} />}
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
