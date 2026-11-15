# Receipt Remix — DurHack 2026

Snap a receipt → an LLM decodes it → say who had what in plain English → balances settle themselves. Plus household price tracking, shrinkflation detection, and optional nearby price comparisons.

## Run it

**Backend** (Python 3.10+)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...      # leave unset to run in MOCK mode
export PRICESAPI_API_KEY=pricesapi_...   # optional; enables online-offer search
uvicorn app.main:app --reload --port 8000
```
API docs at http://localhost:8000/docs

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. On your phone (same Wi-Fi) open `http://<laptop-ip>:5173` — the upload button opens the camera.

Create an account or log in from the landing page. Accounts are independent of households: after signing in, create a household or join one with a housemate's invite code. Passwords must be at least 8 characters and include an uppercase letter, a lowercase letter, and a special symbol. Sessions expire after 30 days. Password reset and email verification are not available in this MVP.

Creating a household adds the signed-in user as its first member and generates a unique 7-character invite code using easy-to-read uppercase letters and numbers. Share it with housemates; they create an account or log in, enter the code, and are added to the household automatically. Household members can copy the code from the app.

### Local test accounts (optional)

Use an explicitly named test database so the demo accounts do not get added to your normal app database:
```bash
cd backend
python seed_test_accounts.py --db-path /tmp/receipt-remix-test.db
DB_PATH=/tmp/receipt-remix-test.db uvicorn app.main:app --reload --port 8000
```

| Test account | Email | Password |
|---|---|---|
| Alex Test | `alex@receipt-remix.test` | `ReceiptRemix!2026` |
| Sam Test | `sam@receipt-remix.test` | `ReceiptRemix!2026` |
| Casey Test | `casey@receipt-remix.test` | `ReceiptRemix!2026` |

Alex and Sam share a synthetic household; Casey has none. These are public test credentials for the isolated local test database only—never use them in production. Rerunning the seed script resets these test accounts to the listed password.

**Test extraction on real photos without the app**
```bash
cd backend
python test_extract.py photos/*.jpg        # add --json to see full output
```

### Config
| Env var | Default | |
|---|---|---|
| `ANTHROPIC_API_KEY` | – | unset ⇒ mock mode |
| `MOCK_LLM` | – | `1` forces mock mode even with a key (save credits while building UI) |
| `LLM_MODEL` | `claude-sonnet-5-5` | any vision-capable Claude model |
| `PRICESAPI_API_KEY` | – | optional server-side key for UK online offer search |
| `DB_PATH` | `receipts.db` | delete the file to reset |

## How it fits together
```
backend/app/llm.py    extraction + split prompts, JSON schemas (forced tool use), mock data
backend/app/main.py   FastAPI routes, unit-price normalisation, balances, insights, shrinkflation, nearby prices
backend/app/nearby_prices.py  opt-in consent checks and coarse-area aggregated price comparisons
backend/app/shop_prices.py  transient postcode-to-shop lookup and PricesAPI online offers
backend/app/db.py     SQLite schema
backend/seed_test_accounts.py  opt-in local test accounts and household
frontend/src/         Auth → household setup → Scan (ReceiptView) → Balances → Insights
```

API (all under `/api`):
- `POST /auth/register` `{name, email, password}` · `POST /auth/login` `{email, password}`
- `GET /auth/me` · `POST /auth/logout`
- `POST /households` `{name}` · `POST /households/join` `{invite_code}` · `GET /households/{id}`
- `POST /receipts` (multipart: household_id, payer_id, file) → extracted receipt
- `PATCH /items/{id}` — human correction (sets confidence to 1)
- `POST /receipts/{id}/propose-split` `{instruction}` → LLM proposal (**not saved**)
- `PUT /receipts/{id}/split` `{assignments:[{item_id, member_ids}]}` → confirm
- `GET /households/{id}/balances` → net balances + minimal settle-up transfers
- `GET /households/{id}/insights` → category/week spend, price changes, shrinkflation
- `GET /households/{id}/nearby-prices` → consent status and eligible aggregate comparisons
- `PUT /households/{id}/nearby-prices/consent` `{enabled, area_code}` → save or revoke price-sharing consent
- `POST /households/{id}/nearby-shops` `{postcode}` → mapped food shops within 5 km
- `POST /households/{id}/online-offers` `{product}` → UK online merchant offers from PricesAPI

District-based nearby comparisons are off by default. A user can start their own comparisons immediately by opting in and entering only a UK postcode district (for example `DH1`); this feature does not request GPS or accept a full postcode. One account's opt-in is enough for the household's confirmed prices to join the shared pool. If multiple accounts opt in, they must use the same district; conflicting districts pause the household's contribution. Housemates are treated as one household, never separate comparison samples, and a household is excluded from its own nearby results. Comparisons use confirmed, high-confidence GBP unit prices from the last 90 days, require data from at least five other households, and return household-weighted medians and ranges only. If there is not enough matching data, the app says so rather than estimating. Turning off the last active opt-in immediately excludes that household from future comparisons.

The full-postcode shop finder is a separate, user-triggered lookup. It sends the postcode to Postcodes.io for coordinates, then sends those coordinates to OpenStreetMap's Overpass service to find mapped food-shop locations within 5 km; the app does not store the postcode or coordinates. Shop listings are locations only, and OpenStreetMap coverage may be incomplete. PricesAPI searches are also user-triggered: the product name is sent to PricesAPI for UK online merchant offers. Those offers are not tied to the nearby physical branches and may differ from in-store prices. A successful offer search can cost 10 PricesAPI credits; configure `PRICESAPI_API_KEY` on the backend, never in the frontend.

## Who owns what
1. **LLM pipeline** — `llm.py`. Run `test_extract.py` on every receipt you collect; tune `EXTRACT_PROMPT` until items sum to the total. Watch multibuys, Clubcard prices, weighed produce.
2. **Backend/split** — `main.py`. Next: handle `questions` from the split agent as a follow-up chat; per-item custom shares (e.g. 2:1).
3. **Frontend** — `src/`. Next: inline editing instead of `prompt()`, nicer mobile layout, loading skeletons.
4. **Insights/visuals/pitch** — `Insights.jsx` + new files. Next: basket portraits (p5.js), business dashboard endpoint (aggregated across households, co-occurrence, brand switching), slides.

## Responsible AI (already built in — mention in the pitch)
- Prompt forbids inferring anything about the shopper (health, pregnancy, religion…)
- LLM only *proposes* a split; nobody is charged until a human confirms
- Low-confidence lines highlighted; total mismatch warning; one-tap correction
- Synthetic data is labelled as synthetic
- Nearby-price sharing requires an explicit account opt-in, uses only coarse postcode districts, and withholds comparisons below the five-household support threshold


---

### Backend environment example

Copy these settings to `backend/.env`, add one provider key locally, and never commit the file.

```dotenv
GEMINI_API_KEY=
# PRICESAPI_API_KEY=pricesapi_...
# ANTHROPIC_API_KEY=
# MOCK_LLM=1
LLM_MODEL=gemini-3.5-flash-lite
```
