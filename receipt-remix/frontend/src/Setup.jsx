import { useState } from 'react'
import { api } from './api.js'

export default function Setup({ onReady, onLoad, error }) {
  const [name, setName] = useState('Flat 4')
  const [members, setMembers] = useState('Alex, Sam, Priya')
  const [existing, setExisting] = useState('')
  const [err, setErr] = useState(error)

  const create = async () => {
    try {
      const list = members.split(',').map((s) => s.trim()).filter(Boolean)
      if (list.length < 2) return setErr('Add at least two people')
      onReady(await api.createHousehold(name, list))
    } catch (e) { setErr(e.message) }
  }

  return (
    <div className="app setup">
      <h1>Receipt Remix</h1>
      <p className="muted">Snap the receipt. Say who had what. Done.</p>
      <section className="card">
        <h2>New household</h2>
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>People (comma separated)<input value={members} onChange={(e) => setMembers(e.target.value)} /></label>
        <button className="primary" onClick={create}>Create</button>
      </section>
      <section className="card">
        <h2>Open existing</h2>
        <label>Household ID<input value={existing} onChange={(e) => setExisting(e.target.value)} placeholder="e.g. 1 (the seeded demo flat)" /></label>
        <button onClick={() => existing && onLoad(existing)}>Open</button>
      </section>
      {err && <p className="error">{err}</p>}
    </div>
  )
}
