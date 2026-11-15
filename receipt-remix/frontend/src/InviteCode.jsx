import { useState } from 'react'

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Fall back for local-network pages without clipboard permission.
    }
  }

  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.appendChild(field)
  try {
    field.select()
    if (!document.execCommand('copy')) {
      throw new Error('Clipboard copy was not available')
    }
  } finally {
    field.remove()
  }
}

export default function InviteCode({ code }) {
  const [message, setMessage] = useState('')

  const copy = async () => {
    try {
      await copyText(code)
      setMessage('Copied to clipboard')
    } catch {
      setMessage('Could not copy. Select the code and copy it manually.')
    }
  }

  return (
    <aside className="invite-code-panel" aria-label="Household invite">
      <div>
        <p className="eyebrow invite-code-label">INVITE HOUSEMATES</p>
        <p className="invite-code-description">They can create an account or log in, then use this code to join.</p>
      </div>
      <div className="invite-code-actions">
        <code aria-label="Household invite code">{code}</code>
        <button type="button" className="invite-code-button" onClick={copy}>
          Copy code
        </button>
      </div>
      <span className="invite-code-status" role="status" aria-live="polite">{message}</span>
    </aside>
  )
}
