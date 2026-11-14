import { useEffect, useState } from 'react'
import { api } from './api.js'

export default function Setup({ currentHousehold, onCancel, onReady, onLoad, error }) {
  const [name, setName] = useState('')
  const [members, setMembers] = useState([{ id: 1, name: '' }])
  const [nextMemberId, setNextMemberId] = useState(2)
  const [existing, setExisting] = useState('')
  const [err, setErr] = useState(error)
  const [busy, setBusy] = useState(false)

  useEffect(() => setErr(error), [error])

  const create = async (event) => {
    event.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const list = members.map((member) => member.name.trim()).filter(Boolean)
      if (!name.trim()) {
        setErr('Give your household a name to get started.')
        return
      }
      if (list.length < 2) {
        setErr('Add at least two housemates, separated by commas.')
        return
      }
      onReady(await api.createHousehold(name.trim(), list))
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const updateMember = (id, value) => {
    setMembers((current) => current.map((member) =>
      member.id === id ? { ...member, name: value } : member
    ))
  }

  const addMember = () => {
    setMembers((current) => [...current, { id: nextMemberId, name: '' }])
    setNextMemberId((current) => current + 1)
  }

  const removeMember = (id) => {
    setMembers((current) => current.filter((member) => member.id !== id))
  }

  const openExisting = async (event) => {
    event.preventDefault()
    if (!existing.trim()) return
    setBusy(true)
    setErr('')
    try {
      await onLoad(existing.trim())
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app setup">
      <header className="setup-header">
        <a className="brand" href="#" onClick={(event) => event.preventDefault()}>
          <span className="brand-mark" aria-hidden="true">r.</span>
          <span>receipt<span className="brand-light">remix</span></span>
        </a>
        {currentHousehold && (
          <button className="link" onClick={onCancel}>Back to {currentHousehold.name}</button>
        )}
      </header>

      <section className="setup-hero">
        <p className="eyebrow">{currentHousehold ? 'YOUR HOUSEHOLD' : 'A LITTLE BETTER TOGETHER'}</p>
        <h1>{currentHousehold ? 'Where to next?' : 'Start a tapestry together.'}</h1>
        <p>{currentHousehold
          ? `You’re currently with ${currentHousehold.name}. Create a new home or open a demo household.`
          : 'Bring your housemates together to scan receipts, split fairly, and see your shared story take shape.'}</p>
      </section>

      {err && <p className="error setup-error" role="alert">{err}</p>}

      <div className="setup-options">
        <section className="setup-card create-household">
          <div className="setup-card-icon" aria-hidden="true">✳</div>
          <p className="eyebrow">MAKE A NEW SHARED SPACE</p>
          <h2>Create a household</h2>
          <p className="setup-card-copy">Give your place a name and add the people who share the receipts.</p>
          <form onSubmit={create}>
            <label>
              Household name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Our Durham house" />
            </label>
            <div className="member-fields" role="group" aria-label="Housemate names">
              {members.map((member, index) => (
                <div className="member-field-row" key={member.id}>
                  <label htmlFor={`housemate-${member.id}`}>
                    Housemate {index + 1}
                    <input
                      id={`housemate-${member.id}`}
                      value={member.name}
                      onChange={(e) => updateMember(member.id, e.target.value)}
                      placeholder={index === 0 ? 'e.g. Alex' : `Housemate ${index + 1}`}
                    />
                  </label>
                  {index > 0 && (
                    <button
                      className="remove-member"
                      type="button"
                      aria-label={`Remove housemate ${index + 1}`}
                      onClick={() => removeMember(member.id)}
                    >−</button>
                  )}
                </div>
              ))}
              <button className="add-member" type="button" onClick={addMember}>
                <span aria-hidden="true">+</span> Add housemate
              </button>
              <span className="field-hint">Add at least two housemates to create a shared household.</span>
            </div>
            <button className="primary setup-submit" type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create household'}
            </button>
          </form>
        </section>

        <section className="setup-card join-household">
          <div className="setup-card-icon secondary-icon" aria-hidden="true">↗</div>
          <p className="eyebrow">ALREADY HAVE A HOUSEHOLD?</p>
          <h2>Open a demo household</h2>
          <p className="setup-card-copy">For this demo, enter the household ID shared by your project team.</p>
          <form onSubmit={openExisting}>
            <label>
              Demo household ID
              <input value={existing} onChange={(e) => setExisting(e.target.value)} placeholder="e.g. 1" />
            </label>
            <button className="setup-submit" type="submit" disabled={busy || !existing.trim()}>
              {busy ? 'Opening…' : 'Open household'}
            </button>
          </form>
          <p className="demo-note">Household IDs are for the demo; invite links aren’t available yet.</p>
        </section>
      </div>

      <p className="setup-privacy"><span aria-hidden="true">✦</span> Shared with your household, never a judgment. Start with one receipt and see where it takes you.</p>
    </div>
  )
}
