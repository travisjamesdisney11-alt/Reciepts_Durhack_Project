import { useEffect, useState } from 'react'
import { api } from './api.js'

function pricePerLabel(basis) {
  return basis === 'each' ? 'each' : basis
}

export default function NearbyPrices({ householdId }) {
  const [status, setStatus] = useState(null)
  const [enabled, setEnabled] = useState(false)
  const [areaCode, setAreaCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const hasUnsavedChanges = Boolean(status && (
    enabled !== status.enabled
    || (enabled && areaCode.trim().toUpperCase() !== (status.area_code ?? ''))
  ))

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    api.nearbyPrices(householdId)
      .then((result) => {
        if (!active) return
        setStatus(result)
        setEnabled(result.enabled)
        setAreaCode(result.area_code ?? '')
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [householdId])

  const saveConsent = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const result = await api.setNearbyPriceConsent(householdId, {
        enabled,
        area_code: enabled ? areaCode : null,
      })
      setStatus(result)
      setEnabled(result.enabled)
      setAreaCode(result.area_code ?? '')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card nearby-prices-card" aria-labelledby="nearby-prices-heading">
      <div className="section-title">
        <div>
          <p className="eyebrow">OPTIONAL · COARSE-AREA DATA</p>
          <h2 id="nearby-prices-heading">Compare nearby prices</h2>
        </div>
        <span className="section-mark" aria-hidden="true">↔</span>
      </div>
      <p className="nearby-prices-intro">
        See typical prices for products your household has bought, using recent confirmed receipts
        from the same postcode district.
      </p>
      <p className="nearby-prices-privacy">
        Sharing is off by default. We use only high-confidence unit prices from confirmed GBP receipts.
        No exact location, store name, receipt date, or household identity appears in comparisons.
        Results contain aggregate medians and ranges from at least five other households, each counted once.
        Housemates in your household are one household, not separate comparison samples; your own household is excluded.
        Saving your choice starts comparisons right away. One account’s opt-in is enough for your household’s
        prices to join the shared pool. If multiple accounts opt in, they must use the same postcode district.
        You can revoke this account’s opt-in at any time; household sharing stops when no active opt-ins remain.
      </p>

      {loading ? (
        <p className="muted" role="status">Checking nearby comparison settings…</p>
      ) : error ? (
        <p className="error nearby-prices-error" role="alert">{error}</p>
      ) : (
        <>
          <form className="nearby-prices-form" onSubmit={saveConsent}>
            <label className="nearby-consent-toggle">
              <input
                type="checkbox"
                checked={enabled}
                disabled={saving}
                onChange={(event) => setEnabled(event.target.checked)}
              />
              <span>Allow this household’s confirmed prices to contribute to pooled local averages.</span>
            </label>
            {enabled && (
              <label className="nearby-area-field">
                Postcode district
                <input
                  type="text"
                  value={areaCode}
                  onChange={(event) => setAreaCode(event.target.value)}
                  placeholder="e.g. DH1"
                  aria-describedby="nearby-area-hint"
                  autoComplete="off"
                  autoCapitalize="characters"
                  maxLength={4}
                  pattern="([A-Za-z]{1,2}[0-9][A-Za-z0-9]?|[Gg][Ii][Rr])"
                  required
                  disabled={saving}
                />
                <span className="field-hint" id="nearby-area-hint">
                  Enter only the district (such as DH1), not your full postcode. We don’t request GPS.
                </span>
              </label>
            )}
            <button type="submit" className="nearby-save-button" disabled={saving}>
              {saving ? 'Saving…' : 'Save privacy choice'}
            </button>
          </form>

          {hasUnsavedChanges && (
            <p className="nearby-prices-state" role="status">
              {status.enabled && !enabled
                ? 'Your current sharing choice stays active until you save this change.'
                : 'This is an unsaved choice. No setting changes until you save it.'}
            </p>
          )}
          {!hasUnsavedChanges && status?.enabled && status.contribution_ready && (
            <p className="nearby-prices-state" role="status">
              Comparisons are active for you, and your household’s prices are included in pooled local averages.
            </p>
          )}
          {!hasUnsavedChanges && status?.enabled && !status.contribution_ready && (
            <p className="nearby-prices-state" role="status">
              Comparisons are active for you. Household prices aren’t shared while opted-in accounts use different
              postcode districts.
            </p>
          )}
          {!hasUnsavedChanges && status?.state === 'insufficient_local_data' && (
            <p className="nearby-prices-state" role="status">
              There isn’t enough recent matching data yet. Comparisons appear only when at least
              {` ${status.min_households} other households `}have eligible prices from the last {status.lookback_days} days.
            </p>
          )}
          {!hasUnsavedChanges && status?.state === 'not_opted_in' && (
            <p className="nearby-prices-state" role="status">
              {status.contribution_ready
                ? 'Your account has not opted in to comparisons, but household prices are included in pooled local averages through another opted-in account.'
                : 'Your account has not opted in. Household prices remain out of the shared pool until an account opts in.'}
            </p>
          )}
          {!hasUnsavedChanges && status?.state === 'available' && (
            <div className="nearby-comparisons" aria-live="polite">
              <p className="nearby-prices-state">
                {status.area_code} district · recent {status.lookback_days}-day data
              </p>
              <ul>
                {status.comparisons.map((comparison) => {
                  const direction = comparison.difference_pct > 0
                    ? 'above'
                    : comparison.difference_pct < 0
                      ? 'below'
                      : 'the same as'
                  return (
                    <li key={`${comparison.product}-${comparison.unit_basis}`}>
                      <div>
                        <strong>{comparison.product}</strong>
                        <span className="nearby-price-detail">
                          Your household £{comparison.household_unit_price.toFixed(2)} / {pricePerLabel(comparison.unit_basis)}
                          {' · '}nearby median £{comparison.nearby_median_unit_price.toFixed(2)} / {pricePerLabel(comparison.unit_basis)}
                        </span>
                        <span className="nearby-price-detail">
                          Typical range £{comparison.nearby_lower_quartile.toFixed(2)}–£{comparison.nearby_upper_quartile.toFixed(2)}
                          {' · '}{comparison.household_count} other households
                        </span>
                      </div>
                      <span className="nearby-price-difference">
                        {comparison.difference_pct === 0
                          ? 'Same as nearby median'
                          : `${Math.abs(comparison.difference_pct)}% ${direction}`}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}
