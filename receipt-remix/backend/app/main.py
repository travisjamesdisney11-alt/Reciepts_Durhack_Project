"""Receipt Remix API. Run: uvicorn app.main:app --reload --port 8000"""
import json
from collections import defaultdict

from fastapi import APIRouter, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import db, llm

app = FastAPI(title="Receipt Remix")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
api = APIRouter(prefix="/api")
db.init()

LOW_CONFIDENCE = 0.6


# ---------- helpers ----------

def unit_price(price: float, qty: float, size_value: float, size_unit: str) -> tuple[float | None, str | None]:
    """Normalise to price per kg / litre / each so pack-size changes are comparable."""
    qty = qty or 1
    to_base = {"g": (0.001, "kg"), "kg": (1, "kg"), "ml": (0.001, "l"), "l": (1, "l"),
               "pint": (0.568, "l"), "each": (1, "each")}
    if size_unit not in to_base or not size_value:
        return None, None
    factor, basis = to_base[size_unit]
    amount = size_value * factor * qty
    return round(price / amount, 3), basis


def load_receipt(conn, receipt_id: int) -> dict:
    r = conn.execute("SELECT * FROM receipts WHERE id = ?", (receipt_id,)).fetchone()
    if not r:
        raise HTTPException(404, "Receipt not found")
    receipt = dict(r)
    receipt.pop("raw_json", None)
    items = db.rows(conn.execute("SELECT * FROM line_items WHERE receipt_id = ? ORDER BY id", (receipt_id,)))
    assigned = defaultdict(list)
    for a in conn.execute(
        "SELECT a.line_item_id, a.member_id FROM assignments a JOIN line_items li ON li.id = a.line_item_id WHERE li.receipt_id = ?",
        (receipt_id,),
    ):
        assigned[a["line_item_id"]].append(a["member_id"])
    for i in items:
        i["member_ids"] = assigned[i["id"]]
        i["needs_check"] = (i["confidence"] or 0) < LOW_CONFIDENCE
    items_sum = round(sum(i["price"] for i in items), 2)
    receipt["items"] = items
    receipt["items_sum"] = items_sum
    receipt["total_matches"] = receipt["total"] is not None and abs(items_sum - receipt["total"]) < 0.02
    return receipt


# ---------- households ----------

class HouseholdIn(BaseModel):
    name: str
    members: list[str]


@api.post("/households")
def create_household(body: HouseholdIn):
    with db.connect() as conn:
        hid = conn.execute("INSERT INTO households (name) VALUES (?)", (body.name,)).lastrowid
        for m in body.members:
            conn.execute("INSERT INTO members (household_id, name) VALUES (?, ?)", (hid, m.strip()))
    return get_household(hid)


@api.get("/households/{hid}")
def get_household(hid: int):
    with db.connect() as conn:
        h = conn.execute("SELECT * FROM households WHERE id = ?", (hid,)).fetchone()
        if not h:
            raise HTTPException(404, "Household not found")
        members = db.rows(conn.execute("SELECT id, name FROM members WHERE household_id = ?", (hid,)))
        receipts = db.rows(conn.execute(
            "SELECT id, store, purchased_at, total, status, payer_id FROM receipts WHERE household_id = ? ORDER BY purchased_at DESC, id DESC",
            (hid,)))
    return {**dict(h), "members": members, "receipts": receipts}


# ---------- receipts ----------

@api.post("/receipts")
async def upload_receipt(household_id: int = Form(...), payer_id: int = Form(...), file: UploadFile = File(...)):
    data = await file.read()
    try:
        parsed = llm.extract_receipt(data)
    except Exception as e:  # surface LLM/image errors to the UI rather than a bare 500
        raise HTTPException(502, f"Extraction failed: {e}")

    with db.connect() as conn:
        rid = conn.execute(
            "INSERT INTO receipts (household_id, payer_id, store, purchased_at, total, currency, raw_json) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (household_id, payer_id, parsed.get("store"), parsed.get("purchased_at") or None,
             parsed.get("total"), parsed.get("currency", "GBP"), json.dumps(parsed)),
        ).lastrowid
        for it in parsed.get("items", []):
            up, basis = unit_price(it["price"], it.get("quantity", 1), it.get("size_value", 0), it.get("size_unit", "unknown"))
            conn.execute(
                """INSERT INTO line_items (receipt_id, raw_text, name, canonical_name, brand, category, quantity, price,
                   discount, size_value, size_unit, unit_price, unit_basis, confidence)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (rid, it.get("raw_text"), it.get("name"), (it.get("canonical_name") or "").lower().strip(), it.get("brand"),
                 it.get("category"), it.get("quantity", 1), it["price"], it.get("discount", 0), it.get("size_value"),
                 it.get("size_unit"), up, basis, it.get("confidence")),
            )
        return load_receipt(conn, rid)


@api.get("/receipts/{rid}")
def get_receipt(rid: int):
    with db.connect() as conn:
        return load_receipt(conn, rid)


class ItemEdit(BaseModel):
    name: str | None = None
    price: float | None = None
    category: str | None = None


@api.patch("/items/{item_id}")
def edit_item(item_id: int, body: ItemEdit):
    """Human correction of a misread line."""
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(400, "Nothing to update")
    with db.connect() as conn:
        sets = ", ".join(f"{k} = ?" for k in fields)
        conn.execute(f"UPDATE line_items SET {sets}, confidence = 1.0 WHERE id = ?", (*fields.values(), item_id))
        rid = conn.execute("SELECT receipt_id FROM line_items WHERE id = ?", (item_id,)).fetchone()["receipt_id"]
        return load_receipt(conn, rid)


class SplitRequest(BaseModel):
    instruction: str


@api.post("/receipts/{rid}/propose-split")
def propose_split(rid: int, body: SplitRequest):
    """LLM proposes; nothing is saved until the user confirms."""
    with db.connect() as conn:
        receipt = load_receipt(conn, rid)
        members = db.rows(conn.execute("SELECT id, name FROM members WHERE household_id = ?", (receipt["household_id"],)))
    by_name = {m["name"].lower(): m["id"] for m in members}
    payer = next((m["name"] for m in members if m["id"] == receipt["payer_id"]), None)
    result = llm.propose_split(receipt["items"], [m["name"] for m in members], payer, body.instruction)
    proposal = []
    for a in result.get("assignments", []):
        ids = [by_name[n.lower()] for n in a.get("member_names", []) if n.lower() in by_name]
        proposal.append({"item_id": a["item_id"], "member_ids": ids, "reason": a.get("reason", "")})
    return {"assignments": proposal, "questions": result.get("questions", [])}


class Assignment(BaseModel):
    item_id: int
    member_ids: list[int]


class ConfirmSplit(BaseModel):
    assignments: list[Assignment]


@api.put("/receipts/{rid}/split")
def confirm_split(rid: int, body: ConfirmSplit):
    with db.connect() as conn:
        item_ids = {r["id"] for r in conn.execute("SELECT id FROM line_items WHERE receipt_id = ?", (rid,))}
        conn.execute(f"DELETE FROM assignments WHERE line_item_id IN ({','.join('?' * len(item_ids)) or 'NULL'})", tuple(item_ids))
        for a in body.assignments:
            if a.item_id not in item_ids:
                raise HTTPException(400, f"Item {a.item_id} is not on this receipt")
            for mid in a.member_ids:
                conn.execute("INSERT INTO assignments (line_item_id, member_id) VALUES (?, ?)", (a.item_id, mid))
        conn.execute("UPDATE receipts SET status = 'confirmed' WHERE id = ?", (rid,))
        return load_receipt(conn, rid)


# ---------- balances ----------

@api.get("/households/{hid}/balances")
def balances(hid: int):
    with db.connect() as conn:
        members = {m["id"]: m["name"] for m in conn.execute("SELECT id, name FROM members WHERE household_id = ?", (hid,))}
        net = {mid: 0.0 for mid in members}  # positive = is owed money
        receipts = db.rows(conn.execute("SELECT id, payer_id FROM receipts WHERE household_id = ? AND status = 'confirmed'", (hid,)))
        for r in receipts:
            for item in conn.execute("SELECT id, price FROM line_items WHERE receipt_id = ?", (r["id"],)):
                sharers = [a["member_id"] for a in conn.execute("SELECT member_id FROM assignments WHERE line_item_id = ?", (item["id"],))]
                if not sharers:
                    continue
                share = item["price"] / len(sharers)
                for s in sharers:
                    net[s] -= share
                net[r["payer_id"]] += item["price"]

    # Greedy debt simplification: fewest transfers to settle up.
    debtors = sorted([[mid, -v] for mid, v in net.items() if v < -0.005], key=lambda x: -x[1])
    creditors = sorted([[mid, v] for mid, v in net.items() if v > 0.005], key=lambda x: -x[1])
    transfers = []
    i = j = 0
    while i < len(debtors) and j < len(creditors):
        amt = min(debtors[i][1], creditors[j][1])
        transfers.append({"from": members[debtors[i][0]], "to": members[creditors[j][0]], "amount": round(amt, 2)})
        debtors[i][1] -= amt
        creditors[j][1] -= amt
        if debtors[i][1] < 0.005:
            i += 1
        if creditors[j][1] < 0.005:
            j += 1
    return {"net": [{"member": members[m], "balance": round(v, 2)} for m, v in net.items()], "settle_up": transfers}


# ---------- insights ----------

@api.get("/households/{hid}/insights")
def insights(hid: int):
    """Return household totals and per-member shares from confirmed item splits."""
    with db.connect() as conn:
        base = "FROM line_items li JOIN receipts r ON r.id = li.receipt_id WHERE r.household_id = ?"
        by_category = db.rows(conn.execute(f"SELECT li.category, ROUND(SUM(li.price), 2) AS spend {base} GROUP BY li.category ORDER BY spend DESC", (hid,)))
        by_week = db.rows(conn.execute(
            f"SELECT strftime('%Y-W%W', r.purchased_at) AS week, ROUND(SUM(li.price), 2) AS spend {base} AND r.purchased_at IS NOT NULL GROUP BY week ORDER BY week",
            (hid,)))
        history = db.rows(conn.execute(
            f"SELECT li.canonical_name, li.name, li.category, li.price, li.size_value, li.size_unit, li.unit_price, li.unit_basis, r.purchased_at {base} AND li.canonical_name != '' ORDER BY r.purchased_at",
            (hid,)))
        members = db.rows(conn.execute(
            "SELECT id, name FROM members WHERE household_id = ? ORDER BY id",
            (hid,),
        ))
        by_member_category = db.rows(conn.execute(
            """SELECT a.member_id, li.category,
                      ROUND(SUM(li.price * 1.0 / shares.share_count), 2) AS spend
               FROM assignments a
               JOIN line_items li ON li.id = a.line_item_id
               JOIN receipts r ON r.id = li.receipt_id
               JOIN (
                   SELECT line_item_id, COUNT(*) AS share_count
                   FROM assignments GROUP BY line_item_id
               ) shares ON shares.line_item_id = li.id
               WHERE r.household_id = ? AND r.status = 'confirmed'
               GROUP BY a.member_id, li.category
               ORDER BY a.member_id, spend DESC""",
            (hid,),
        ))
        by_member_week = db.rows(conn.execute(
            """SELECT a.member_id,
                      strftime('%Y-W%W', r.purchased_at) AS week,
                      ROUND(SUM(li.price * 1.0 / shares.share_count), 2) AS spend
               FROM assignments a
               JOIN line_items li ON li.id = a.line_item_id
               JOIN receipts r ON r.id = li.receipt_id
               JOIN (
                   SELECT line_item_id, COUNT(*) AS share_count
                   FROM assignments GROUP BY line_item_id
               ) shares ON shares.line_item_id = li.id
               WHERE r.household_id = ? AND r.status = 'confirmed'
                 AND r.purchased_at IS NOT NULL
               GROUP BY a.member_id, week
               ORDER BY a.member_id, week""",
            (hid,),
        ))
        member_history = db.rows(conn.execute(
            """SELECT a.member_id, li.canonical_name, li.name, li.category, li.price,
                      li.size_value, li.size_unit, li.unit_price, li.unit_basis, r.purchased_at
               FROM assignments a
               JOIN line_items li ON li.id = a.line_item_id
               JOIN receipts r ON r.id = li.receipt_id
               WHERE r.household_id = ? AND r.status = 'confirmed'
                 AND li.canonical_name != ''
               ORDER BY r.purchased_at""",
            (hid,),
        ))

    categories_by_member = defaultdict(list)
    for row in by_member_category:
        categories_by_member[row["member_id"]].append({"category": row["category"], "spend": row["spend"]})
    weeks_by_member = defaultdict(list)
    for row in by_member_week:
        weeks_by_member[row["member_id"]].append({"week": row["week"], "spend": row["spend"]})
    history_by_member = defaultdict(list)
    for row in member_history:
        history_by_member[row["member_id"]].append(row)

    housemates = [
        {
            "member_id": member["id"],
            "name": member["name"],
            "spend_by_category": categories_by_member[member["id"]],
            "spend_by_week": weeks_by_member[member["id"]],
            "price_changes": price_changes(history_by_member[member["id"]]),
        }
        for member in members
    ]
    return {
        "spend_by_category": by_category,
        "spend_by_week": by_week,
        "price_changes": price_changes(history),
        "housemates": housemates,
    }


def price_changes(history: list[dict]) -> list[dict]:
    """Compare first vs latest purchase of each product; flag shrinkflation.

    Shrinkflation is matched on a looser key (canonical name minus the size token)
    so '...500g' and '...450g' versions count as the same product.
    """
    import re
    groups = defaultdict(list)
    for h in history:
        key = re.sub(r"\s*\d+(\.\d+)?\s*(g|kg|ml|l|cl|pt|pint|pk|x\d+)\b", "", h["canonical_name"]).strip()
        groups[key].append(h)
    out = []
    for key, hs in groups.items():
        if len(hs) < 2:
            continue
        first, last = hs[0], hs[-1]
        change = {"product": last["name"], "category": last.get("category"), "first_date": first["purchased_at"], "last_date": last["purchased_at"],
                  "first_price": first["price"], "last_price": last["price"],
                  "price_change_pct": round((last["price"] - first["price"]) / first["price"] * 100, 1) if first["price"] else None,
                  "unit_basis": last["unit_basis"], "first_unit_price": first["unit_price"], "last_unit_price": last["unit_price"],
                  "shrinkflation": False}
        if first["unit_price"] and last["unit_price"]:
            change["unit_price_change_pct"] = round((last["unit_price"] - first["unit_price"]) / first["unit_price"] * 100, 1)
            smaller = (last["size_value"] or 0) < (first["size_value"] or 0) and last["size_unit"] == first["size_unit"]
            change["shrinkflation"] = smaller and last["price"] >= first["price"] * 0.98
        out.append(change)
    return sorted(out, key=lambda c: -(c.get("unit_price_change_pct") or c["price_change_pct"] or 0))


app.include_router(api)
