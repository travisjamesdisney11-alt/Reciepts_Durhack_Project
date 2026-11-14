# Receipt Remix — DurHack 2026

Snap a receipt → an LLM decodes it → say who had what in plain English → balances settle themselves. Plus price tracking, shrinkflation detection and (opt-in, anonymised) brand insights.

## Run it

**Backend** (Python 3.10+)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...      # leave unset to run in MOCK mode
python seed_fake.py                      # optional: synthetic demo flat (household 1)
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
frontend/src/         Setup → Scan (ReceiptView) → Balances → Insights
```

API (all under `/api`):
- `POST /households` `{name, members[]}` · `GET /households/{id}`
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


KEYYYYYYYYYY
-
# Copy to .env and fill in ONE key. Never commit .env.
GEMINI_API_KEY=AQ.Ab8RN6JZTMUErj2N9NRL2KpQUarXfngsxgGA8bET7H0qFx2wLQ
# ANTHROPIC_API_KEY=
# MOCK_LLM=1
LLM_MODEL=gemini-3.5-flash-lite
-