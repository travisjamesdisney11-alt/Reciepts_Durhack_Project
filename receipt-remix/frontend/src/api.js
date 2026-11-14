// Thin wrapper around the FastAPI backend. Every call returns parsed JSON or throws.
async function req(path, opts = {}) {
  const res = await fetch(`/api${path}`, opts)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.detail || `Request failed (${res.status})`)
  return body
}
const json = (method, data) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})

export const api = {
  createHousehold: (name, members) => req('/households', json('POST', { name, members })),
  getHousehold: (id) => req(`/households/${id}`),
  uploadReceipt: (householdId, payerId, file) => {
    const fd = new FormData()
    fd.append('household_id', householdId)
    fd.append('payer_id', payerId)
    fd.append('file', file)
    return req('/receipts', { method: 'POST', body: fd })
  },
  getReceipt: (id) => req(`/receipts/${id}`),
  editItem: (id, changes) => req(`/items/${id}`, json('PATCH', changes)),
  proposeSplit: (id, instruction) => req(`/receipts/${id}/propose-split`, json('POST', { instruction })),
  confirmSplit: (id, assignments) => req(`/receipts/${id}/split`, json('PUT', { assignments })),
  balances: (id) => req(`/households/${id}/balances`),
  insights: (id) => req(`/households/${id}/insights`),
}
