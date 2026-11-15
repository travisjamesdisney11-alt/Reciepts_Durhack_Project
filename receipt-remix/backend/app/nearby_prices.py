"""Privacy-conscious, coarse-area price comparisons."""
import re
from collections import defaultdict
from statistics import median

CONSENT_VERSION = "nearby-prices-v1"
MIN_HOUSEHOLDS = 5
LOOKBACK_DAYS = 90
PRODUCT_SIZE_PATTERN = re.compile(r"\s*\d+(\.\d+)?\s*(g|kg|ml|l|cl|pt|pint|pk|x\d+)\b")


def normalize_area_code(value: str | None) -> str | None:
    if not value:
        return None
    area_code = re.sub(r"\s+", "", value).upper()
    if area_code == "GIR" or re.fullmatch(r"[A-Z]{1,2}[0-9][A-Z0-9]?", area_code):
        return area_code
    return None


def canonical_product_key(value: str) -> str:
    return PRODUCT_SIZE_PATTERN.sub("", value.casefold()).strip()


def household_area_code(conn, household_id: int) -> str | None:
    preferences = conn.execute(
        """SELECT c.area_code
           FROM price_sharing_consents c
           JOIN user_households uh
             ON uh.household_id = c.household_id AND uh.user_id = c.user_id
           WHERE c.household_id = ? AND c.enabled = 1
             AND c.consent_version = ? AND c.area_code IS NOT NULL""",
        (household_id, CONSENT_VERSION),
    ).fetchall()
    area_codes = {preference["area_code"] for preference in preferences}
    if len(area_codes) != 1:
        return None
    return next(iter(area_codes))


def sharing_status(conn, household_id: int, user_id: int) -> dict:
    preference = conn.execute(
        """SELECT enabled, area_code, consent_version
           FROM price_sharing_consents
           WHERE household_id = ? AND user_id = ?""",
        (household_id, user_id),
    ).fetchone()
    enabled = bool(
        preference
        and preference["enabled"]
        and preference["consent_version"] == CONSENT_VERSION
        and preference["area_code"]
    )
    area_code = preference["area_code"] if enabled else None
    contribution_ready = household_area_code(conn, household_id) is not None
    return {
        "enabled": enabled,
        "area_code": area_code,
        "contribution_ready": contribution_ready,
    }


def _percentile(values: list[float], fraction: float) -> float:
    ordered = sorted(values)
    position = (len(ordered) - 1) * fraction
    lower = int(position)
    upper = min(lower + 1, len(ordered) - 1)
    weight = position - lower
    return ordered[lower] * (1 - weight) + ordered[upper] * weight


def nearby_comparisons(
    conn,
    household_id: int,
    area_code: str,
    confidence_threshold: float,
) -> list[dict]:
    own_rows = conn.execute(
        """SELECT li.canonical_name AS product_key, li.name, li.unit_basis,
                  li.unit_price
           FROM line_items li
           JOIN receipts r ON r.id = li.receipt_id
           WHERE r.household_id = ? AND r.status = 'confirmed' AND r.currency = 'GBP'
             AND r.purchased_at >= date('now', ?)
             AND li.canonical_name IS NOT NULL AND trim(li.canonical_name) != ''
             AND li.confidence >= ? AND li.unit_price > 0
             AND li.unit_basis IN ('kg', 'l', 'each')
           ORDER BY r.purchased_at, li.id""",
        (household_id, f"-{LOOKBACK_DAYS} days", confidence_threshold),
    ).fetchall()
    own_prices = defaultdict(list)
    product_names = {}
    for row in own_rows:
        key = (canonical_product_key(row["product_key"]), row["unit_basis"])
        if not key[0]:
            continue
        own_prices[key].append(row["unit_price"])
        product_names[key] = row["name"] or row["product_key"]
    if not own_prices:
        return []

    # Exclude the caller's entire household so housemates are never local comparison samples.
    community_rows = conn.execute(
        """WITH eligible_households AS (
               SELECT c.household_id
               FROM price_sharing_consents c
               JOIN user_households uh
                 ON uh.household_id = c.household_id AND uh.user_id = c.user_id
               WHERE c.enabled = 1 AND c.consent_version = ?
                 AND c.area_code IS NOT NULL
               GROUP BY c.household_id
               HAVING COUNT(DISTINCT c.area_code) = 1 AND MAX(c.area_code) = ?
           )
           SELECT r.household_id, li.canonical_name AS product_key,
                  li.unit_basis, li.unit_price
           FROM line_items li
           JOIN receipts r ON r.id = li.receipt_id
           JOIN eligible_households eh ON eh.household_id = r.household_id
           WHERE r.household_id != ? AND r.status = 'confirmed' AND r.currency = 'GBP'
             AND r.purchased_at >= date('now', ?)
             AND li.canonical_name IS NOT NULL AND trim(li.canonical_name) != ''
             AND li.confidence >= ? AND li.unit_price > 0
             AND li.unit_basis IN ('kg', 'l', 'each')""",
        (
            CONSENT_VERSION,
            area_code,
            household_id,
            f"-{LOOKBACK_DAYS} days",
            confidence_threshold,
        ),
    ).fetchall()
    household_prices = defaultdict(list)
    for row in community_rows:
        key = (canonical_product_key(row["product_key"]), row["unit_basis"])
        if key in own_prices:
            household_prices[(row["household_id"], *key)].append(row["unit_price"])

    product_prices = defaultdict(list)
    for (community_household_id, product_key, basis), prices in household_prices.items():
        product_prices[(product_key, basis)].append(median(prices))

    comparisons = []
    for key, prices in own_prices.items():
        household_medians = product_prices[key]
        if len(household_medians) < MIN_HOUSEHOLDS:
            continue
        nearby_median = median(household_medians)
        own_median = median(prices)
        comparisons.append({
            "product": product_names[key],
            "unit_basis": key[1],
            "household_unit_price": round(own_median, 3),
            "nearby_median_unit_price": round(nearby_median, 3),
            "nearby_lower_quartile": round(_percentile(household_medians, 0.25), 3),
            "nearby_upper_quartile": round(_percentile(household_medians, 0.75), 3),
            "household_count": len(household_medians),
            "difference_pct": round((own_median - nearby_median) / nearby_median * 100, 1),
        })
    return sorted(comparisons, key=lambda comparison: comparison["product"].casefold())


def nearby_price_status(
    conn,
    household_id: int,
    user_id: int,
    confidence_threshold: float,
) -> dict:
    status = sharing_status(conn, household_id, user_id)
    result = {
        **status,
        "min_households": MIN_HOUSEHOLDS,
        "lookback_days": LOOKBACK_DAYS,
        "comparisons": [],
    }
    if not status["enabled"]:
        result["state"] = "not_opted_in"
    else:
        result["comparisons"] = nearby_comparisons(
            conn, household_id, status["area_code"], confidence_threshold
        )
        result["state"] = "available" if result["comparisons"] else "insufficient_local_data"
    return result
