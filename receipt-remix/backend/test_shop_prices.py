import os
import unittest
from unittest.mock import patch
from urllib.parse import parse_qs

from app.shop_prices import (
    InvalidPostcodeError,
    PriceProviderNotConfigured,
    find_nearby_shops,
    search_online_offers,
)


class ShopPriceTests(unittest.TestCase):
    @patch("app.shop_prices._fetch_json")
    def test_full_postcode_returns_named_shops_without_coordinates(self, fetch_json):
        fetch_json.side_effect = [
            {"result": {"latitude": 54.776, "longitude": -1.576}},
            {
                "elements": [
                    {
                        "type": "node",
                        "id": 123,
                        "lat": 54.777,
                        "lon": -1.575,
                        "tags": {"name": "Local Market", "shop": "supermarket"},
                    },
                    {
                        "type": "way",
                        "id": 456,
                        "center": {"lat": 54.778, "lon": -1.574},
                        "tags": {"brand": "Corner Shop", "shop": "convenience"},
                    },
                    {
                        "type": "node",
                        "id": 789,
                        "lat": 54.779,
                        "lon": -1.573,
                        "tags": {"shop": "convenience"},
                    },
                ]
            },
        ]

        result = find_nearby_shops("dh1 1ab")

        self.assertEqual(result["radius_km"], 5)
        self.assertEqual([shop["name"] for shop in result["shops"]], [
            "Local Market",
            "Corner Shop",
        ])
        self.assertEqual(result["shops"][0]["distance_km"], 0.1)
        self.assertNotIn("latitude", result["shops"][0])
        postcode_url = fetch_json.call_args_list[0].args[0]
        self.assertTrue(postcode_url.endswith("/DH11AB"))
        overpass_query = parse_qs(
            fetch_json.call_args_list[1].kwargs["data"].decode()
        )["data"][0]
        self.assertIn("around:5000", overpass_query)

    @patch("app.shop_prices._fetch_json")
    def test_invalid_full_postcode_is_rejected_without_external_lookup(self, fetch_json):
        with self.assertRaises(InvalidPostcodeError):
            find_nearby_shops("DH1")
        fetch_json.assert_not_called()

    @patch.dict(os.environ, {"PRICESAPI_API_KEY": "pricesapi_test_key"})
    @patch("app.shop_prices._fetch_json")
    def test_online_offers_use_server_key_and_keep_offer_data(self, fetch_json):
        fetch_json.return_value = {
            "success": True,
            "data": {
                "products": [
                    {
                        "title": "Whole milk 2L",
                        "offers": [
                            {
                                "seller": "Example Store",
                                "product_title": "Whole milk 2L",
                                "price": 1.65,
                                "currency": "GBP",
                                "stock_status": "In stock",
                                "delivery_info": "Delivery available",
                                "url": "https://example.test/milk",
                            },
                            {
                                "seller": "Unsafe link",
                                "price": 1.5,
                                "currency": "GBP",
                                "url": "javascript:alert(1)",
                            },
                        ],
                    }
                ]
            },
            "meta": {"scraped_at": "2026-11-15T09:00:00Z"},
        }

        result = search_online_offers("  whole   milk 2L ")

        self.assertEqual(result["query"], "whole milk 2L")
        self.assertEqual(len(result["products"][0]["offers"]), 2)
        self.assertEqual(result["products"][0]["offers"][0]["price"], 1.65)
        self.assertIsNone(result["products"][0]["offers"][1]["url"])
        request_url = fetch_json.call_args.args[0]
        self.assertIn("market=gb", request_url)
        self.assertEqual(
            fetch_json.call_args.kwargs["headers"]["Authorization"],
            "Bearer pricesapi_test_key",
        )

    @patch.dict(os.environ, {}, clear=True)
    @patch("app.shop_prices._fetch_json")
    def test_online_search_requires_a_server_api_key(self, fetch_json):
        with self.assertRaises(PriceProviderNotConfigured):
            search_online_offers("whole milk")
        fetch_json.assert_not_called()


if __name__ == "__main__":
    unittest.main()
