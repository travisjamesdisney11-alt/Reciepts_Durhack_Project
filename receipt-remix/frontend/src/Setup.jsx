import { useEffect, useState } from 'react'
import { api } from './api.js'
import Brand from './Brand.jsx'
import InviteCode from './InviteCode.jsx'

export default function Setup({
  currentHousehold,
  households = [],
  onCancel,
  onReady,
  onSelectHousehold,
  onLogout,
  error,
}) {
  const [name, setName] = useState('')
  const [existing, setExisting] = useState('')
  const [err, setErr] = useState(error)
  const [busy, setBusy] = useState(false)

  useEffect(() => setErr(error), [error])

  const create = async (event) => {
    event.preventDefault()
    setBusy(true)
    setErr('')
    try {
      if (!name.trim()) {
        setErr('Give your household a name to get started.')
        return
      }
      onReady(await api.createHousehold(name.trim()))
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const openExisting = async (event) => {
    event.preventDefault()
    if (!existing.trim()) return
    setBusy(true)
    setErr('')
    try {
      onReady(await api.joinHousehold(existing.trim()))
    } catch (requestError) {
      setErr(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app setup">
      <header className="setup-header">
        <Brand />
        <div className="setup-header-actions">
          {currentHousehold && (
            <button className="link" onClick={onCancel}>Back to {currentHousehold.name}</button>
          )}
          <button className="link" onClick={onLogout}>Sign out</button>
        </div>
      </header>

      <section className="setup-hero">
        <p className="eyebrow">{currentHousehold ? 'YOUR HOUSEHOLD' : 'YOUR ACCOUNT IS READY'}</p>
        <h1>{currentHousehold ? 'Where to next?' : 'Create or join a household.'}</h1>
        <p>{currentHousehold
          ? `You’re currently with ${currentHousehold.name}. Create a new home or join another shared space.`
          : 'Create a shared home, then invite housemates with a short code. They’ll be added as members when they join.'}</p>
      </section>

      {currentHousehold?.invite_code && (
        <InviteCode code={currentHousehold.invite_code} />
      )}

      {err && <p className="error setup-error" role="alert">{err}</p>}

      {households.length > 0 && (
        <section className="setup-households" aria-labelledby="households-title">
          <p className="eyebrow">YOUR SHARED SPACES</p>
          <h2 id="households-title">Open a household</h2>
          <div className="household-list">
            {households.map((item) => (
              <button
                type="button"
                className="household-choice"
                key={item.id}
                onClick={() => onSelectHousehold(item.id)}
              >
                <span>{item.name}</span>
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="setup-options">
        <section className="setup-card create-household">
          <div className="setup-card-icon" aria-hidden="true">✳</div>
          <p className="eyebrow">MAKE A NEW SHARED SPACE</p>
          <h2>Create a household</h2>
          <p className="setup-card-copy">You’ll be the first member. After creation, share your 7-character invite code so housemates can join.</p>
          <form onSubmit={create}>
            <label>
              Household name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Our Durham house" />
            </label>
            <button className="primary setup-submit" type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create household'}
            </button>
          </form>
        </section>

        <section className="setup-card join-household">
          <div className="setup-card-icon secondary-icon" aria-hidden="true">↗</div>
          <p className="eyebrow">ALREADY HAVE A SHARED SPACE?</p>
          <h2>Join a household</h2>
          <p className="setup-card-copy">Enter the 7-character code. You’ll be added to the household automatically.</p>
          <form onSubmit={openExisting}>
            <label>
              Household invite code
              <input
                value={existing}
                onChange={(e) => setExisting(e.target.value)}
                placeholder="e.g. AB3K7XM"
                maxLength={7}
                autoCapitalize="characters"
                autoComplete="off"
              />
            </label>
            <button className="setup-submit" type="submit" disabled={busy || existing.trim().length !== 7}>
              {busy ? 'Joining…' : 'Join household'}
            </button>
          </form>
          <p className="demo-note">Ask a housemate to copy their invite code from the app and send it to you.</p>
        </section>
      </div>

      <p className="setup-privacy"><span aria-hidden="true">✦</span> Shared with your household, never a judgment. Start with one receipt and see where it takes you.</p>
    </div>
  )
}
