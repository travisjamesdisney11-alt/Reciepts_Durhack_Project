import sqlite3
import unittest

from app import db


class InviteCodeTests(unittest.TestCase):
    def test_code_uses_seven_easy_to_read_letters_and_numbers(self):
        code = db.generate_invite_code()

        self.assertEqual(len(code), 7)
        self.assertTrue(set(code).issubset(set(db.INVITE_ALPHABET)))

    def test_code_is_saved_and_unique_per_household(self):
        conn = sqlite3.connect(":memory:")
        conn.execute(
            """CREATE TABLE household_invites (
                   household_id INTEGER PRIMARY KEY,
                   invite_code TEXT NOT NULL UNIQUE
               )"""
        )
        self.addCleanup(conn.close)

        first = db.create_household_invite(conn, 1)
        second = db.create_household_invite(conn, 2)

        self.assertEqual(len(first), 7)
        self.assertEqual(len(second), 7)
        self.assertNotEqual(first, second)


if __name__ == "__main__":
    unittest.main()
