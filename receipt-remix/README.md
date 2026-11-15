# Receipt Remix — DurHack 2026

Snap a receipt → an LLM decodes it → say who had what in plain English → balances settle themselves. Plus price tracking, shrinkflation detection and (opt-in, anonymised) brand insights.

## Run it

**Backend** (Python 3.10+)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...      # leave unset to run in MOCK mode
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
| `DB_PATH` | `receipts.db` | delete the file to reset |

## How it fits together
```
backend/app/llm.py    extraction + split prompts, JSON schemas (forced tool use), mock data
backend/app/main.py   FastAPI routes, unit-price normalisation, balances, insights, shrinkflation
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
- TODO: consent toggle + anonymisation before anything reaches a business view


---

### Backend environment example

Copy these settings to `backend/.env`, add one provider key locally, and never commit the file.

```dotenv
GEMINI_API_KEY=
# ANTHROPIC_API_KEY=
# MOCK_LLM=1
LLM_MODEL=gemini-3.5-flash-lite
```
