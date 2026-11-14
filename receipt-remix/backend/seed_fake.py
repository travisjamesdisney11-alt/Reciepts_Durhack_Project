"""Fill the DB with ~8 weeks of synthetic shops for a demo household, so the
insights and business dashboards have something to show. Clearly fake: label it
as synthetic in the demo.

    python seed_fake.py
"""
import datetime as dt
import random

from app import db
from app.main import unit_price

random.seed(42)

# (canonical_name, name, brand, category, price, size_value, size_unit)
CATALOGUE = [
    ("tesco semi-skimmed milk 2pt", "Semi-skimmed milk, 2 pints", "Tesco", "dairy_eggs", 1.45, 2, "pint"),
    ("hovis white medium bread 800g", "Hovis white bread, 800g", "Hovis", "bakery", 1.65, 800, "g"),
    ("tesco free range eggs 6pk", "Free range eggs, 6", "Tesco", "dairy_eggs", 1.89, 6, "each"),
    ("tesco bananas 5pk", "Bananas, 5 pack", "Tesco", "produce", 0.90, 5, "each"),
    ("tesco chicken breast fillets 300g", "Chicken breast fillets, 300g", "Tesco", "meat_fish", 3.25, 300, "g"),
    ("tesco penne pasta 500g", "Penne pasta, 500g", "Tesco", "cupboard", 0.75, 500, "g"),
    ("fairy original washing up liquid 320ml", "Fairy washing-up liquid, 320ml", "Fairy", "household_cleaning", 1.50, 320, "ml"),
    ("ariel all in 1 pods 24pk", "Ariel pods, 24", "Ariel", "laundry", 7.00, 24, "each"),
    ("head & shoulders shampoo 400ml", "Head & Shoulders shampoo, 400ml", "Head & Shoulders", "toiletries_personal_care", 5.50, 400, "ml"),
    ("cadbury dairy milk 110g", "Dairy Milk, 110g", "Cadbury", "snacks_treats", 1.85, 110, "g"),
    ("pringles original 185g", "Pringles Original, 185g", "Pringles", "snacks_treats", 2.25, 185, "g"),
    ("heinz baked beans 415g", "Heinz baked beans, 415g", "Heinz", "cupboard", 1.40, 415, "g"),
]
# One product shrinks halfway through: the shrinkflation demo moment.
SHRUNK = ("cadbury dairy milk 95g", "Dairy Milk, 95g", "Cadbury", "snacks_treats", 1.85, 95, "g")

db.init()
with db.connect() as conn:
    hid = conn.execute("INSERT INTO households (name) VALUES ('Demo flat (synthetic)')").lastrowid
    members = [conn.execute("INSERT INTO members (household_id, name) VALUES (?, ?)", (hid, n)).lastrowid
               for n in ["Alex", "Sam", "Priya", "Jordan"]]
    start = dt.date(2026, 9, 19)
    for week in range(8):
        for shop in range(2):
            day = start + dt.timedelta(days=week * 7 + shop * 3)
            inflation = 1 + 0.01 * week
            picks = random.sample(CATALOGUE, k=random.randint(5, 9))
            if week >= 4:
                picks = [SHRUNK if p[0].startswith("cadbury") else p for p in picks]
            rows = []
            for canon, name, brand, cat, price, sv, su in picks:
                p = round(price * (inflation if cat != "snacks_treats" else 1), 2)
                rows.append((canon, name, brand, cat, p, sv, su))
            total = round(sum(r[4] for r in rows), 2)
            payer = random.choice(members)
            rid = conn.execute(
                "INSERT INTO receipts (household_id, payer_id, store, purchased_at, total, status) VALUES (?, ?, 'Tesco Express', ?, ?, 'confirmed')",
                (hid, payer, day.isoformat(), total)).lastrowid
            for canon, name, brand, cat, p, sv, su in rows:
                up, basis = unit_price(p, 1, sv, su)
                iid = conn.execute(
                    """INSERT INTO line_items (receipt_id, raw_text, name, canonical_name, brand, category, quantity, price,
                       size_value, size_unit, unit_price, unit_basis, confidence) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, 0.95)""",
                    (rid, canon.upper()[:24], name, canon, brand, cat, p, sv, su, up, basis)).lastrowid
                for m in random.sample(members, k=random.randint(1, 4)):
                    conn.execute("INSERT INTO assignments (line_item_id, member_id) VALUES (?, ?)", (iid, m))

print(f"Seeded household id {hid}. Open the app and load household {hid}.")
