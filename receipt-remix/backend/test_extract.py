"""Quick check of extraction quality on real receipts, no server needed.

    python test_extract.py photos/receipt1.jpg photos/receipt2.jpg

Prints each item, flags low-confidence lines, and checks the items add up to
the printed total — the fastest way to iterate on the prompt in app/llm.py.
"""
import json
import sys

from app import llm

for path in sys.argv[1:]:
    with open(path, "rb") as f:
        r = llm.extract_receipt(f.read())
    print(f"\n=== {path}: {r['store']} {r['purchased_at']} total {r['total']}")
    for it in r["items"]:
        flag = "  <-- CHECK" if it["confidence"] < 0.6 else ""
        print(f"  {it['raw_text']:<28} -> {it['name']:<40} {it['category']:<22} £{it['price']:>6.2f}{flag}")
    s = round(sum(i["price"] for i in r["items"]), 2)
    print(f"  items sum £{s}  {'OK' if abs(s - r['total']) < 0.02 else 'MISMATCH vs total'}")
    if "--json" in sys.argv:
        print(json.dumps(r, indent=2))
