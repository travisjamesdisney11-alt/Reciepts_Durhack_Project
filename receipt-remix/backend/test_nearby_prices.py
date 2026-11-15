import sqlite3
import unittest

from app import db
from app.nearby_prices import (
    CONSENT_VERSION,
    canonical_product_key,
    nearby_price_status,
    normalize_area_code,
)


class NearbyPriceTests(unittest.TestCase):
    def setUp(self):
        self.conn = sqlite3.connect(":memory:")
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA foreign_keys = ON")
        self.conn.executescript(db.SCHEMA)

    def tearDown(self):
        self.conn.close()

    def add_household(self, household_id, user_ids, area_code="DH1", consented=True):
        self.conn.execute(
            "INSERT INTO households (id, name) VALUES (?, ?)",
            (household_id, f"Household {household_id}"),
        )
        for user_id in user_ids:
            self.conn.execute(
                """INSERT INTO users (id, name, email, password_salt, password_hash)
                   VALUES (?, ?, ?, 'salt', 'hash')""",
                (user_id, f"User {user_id}", f"user{user_id}@example.test"),
            )
            self.conn.execute(
                "INSERT INTO user_households (user_id, household_id) VALUES (?, ?)",
                (user_id, household_id),
            )
            if consented:
                self.conn.execute(
                    """INSERT INTO price_sharing_consents
                           (household_id, user_id, enabled, area_code, consent_version)
                       VALUES (?, ?, 1, ?, ?)""",
                    (household_id, user_id, area_code, CONSENT_VERSION),
                )

    def add_item(
        self,
        household_id,
        unit_price,
        confidence=0.95,
        days_ago=0,
        status="confirmed",
        canonical_name="whole milk 2l",
    ):
        purchased_at = self.conn.execute(
            "SELECT date('now', ?)",
            (f"-{days_ago} days",),
        ).fetchone()[0]
        receipt_id = self.conn.execute(
            """INSERT INTO receipts (household_id, purchased_at, status, currency)
               VALUES (?, ?, ?, 'GBP')""",
            (household_id, purchased_at, status),
        ).lastrowid
        self.conn.execute(
            """INSERT INTO line_items
                   (receipt_id, name, canonical_name, price, unit_price, unit_basis, confidence)
               VALUES (?, 'Milk', ?, ?, ?, 'l', ?)""",
            (receipt_id, canonical_name, unit_price * 2, unit_price, confidence),
        )

    def test_area_code_accepts_only_coarse_postcode_districts(self):
        self.assertEqual(normalize_area_code(" dh1 "), "DH1")
        self.assertEqual(normalize_area_code("sw1a"), "SW1A")
        self.assertIsNone(normalize_area_code("DH1 1AB"))
        self.assertIsNone(normalize_area_code(""))
        self.assertEqual(
            canonical_product_key("Tesco semi-skimmed milk 1l"),
            canonical_product_key("tesco semi-skimmed milk 2l"),
        )

    def test_one_account_can_start_comparisons_and_share_household_prices(self):
        self.add_household(1, [101, 102], consented=False)
        self.add_item(1, 4)
        self.conn.execute(
            """INSERT INTO price_sharing_consents
                   (household_id, user_id, enabled, area_code, consent_version)
               VALUES (1, 101, 1, 'DH1', ?)""",
            (CONSENT_VERSION,),
        )
        for household_id in range(2, 7):
            self.add_household(household_id, [household_id])
            self.add_item(household_id, household_id)

        status = nearby_price_status(self.conn, 1, 101, 0.6)

        self.assertTrue(status["enabled"])
        self.assertTrue(status["contribution_ready"])
        self.assertEqual(status["state"], "available")
        self.assertEqual(status["comparisons"][0]["household_count"], 5)

    def test_stale_consent_rows_do_not_count_for_current_household_accounts(self):
        self.add_household(1, [1, 2], consented=False)
        self.conn.execute(
            """INSERT INTO price_sharing_consents
                   (household_id, user_id, enabled, area_code, consent_version)
               VALUES (1, 2, 1, 'DH1', ?)""",
            (CONSENT_VERSION,),
        )
        self.conn.execute(
            """INSERT INTO users (id, name, email, password_salt, password_hash)
               VALUES (3, 'User 3', 'user3@example.test', 'salt', 'hash')"""
        )
        self.conn.execute("DELETE FROM user_households WHERE household_id = 1 AND user_id = 2")
        self.conn.execute(
            "INSERT INTO user_households (user_id, household_id) VALUES (3, 1)"
        )

        status = nearby_price_status(self.conn, 1, 3, 0.6)

        self.assertFalse(status["contribution_ready"])
        self.assertEqual(status["state"], "not_opted_in")

    def test_only_recent_qualified_prices_from_five_other_households_are_shown(self):
        self.add_household(1, [1, 101])
        self.add_item(1, 4)
        # A housemate's receipt is still part of the same excluded household.
        self.add_item(1, 1000)
        community_prices = [2, 3, 4, 5, 6]
        for offset, unit_price in enumerate(community_prices, start=2):
            self.add_household(offset, [offset])
            self.add_item(
                offset,
                unit_price,
                canonical_name="whole milk 1l" if offset == 3 else "whole milk 2l",
            )

        # Multiple receipts from one household count once and use that household's median.
        self.add_item(2, 100)
        # These records must not count toward local support.
        self.add_household(7, [7])
        self.add_item(7, 200, confidence=0.4)
        self.add_household(8, [8], area_code="NE1")
        self.add_item(8, 300)
        self.add_household(9, [9])
        self.add_item(9, 400, days_ago=120)
        self.add_household(10, [10])
        self.add_item(10, 500, status="extracted")
        self.add_household(11, [11, 12], consented=False)
        self.conn.execute(
            """INSERT INTO price_sharing_consents
                   (household_id, user_id, enabled, area_code, consent_version)
               VALUES (11, 11, 1, 'DH1', ?)""",
            (CONSENT_VERSION,),
        )
        self.add_item(11, 900)

        status = nearby_price_status(self.conn, 1, 1, 0.6)

        self.assertEqual(status["state"], "available")
        self.assertEqual(len(status["comparisons"]), 1)
        comparison = status["comparisons"][0]
        self.assertEqual(comparison["household_count"], 6)
        self.assertEqual(comparison["household_unit_price"], 502)
        self.assertEqual(comparison["nearby_median_unit_price"], 5.5)

    def test_withdrawing_one_household_consent_removes_its_data_immediately(self):
        self.add_household(1, [1])
        self.add_item(1, 4)
        for household_id in range(2, 7):
            self.add_household(household_id, [household_id])
            self.add_item(household_id, household_id)

        self.assertEqual(nearby_price_status(self.conn, 1, 1, 0.6)["state"], "available")
        self.conn.execute(
            """UPDATE price_sharing_consents
               SET enabled = 0, area_code = NULL, consent_version = NULL
               WHERE household_id = 2 AND user_id = 2"""
        )

        status = nearby_price_status(self.conn, 1, 1, 0.6)

        self.assertEqual(status["state"], "insufficient_local_data")
        self.assertEqual(status["comparisons"], [])


if __name__ == "__main__":
    unittest.main()
