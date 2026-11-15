import { useState } from 'react'
import { api } from './api.js'

export default function LocalPriceFinder({ householdId }) {
  const [postcode, setPostcode] = useState('')
  const [postcodeConsent, setPostcodeConsent] = useState(false)
  const [shops, setShops] = useState(null)
  const [shopsLoading, setShopsLoading] = useState(false)
  const [shopsError, setShopsError] = useState('')
  const [product, setProduct] = useState('')
  const [onlineOffers, setOnlineOffers] = useState(null)
  const [offersLoading, setOffersLoading] = useState(false)
  const [offersError, setOffersError] = useState('')

  const searchShops = async (event) => {
    event.preventDefault()
    setShopsLoading(true)
    setShopsError('')
    setShops(null)
    try {
      setShops(await api.nearbyShops(householdId, postcode))
    } catch (requestError) {
      setShopsError(requestError.message)
    } finally {
      setPostcodeConsent(false)
      setShopsLoading(false)
    }
  }

  const searchOffers = async (event) => {
    event.preventDefault()
    setOffersLoading(true)
    setOffersError('')
    setOnlineOffers(null)
    try {
      setOnlineOffers(await api.onlineOffers(householdId, product))
    } catch (requestError) {
      setOffersError(requestError.message)
    } finally {
      setOffersLoading(false)
    }
  }

  return (
    <section className="card local-price-finder-card" aria-labelledby="local-price-finder-heading">
      <div className="section-title">
        <div>
          <p className="eyebrow">LOCAL LOOKUP · ONLINE OFFERS</p>
          <h2 id="local-price-finder-heading">Find shops and compare online</h2>
        </div>
        <span className="section-mark" aria-hidden="true">⌖</span>
      </div>
      <p className="local-price-finder-intro">
        Find mapped food shops within 5 km of a full postcode, then search UK online offers separately.
        Online prices are not prices at those nearby branches.
      </p>

      <div className="local-price-finder-grid">
        <section className="local-price-pane" aria-labelledby="nearby-shops-heading">
          <h3 id="nearby-shops-heading">Nearby shop locations</h3>
          <form className="local-price-form" onSubmit={searchShops}>
            <label>
              Full UK postcode
              <input
                type="text"
                value={postcode}
                onChange={(event) => setPostcode(event.target.value)}
                placeholder="e.g. DH1 1AB"
                autoComplete="postal-code"
                autoCapitalize="characters"
                maxLength={8}
                pattern="([A-Za-z]{1,2}[0-9][A-Za-z0-9]?\s?[0-9][A-Za-z]{2}|[Gg][Ii][Rr]\s?0[Aa][Aa])"
                required
                disabled={shopsLoading}
              />
            </label>
            <label className="local-location-consent">
              <input
                type="checkbox"
                checked={postcodeConsent}
                onChange={(event) => setPostcodeConsent(event.target.checked)}
                required
                disabled={shopsLoading}
              />
              <span>
                Use this postcode for this lookup. It is sent to Postcodes.io; the resulting coordinates
                are sent to OpenStreetMap. Receipt Remix does not save either to your account or database.
              </span>
            </label>
            <button type="submit" className="nearby-save-button" disabled={shopsLoading}>
              {shopsLoading ? 'Finding shops…' : 'Find nearby shops'}
            </button>
          </form>
          {shopsError && <p className="error local-price-error" role="alert">{shopsError}</p>}
          {shops && (
            <div className="local-price-results" aria-live="polite">
              {shops.shops.length ? (
                <ul>
                  {shops.shops.map((shop) => (
                    <li key={shop.map_url}>
                      <div>
                        <strong>{shop.name}</strong>
                        <span>{shop.shop_type} · {shop.distance_km.toFixed(1)} km</span>
                      </div>
                      <a href={shop.map_url} target="_blank" rel="noreferrer">
                        Map
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No mapped food shops were found within {shops.radius_km} km. Map coverage may be incomplete.</p>
              )}
              <small>
                Shop locations from © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
                  OpenStreetMap contributors
                </a>.
              </small>
            </div>
          )}
        </section>

        <section className="local-price-pane" aria-labelledby="online-offers-heading">
          <h3 id="online-offers-heading">UK online offers</h3>
          <form className="local-price-form" onSubmit={searchOffers}>
            <label>
              Product name
              <input
                type="text"
                value={product}
                onChange={(event) => setProduct(event.target.value)}
                placeholder="e.g. whole milk 2L"
                minLength={2}
                maxLength={100}
                required
                disabled={offersLoading}
              />
            </label>
            <p className="local-price-disclosure">
              The product name is sent to PricesAPI. A search may use 10 credits when offers are returned.
              PricesAPI results are online merchant offers, not nearby branch prices.
            </p>
            <button type="submit" className="nearby-save-button" disabled={offersLoading}>
              {offersLoading ? 'Searching offers…' : 'Search online offers'}
            </button>
          </form>
          {offersError && <p className="error local-price-error" role="alert">{offersError}</p>}
          {onlineOffers && (
            <div className="local-price-results" aria-live="polite">
              <p className="local-offer-freshness">
                UK offers for “{onlineOffers.query}” · {
                  onlineOffers.scraped_at
                    ? `captured ${onlineOffers.scraped_at}`
                    : typeof onlineOffers.cache_age_s === 'number'
                      ? `cached ${Math.round(onlineOffers.cache_age_s / 60)} min ago`
                      : 'capture time not provided'
                }
              </p>
              {onlineOffers.products.length ? onlineOffers.products.map((onlineProduct, index) => (
                <div className="online-offer-product" key={`${onlineProduct.title}-${index}`}>
                  <strong>{onlineProduct.title}</strong>
                  {onlineProduct.offers.length ? (
                    <ul>
                      {onlineProduct.offers.map((offer, offerIndex) => (
                        <li key={`${offer.seller}-${offerIndex}`}>
                          <div>
                            <strong>{offer.seller}</strong>
                            <span>{offer.product_title} · {offer.currency} {offer.price.toFixed(2)}</span>
                            {(offer.stock_status || offer.delivery_info) && (
                              <span>{[offer.stock_status, offer.delivery_info].filter(Boolean).join(' · ')}</span>
                            )}
                          </div>
                          {offer.url && (
                            <a href={offer.url} target="_blank" rel="noreferrer">
                              Offer
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No online offers were returned for this result.</p>
                  )}
                </div>
              )) : (
                <p>No online product results were returned.</p>
              )}
              <small>Prices and stock can change; check the retailer before buying.</small>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
