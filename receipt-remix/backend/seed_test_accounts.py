"""Seed local auth demo accounts into an explicitly named test database.

    python seed_test_accounts.py --db-path /tmp/receipt-remix-test.db
"""
import argparse
import os
from pathlib import Path

TEST_PASSWORD = "ReceiptRemix!2026"
TEST_ACCOUNTS = (
    ("Alex Test", "alex@receipt-remix.test"),
    ("Sam Test", "sam@receipt-remix.test"),
    ("Casey Test", "casey@receipt-remix.test"),
)
TEST_HOUSEHOLD = "Synthetic Test Flat"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--db-path",
        required=True,
        help="explicit local test database path (its filename must include 'test')",
    )
    args = parser.parse_args()
    db_path = Path(args.db_path).expanduser().resolve()
    if "test" not in db_path.stem.casefold():
        parser.error("the database filename must include 'test' to avoid seeding the app database")
    db_path.parent.mkdir(parents=True, exist_ok=True)
    os.environ["DB_PATH"] = str(db_path)

    from app import auth, db

    db.init()
    user_ids = {}
    with db.connect() as conn:
        for name, email in TEST_ACCOUNTS:
            salt, password_hash = auth.hash_password(TEST_PASSWORD)
            user = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
            if user:
                user_id = user["id"]
                conn.execute(
                    "UPDATE users SET name = ?, password_salt = ?, password_hash = ? WHERE id = ?",
                    (name, salt, password_hash, user_id),
                )
            else:
                user_id = conn.execute(
                    "INSERT INTO users (name, email, password_salt, password_hash) VALUES (?, ?, ?, ?)",
                    (name, email, salt, password_hash),
                ).lastrowid
            user_ids[email] = user_id

        household = conn.execute("SELECT id FROM households WHERE name = ?", (TEST_HOUSEHOLD,)).fetchone()
        if household:
            household_id = household["id"]
        else:
            household_id = conn.execute(
                "INSERT INTO households (name) VALUES (?)",
                (TEST_HOUSEHOLD,),
            ).lastrowid

        invite = conn.execute(
            "SELECT 1 FROM household_invites WHERE household_id = ?",
            (household_id,),
        ).fetchone()
        if not invite:
            db.create_household_invite(conn, household_id)

        for email in ("alex@receipt-remix.test", "sam@receipt-remix.test"):
            conn.execute(
                "INSERT OR IGNORE INTO user_households (user_id, household_id) VALUES (?, ?)",
                (user_ids[email], household_id),
            )

        for name in ("Alex Test", "Sam Test"):
            member = conn.execute(
                "SELECT id FROM members WHERE household_id = ? AND name = ? COLLATE NOCASE",
                (household_id, name),
            ).fetchone()
            if not member:
                conn.execute(
                    "INSERT INTO members (household_id, name) VALUES (?, ?)",
                    (household_id, name),
                )

    print(f"Test accounts initialized in {db_path}")
    for name, email in TEST_ACCOUNTS:
        print(f"  {name}: {email}")
    print(f"Password for all accounts: {TEST_PASSWORD}")
    print("Alex and Sam share a test household; Casey has no household.")


if __name__ == "__main__":
    main()
