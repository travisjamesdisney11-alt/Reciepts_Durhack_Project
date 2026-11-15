import { useState } from 'react'
import { api } from './api.js'
import Brand from './Brand.jsx'

function validatePassword(password) {
  if ([...password].length < 8) return 'Password must be at least 8 characters'
  if ([...password].length > 128) return 'Password must be no more than 128 characters'
  if (![...password].some((char) => /\p{Lu}/u.test(char))) return 'Password must include an uppercase letter'
  if (![...password].some((char) => /\p{Ll}/u.test(char))) return 'Password must include a lowercase letter'
  if (![...password].some((char) => /[\p{P}\p{S}]/u.test(char))) return 'Password must include a special symbol'
  return ''
}

export default function Auth({ onAuthenticated, initialError = '' }) {
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [name, setName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState(initialError)

  const submit = (action) => async (event) => {
    event.preventDefault()
    if (action === 'register') {
      const passwordError = validatePassword(registerPassword)
      if (passwordError) {
        setError(passwordError)
        return
      }
    }
    setBusy(action)
    setError('')
    try {
      const result = action === 'login'
        ? await api.login({ email: loginEmail, password: loginPassword })
        : await api.register({ name, email: registerEmail, password: registerPassword })
      onAuthenticated(result.token)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="app auth-page">
      <header className="setup-header">
        <Brand />
        <span className="auth-student-note">Made for shared student living</span>
      </header>

      <section className="auth-hero">
        <p className="eyebrow">YOUR HOUSEHOLD, IN FULL COLOUR</p>
        <h1>Make everyday spending feel a little more human.</h1>
        <p>Scan a receipt, split the shop, and watch your household’s week turn into a living landscape.</p>
        <div className="auth-highlights" aria-label="What Receipt Remix does">
          <span>✳ Fair shared costs</span>
          <span>↗ Price changes</span>
          <span>✦ Your spending landscape</span>
        </div>
      </section>

      {error && <p className="error auth-error" role="alert">{error}</p>}

      <div className="auth-options">
        <section className="auth-card login-card" aria-labelledby="login-title">
          <div className="setup-card-icon secondary-icon" aria-hidden="true">↗</div>
          <p className="eyebrow">GOOD TO SEE YOU AGAIN</p>
          <h2 id="login-title">Log in</h2>
          <p className="setup-card-copy">Pick up where your household left off.</p>
          <form onSubmit={submit('login')}>
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              placeholder="you@university.ac.uk"
              required
            />
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              required
            />
            <button className="primary auth-submit" type="submit" disabled={Boolean(busy)}>
              {busy === 'login' ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </section>

        <section className="auth-card register-card" aria-labelledby="register-title">
          <div className="setup-card-icon" aria-hidden="true">✳</div>
          <p className="eyebrow">NEW HERE?</p>
          <h2 id="register-title">Create an account</h2>
          <p className="setup-card-copy">Start with your own login. You can create or join a household next.</p>
          <form onSubmit={submit('register')}>
            <label htmlFor="register-name">Your name</label>
            <input
              id="register-name"
              autoComplete="name"
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Alex"
              required
            />
            <label htmlFor="register-email">Email address</label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              value={registerEmail}
              onChange={(event) => setRegisterEmail(event.target.value)}
              placeholder="you@university.ac.uk"
              required
            />
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              value={registerPassword}
              onChange={(event) => setRegisterPassword(event.target.value)}
              aria-describedby="password-hint"
              required
            />
            <span className="field-hint" id="password-hint">
              At least 8 characters, including an uppercase letter, a lowercase letter, and a special symbol.
            </span>
            <button className="primary auth-submit" type="submit" disabled={Boolean(busy)}>
              {busy === 'register' ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </section>
      </div>

      <p className="setup-privacy"><span aria-hidden="true">✦</span> Your receipts stay with the households you choose.</p>
    </div>
  )
}
