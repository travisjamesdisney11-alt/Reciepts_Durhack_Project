import { useState } from 'react'
import { api } from './api.js'
import ReceiptView from './ReceiptView.jsx'

export default function Scan({ household, onChange }) {
  const [payer, setPayer] = useState(household.members[0]?.id)
  const [receipt, setReceipt] = useState(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const upload = async (file) => {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setBusy(true); setErr(''); setReceipt(null)
    try {
      setReceipt(await api.uploadReceipt(household.id, payer, file))
      onChange()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  const openOld = async (id) => {
    setPreview(null); setErr('')
    try { setReceipt(await api.getReceipt(id)) } catch (e) { setErr(e.message) }
  }

  return (
    <div>
      <section className="card">
        <label>Who paid?
          <select value={payer} onChange={(e) => setPayer(Number(e.target.value))}>
            {household.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        {/* capture="environment" opens the rear camera directly on phones */}
        <label className="upload">
          {busy ? 'Reading receipt…' : '📷 Snap or upload a receipt'}
          <input type="file" accept="image/*" capture="environment" hidden disabled={busy}
                 onChange={(e) => upload(e.target.files[0])} />
        </label>
        {err && <p className="error">{err}</p>}
      </section>

      {receipt && (
        <div className="receipt-layout">
          {preview && <img className="preview" src={preview} alt="receipt" />}
          <ReceiptView receipt={receipt} household={household} onUpdate={(r) => { setReceipt(r); onChange() }} />
        </div>
      )}

      {household.receipts.length > 0 && (
        <section className="card">
          <h2>Past receipts</h2>
          <ul className="plain">
            {household.receipts.slice(0, 10).map((r) => (
              <li key={r.id}>
                <button className="link" onClick={() => openOld(r.id)}>
                  {r.purchased_at || 'no date'} · {r.store} · £{(r.total ?? 0).toFixed(2)}
                </button>{' '}
                <span className={`badge ${r.status}`}>{r.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
