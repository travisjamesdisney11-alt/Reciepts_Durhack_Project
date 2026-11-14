import { useEffect, useState } from 'react'
import { api } from './api.js'

// Shows extracted items, lets the user fix misreads, ask the LLM for a split,
// adjust it with checkboxes, and confirm. Nothing is charged until Confirm.
export default function ReceiptView({ receipt, household, onUpdate }) {
  const members = household.members
  const [assign, setAssign] = useState({})   // item_id -> Set(member_id)
  const [reasons, setReasons] = useState({})
  const [questions, setQuestions] = useState([])
  const [instruction, setInstruction] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    const a = {}
    for (const it of receipt.items) {
      a[it.id] = new Set(it.member_ids.length ? it.member_ids : members.map((m) => m.id))
    }
    setAssign(a); setReasons({}); setQuestions([])
  }, [receipt.id])

  const toggle = (itemId, memberId) => {
    setAssign((prev) => {
      const s = new Set(prev[itemId])
      s.has(memberId) ? s.delete(memberId) : s.add(memberId)
      return { ...prev, [itemId]: s }
    })
  }

  const propose = async () => {
    setBusy(true); setErr('')
    try {
      const p = await api.proposeSplit(receipt.id, instruction || 'Everything is shared equally')
      const a = { ...assign }, r = {}
      for (const x of p.assignments) { a[x.item_id] = new Set(x.member_ids); r[x.item_id] = x.reason }
      setAssign(a); setReasons(r); setQuestions(p.questions)
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  const confirm = async () => {
    setBusy(true); setErr('')
    try {
      const assignments = Object.entries(assign).map(([id, s]) => ({ item_id: Number(id), member_ids: [...s] }))
      onUpdate(await api.confirmSplit(receipt.id, assignments))
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  const fixPrice = async (item) => {
    const v = window.prompt(`Correct price for "${item.name}" (printed: ${item.raw_text})`, item.price)
    if (v === null || isNaN(parseFloat(v))) return
    onUpdate(await api.editItem(item.id, { price: parseFloat(v) }))
  }

  // Live preview of what each person owes for this receipt.
  const owes = Object.fromEntries(members.map((m) => [m.id, 0]))
  for (const it of receipt.items) {
    const s = assign[it.id]
    if (s && s.size) for (const mid of s) owes[mid] += it.price / s.size
  }

  return (
    <section className="card receipt">
      <h2>{receipt.store} <span className="muted">{receipt.purchased_at}</span></h2>
      {!receipt.total_matches && (
        <p className="warn">Items add up to £{receipt.items_sum.toFixed(2)} but the receipt says £{(receipt.total ?? 0).toFixed(2)}. Check the highlighted lines.</p>
      )}
      <table>
        <thead>
          <tr><th>Item</th><th>£</th>{members.map((m) => <th key={m.id}>{m.name}</th>)}</tr>
        </thead>
        <tbody>
          {receipt.items.map((it) => (
            <tr key={it.id} className={it.needs_check ? 'check' : ''}>
              <td>
                <div>{it.name}</div>
                <div className="raw">{it.raw_text} · {it.category?.replace(/_/g, ' ')}</div>
                {reasons[it.id] && <div className="reason">↳ {reasons[it.id]}</div>}
              </td>
              <td>
                <button className="link" title="Fix price" onClick={() => fixPrice(it)}>{it.price.toFixed(2)}</button>
                {it.discount > 0 && <div className="raw">−{it.discount.toFixed(2)}</div>}
              </td>
              {members.map((m) => (
                <td key={m.id} className="center">
                  <input type="checkbox" checked={assign[it.id]?.has(m.id) || false} onChange={() => toggle(it.id, m.id)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td>Share</td><td>{receipt.items_sum.toFixed(2)}</td>
            {members.map((m) => <td key={m.id} className="center">{owes[m.id].toFixed(2)}</td>)}</tr>
        </tfoot>
      </table>

      <div className="split-box">
        <textarea rows={2} value={instruction} onChange={(e) => setInstruction(e.target.value)}
                  placeholder="e.g. Sam didn't have the chicken, the wine is just me and Priya" />
        <button onClick={propose} disabled={busy}>{busy ? 'Thinking…' : '✨ Suggest split'}</button>
      </div>
      {questions.length > 0 && (
        <ul className="questions">{questions.map((q, i) => <li key={i}>❓ {q}</li>)}</ul>
      )}
      <button className="primary" onClick={confirm} disabled={busy}>
        {receipt.status === 'confirmed' ? 'Update split' : 'Confirm split'}
      </button>
      {err && <p className="error">{err}</p>}
    </section>
  )
}
