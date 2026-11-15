"""Transient nearby-shop lookup and online retailer offer search."""
import json
import math
import os
import re
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

POSTCODE_PATTERN = re.compile(r"(?:GIR0AA|[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2})")
SHOP_TYPES = "supermarket|convenience|grocery|greengrocer|butcher|bakery|dairy|deli|farm|seafood"
SHOP_RADIUS_KM = 5


class ExternalServiceError(Exception):
    pass


class InvalidPostcodeError(ValueError):
    pass


class PriceProviderNotConfigured(Exception):
    pass


def _fetch_json(
    url: str,
    *,
    service: str,
    data: bytes | None = None,
    headers: dict[str, str] | None = None,
    timeout: int = 15,
) -> dict:
    request = Request(url, data=data, headers=headers or {})
    try:
        with urlopen(request, timeout=timeout) as response:
            response_body = response.read()
    except HTTPError as exc:
        if service == "Postcodes.io" and exc.code == 404:
            raise InvalidPostcodeError("Postcodes.io could not find that postcode.") from exc
        if service == "PricesAPI" and exc.code in (401, 403):
            raise ExternalServiceError(
                "PricesAPI rejected the server API key or account access."
            ) from exc
        if service == "PricesAPI" and exc.code == 429:
            raise ExternalServiceError("PricesAPI rate limit reached. Try again later.") from exc
        raise ExternalServiceError(
            f"{service} returned an HTTP {exc.code} error."
        ) from exc
    except (URLError, TimeoutError) as exc:
        raise ExternalServiceError(f"{service} could not be reached.") from exc

    try:
        payload = json.loads(response_body)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise ExternalServiceError(f"{service} returned an invalid response.") from exc
    if not isinstance(payload, dict):
        raise ExternalServiceError(f"{service} returned an invalid response.")
    return payload


def _normalize_postcode(value: str) -> str:
    compact = "".join(value.upper().split())
    if not POSTCODE_PATTERN.fullmatch(compact):
        raise InvalidPostcodeError("Enter a valid full UK postcode.")
    return f"{compact[:-3]} {compact[-3:]}"


def _distance_km(lat_a: float, lon_a: float, lat_b: float, lon_b: float) -> float:
    earth_radius_km = 6371.0088
    lat_delta = math.radians(lat_b - lat_a)
    lon_delta = math.radians(lon_b - lon_a)
    haversine = (
        math.sin(lat_delta / 2) ** 2
        + math.cos(math.radians(lat_a))
        * math.cos(math.radians(lat_b))
        * math.sin(lon_delta / 2) ** 2
    )
    return 2 * earth_radius_km * math.asin(math.sqrt(min(1, haversine)))


def find_nearby_shops(postcode: str) -> dict:
    normalized_postcode = _normalize_postcode(postcode)
    compact_postcode = normalized_postcode.replace(" ", "")
    geocode = _fetch_json(
        f"https://api.postcodes.io/postcodes/{quote(compact_postcode)}",
        service="Postcodes.io",
        timeout=10,
    )
    location = geocode.get("result")
    if not isinstance(location, dict):
        raise InvalidPostcodeError("Postcodes.io could not find that postcode.")
    latitude = location.get("latitude")
    longitude = location.get("longitude")
    if (
        isinstance(latitude, bool)
        or isinstance(longitude, bool)
        or not isinstance(latitude, (int, float))
        or not isinstance(longitude, (int, float))
        or not math.isfinite(latitude)
        or not math.isfinite(longitude)
    ):
        raise ExternalServiceError("Postcodes.io returned no usable map location.")

    query = (
        f'[out:json][timeout:25];'
        f'(nwr(around:{SHOP_RADIUS_KM * 1000},{latitude},{longitude})'
        f'["shop"~"^{SHOP_TYPES}$"];);out center tags;'
    )
    overpass_body = urlencode({"data": query}).encode("utf-8")
    osm_data = _fetch_json(
        "https://overpass-api.de/api/interpreter",
        service="OpenStreetMap",
        data=overpass_body,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "ReceiptRemix/0.1",
        },
        timeout=30,
    )
    elements = osm_data.get("elements")
    if not isinstance(elements, list):
        raise ExternalServiceError("OpenStreetMap returned an invalid shop list.")

    shops = []
    seen = set()
    for element in elements:
        if not isinstance(element, dict):
            continue
        tags = element.get("tags")
        if not isinstance(tags, dict):
            continue
        name = tags.get("name") or tags.get("brand")
        if not isinstance(name, str) or not name.strip():
            continue
        center = element.get("center", element)
        shop_lat = center.get("lat") if isinstance(center, dict) else None
        shop_lon = center.get("lon") if isinstance(center, dict) else None
        if (
            isinstance(shop_lat, bool)
            or isinstance(shop_lon, bool)
            or not isinstance(shop_lat, (int, float))
            or not isinstance(shop_lon, (int, float))
            or not math.isfinite(shop_lat)
            or not math.isfinite(shop_lon)
        ):
            continue

        identity = (name.casefold(), round(shop_lat, 4), round(shop_lon, 4))
        if identity in seen:
            continue
        seen.add(identity)
        osm_type = element.get("type")
        osm_id = element.get("id")
        if osm_type not in ("node", "way", "relation") or not isinstance(osm_id, int):
            continue
        shop_type = tags.get("shop")
        shops.append({
            "name": name.strip(),
            "shop_type": shop_type if isinstance(shop_type, str) else "shop",
            "distance_km": round(
                _distance_km(latitude, longitude, shop_lat, shop_lon), 1
            ),
            "map_url": f"https://www.openstreetmap.org/{osm_type}/{osm_id}",
        })

    shops.sort(key=lambda shop: (shop["distance_km"], shop["name"].casefold()))
    return {"radius_km": SHOP_RADIUS_KM, "shops": shops[:50]}


def search_online_offers(product: str) -> dict:
    query = " ".join(product.split())
    if not 2 <= len(query) <= 100:
        raise ValueError("Enter a product name between 2 and 100 characters.")

    api_key = os.environ.get("PRICESAPI_API_KEY", "").strip()
    if not api_key:
        raise PriceProviderNotConfigured(
            "Online price search is unavailable until PRICESAPI_API_KEY is configured on the backend."
        )

    params = urlencode({
        "q": query,
        "market": "gb",
        "limit": 3,
        "offers_limit": 10,
    })
    response = _fetch_json(
        f"https://api.pricesapi.io/api/v1/products/search?{params}",
        service="PricesAPI",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
        },
        timeout=95,
    )
    data = response.get("data")
    products = data.get("products") if isinstance(data, dict) else None
    if response.get("success") is False or not isinstance(products, list):
        raise ExternalServiceError("PricesAPI returned an invalid product search result.")

    cleaned_products = []
    for product_result in products:
        if not isinstance(product_result, dict):
            continue
        title = product_result.get("title")
        if not isinstance(title, str) or not title:
            title = query
        offers = product_result.get("offers")
        cleaned_offers = []
        if isinstance(offers, list):
            for offer in offers:
                if not isinstance(offer, dict):
                    continue
                price = offer.get("price")
                seller = offer.get("seller")
                currency = offer.get("currency")
                if (
                    not isinstance(price, (int, float))
                    or isinstance(price, bool)
                    or not math.isfinite(price)
                    or price < 0
                    or not isinstance(seller, str)
                    or not isinstance(currency, str)
                    or not re.fullmatch(r"[A-Za-z]{3}", currency)
                ):
                    continue
                offer_url = offer.get("url")
                if not isinstance(offer_url, str) or not offer_url.startswith("https://"):
                    offer_url = None
                offer_title = offer.get("product_title")
                if not isinstance(offer_title, str) or not offer_title:
                    offer_title = title
                stock_status = offer.get("stock_status")
                delivery_info = offer.get("delivery_info")
                cleaned_offers.append({
                    "seller": seller,
                    "product_title": offer_title,
                    "price": price,
                    "currency": currency.upper(),
                    "stock_status": stock_status if isinstance(stock_status, str) else None,
                    "delivery_info": delivery_info if isinstance(delivery_info, str) else None,
                    "url": offer_url,
                })
        cleaned_products.append({
            "title": title,
            "offers": cleaned_offers,
        })

    meta = response.get("meta")
    meta = meta if isinstance(meta, dict) else {}
    scraped_at = meta.get("scraped_at")
    cache_age_s = meta.get("cache_age_s")
    return {
        "query": query,
        "market": "gb",
        "products": cleaned_products,
        "scraped_at": scraped_at if isinstance(scraped_at, str) else None,
        "cache_age_s": cache_age_s
        if isinstance(cache_age_s, (int, float))
        and not isinstance(cache_age_s, bool)
        and math.isfinite(cache_age_s)
        and cache_age_s >= 0
        else None,
    }
