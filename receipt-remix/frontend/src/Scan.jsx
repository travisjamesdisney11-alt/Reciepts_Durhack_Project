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
        <p className="payer-label" id="payer-label">Who paid for this shop?</p>
        <div className="payer-options" role="group" aria-labelledby="payer-label">
          {household.members.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`payer-option${payer === m.id ? ' selected' : ''}`}
              aria-pressed={payer === m.id}
              onClick={() => setPayer(m.id)}
            >
              <span className="payer-avatar" aria-hidden="true">{m.name.trim().charAt(0).toUpperCase()}</span>
              <span>{m.name}</span>
              {payer === m.id && <span className="payer-check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
        {/* capture="environment" opens the rear camera directly on phones */}
        <label className="upload">
          {busy ? 'Reading receipt…' : '📷 Snap or upload a receipt'}
          <input type="file" accept="image/*" capture="environment" hidden disabled={busy}
                 onChange={(e) => upload(e.target.files[0])} />
        </label>
        {err && <p className="error">{err}</p>}
      </section>

      {receipt && (
        <div className={preview ? 'receipt-layout' : 'receipt-layout no-preview'}>
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
