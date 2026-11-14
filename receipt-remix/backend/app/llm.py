"""All LLM calls live here: receipt extraction and split proposals.

Uses Claude tool-use with a forced tool so the model must return JSON that
matches our schema. Set MOCK_LLM=1 (or leave ANTHROPIC_API_KEY unset) to get
canned responses, so the frontend can be built without spending credits.
"""
import base64
import io
import os

from PIL import Image

MODEL = os.environ.get("LLM_MODEL", "claude-sonnet-5-5")
MOCK = os.environ.get("MOCK_LLM") == "1" or not os.environ.get("ANTHROPIC_API_KEY")

CATEGORIES = [
    "produce", "dairy_eggs", "meat_fish", "bakery", "frozen", "cupboard",
    "drinks", "alcohol", "snacks_treats", "ready_meals", "household_cleaning",
    "laundry", "toiletries_personal_care", "baby_care", "feminine_care",
    "health_medicine", "pet", "other",
]

EXTRACT_TOOL = {
    "name": "record_receipt",
    "description": "Record the structured contents of a shop receipt.",
    "input_schema": {
        "type": "object",
        "properties": {
            "store": {"type": "string", "description": "Shop name, e.g. 'Tesco Express'"},
            "purchased_at": {"type": "string", "description": "Date as YYYY-MM-DD, or empty if unreadable"},
            "currency": {"type": "string", "description": "ISO currency code, usually GBP"},
            "total": {"type": "number", "description": "Total amount paid as printed on the receipt"},
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "raw_text": {"type": "string", "description": "The line exactly as printed"},
                        "name": {"type": "string", "description": "Human-readable product name"},
                        "canonical_name": {
                            "type": "string",
                            "description": "Lowercase, consistent identity for matching across receipts: brand + product + size, e.g. 'tesco semi-skimmed milk 2pt'",
                        },
                        "brand": {"type": "string", "description": "Brand, or the store name for own-brand"},
                        "category": {"type": "string", "enum": CATEGORIES},
                        "quantity": {"type": "number"},
                        "price": {"type": "number", "description": "Final price paid for this line AFTER any discounts/multibuy savings applied to it"},
                        "discount": {"type": "number", "description": "Total discount applied to this line (positive number), 0 if none"},
                        "size_value": {"type": "number", "description": "Pack size number, e.g. 500 for 500g. 0 if unknown"},
                        "size_unit": {"type": "string", "enum": ["g", "kg", "ml", "l", "pint", "each", "unknown"]},
                        "confidence": {"type": "number", "description": "0-1: how sure you are this line was read and interpreted correctly"},
                    },
                    "required": ["raw_text", "name", "canonical_name", "category", "quantity", "price", "discount", "size_value", "size_unit", "confidence"],
                },
            },
        },
        "required": ["store", "purchased_at", "currency", "total", "items"],
    },
}

EXTRACT_PROMPT = """Read this shop receipt and record it with the record_receipt tool.

Rules:
- One entry per purchased product. Do NOT create separate entries for discount,
  Clubcard/Nectar savings or multibuy lines: fold them into the price (and
  discount) of the product they apply to.
- Ignore payment, change, VAT summary and loyalty-points lines.
- Expand abbreviations (e.g. 'FF SEMI SKMD 2PT' -> 'Semi-skimmed milk, 2 pints').
- canonical_name must be stable: the same product on a different receipt must
  get the same canonical_name.
- Use low confidence (<0.6) when text is faded, cut off, or you are guessing.
- Only describe the products. Never infer anything about the shopper (health,
  pregnancy, religion, etc.)."""

SPLIT_TOOL = {
    "name": "propose_split",
    "description": "Propose which household members share each receipt item.",
    "input_schema": {
        "type": "object",
        "properties": {
            "assignments": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "item_id": {"type": "integer"},
                        "member_names": {"type": "array", "items": {"type": "string"}},
                        "reason": {"type": "string", "description": "Very short justification"},
                    },
                    "required": ["item_id", "member_names"],
                },
            },
            "questions": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Anything ambiguous the user should clarify",
            },
        },
        "required": ["assignments", "questions"],
    },
}


def _client():
    import anthropic  # imported lazily so mock mode works without the package
    return anthropic.Anthropic()


def _prepare_image(data: bytes) -> tuple[str, str]:
    """Shrink and re-encode as JPEG: phone photos are often too big for the API."""
    img = Image.open(io.BytesIO(data))
    img = img.convert("RGB")
    img.thumbnail((1568, 1568))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return "image/jpeg", base64.standard_b64encode(buf.getvalue()).decode()


def _call_tool(tool: dict, content: list) -> dict:
    resp = _client().messages.create(
        model=MODEL,
        max_tokens=4096,
        tools=[tool],
        tool_choice={"type": "tool", "name": tool["name"]},
        messages=[{"role": "user", "content": content}],
    )
    for block in resp.content:
        if block.type == "tool_use":
            return block.input
    raise RuntimeError("Model did not return structured output")


def extract_receipt(image_bytes: bytes) -> dict:
    if MOCK:
        return _mock_receipt()
    media_type, b64 = _prepare_image(image_bytes)
    return _call_tool(EXTRACT_TOOL, [
        {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64}},
        {"type": "text", "text": EXTRACT_PROMPT},
    ])


def propose_split(items: list[dict], members: list[str], payer: str | None, instruction: str) -> dict:
    if MOCK:
        return {"assignments": [{"item_id": i["id"], "member_names": members, "reason": "mock: shared"} for i in items],
                "questions": []}
    lines = "\n".join(f"- id {i['id']}: {i['name']} ({i['category']}) £{i['price']:.2f}" for i in items)
    prompt = f"""Household members: {', '.join(members)}
Paid by: {payer or 'unknown'}

Receipt items:
{lines}

The user says: "{instruction}"

Assign every item to the members who should share its cost, using the
propose_split tool. If the instruction doesn't mention an item, assume it is
shared by everyone. Only use the names listed above. Put anything genuinely
ambiguous in questions rather than guessing."""
    return _call_tool(SPLIT_TOOL, [{"type": "text", "text": prompt}])


def _mock_receipt() -> dict:
    return {
        "store": "Tesco Express",
        "purchased_at": "2026-11-14",
        "currency": "GBP",
        "total": 14.35,
        "items": [
            {"raw_text": "TSCO FF SEMI SKMD 2PT", "name": "Semi-skimmed milk, 2 pints", "canonical_name": "tesco semi-skimmed milk 2pt",
             "brand": "Tesco", "category": "dairy_eggs", "quantity": 1, "price": 1.45, "discount": 0, "size_value": 2, "size_unit": "pint", "confidence": 0.95},
            {"raw_text": "CHKN BRST FLLTS 300G", "name": "Chicken breast fillets, 300g", "canonical_name": "tesco chicken breast fillets 300g",
             "brand": "Tesco", "category": "meat_fish", "quantity": 1, "price": 3.25, "discount": 0, "size_value": 300, "size_unit": "g", "confidence": 0.9},
            {"raw_text": "FAIRY ORIG 320ML", "name": "Fairy Original washing-up liquid, 320ml", "canonical_name": "fairy original washing up liquid 320ml",
             "brand": "Fairy", "category": "household_cleaning", "quantity": 1, "price": 1.50, "discount": 0.25, "size_value": 320, "size_unit": "ml", "confidence": 0.92},
            {"raw_text": "HOVIS WHT MED 800G", "name": "Hovis white medium bread, 800g", "canonical_name": "hovis white medium bread 800g",
             "brand": "Hovis", "category": "bakery", "quantity": 1, "price": 1.65, "discount": 0, "size_value": 800, "size_unit": "g", "confidence": 0.88},
            {"raw_text": "MALBEC 75CL", "name": "Malbec red wine, 75cl", "canonical_name": "malbec red wine 75cl",
             "brand": "Tesco", "category": "alcohol", "quantity": 1, "price": 6.50, "discount": 0, "size_value": 750, "size_unit": "ml", "confidence": 0.55},
        ],
    }
