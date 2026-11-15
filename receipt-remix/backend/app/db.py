"""SQLite storage. Deliberately ORM-free so anyone on the team can read/edit it."""
import os
import secrets
import sqlite3

DB_PATH = os.environ.get("DB_PATH", "receipts.db")
INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

SCHEMA = """
CREATE TABLE IF NOT EXISTS households (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS user_households (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, household_id)
);
CREATE TABLE IF NOT EXISTS household_invites (
    household_id INTEGER PRIMARY KEY REFERENCES households(id) ON DELETE CASCADE,
    invite_code TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY,
    household_id INTEGER NOT NULL REFERENCES households(id),
    name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS receipts (
    id INTEGER PRIMARY KEY,
    household_id INTEGER NOT NULL REFERENCES households(id),
    payer_id INTEGER REFERENCES members(id),
    store TEXT,
    purchased_at TEXT,            -- ISO date YYYY-MM-DD
    total REAL,
    currency TEXT DEFAULT 'GBP',
    status TEXT DEFAULT 'extracted',   -- extracted | confirmed
    raw_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS line_items (
    id INTEGER PRIMARY KEY,
    receipt_id INTEGER NOT NULL REFERENCES receipts(id),
    raw_text TEXT,
    name TEXT,
    canonical_name TEXT,
    brand TEXT,
    category TEXT,
    quantity REAL,
    price REAL,                   -- final price paid for the line, after discounts
    discount REAL DEFAULT 0,
    size_value REAL,
    size_unit TEXT,
    unit_price REAL,              -- price per kg / litre / each
    unit_basis TEXT,              -- 'kg' | 'l' | 'each'
    confidence REAL
);
CREATE TABLE IF NOT EXISTS assignments (
    line_item_id INTEGER NOT NULL REFERENCES line_items(id),
    member_id INTEGER NOT NULL REFERENCES members(id),
    PRIMARY KEY (line_item_id, member_id)
);
"""


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def generate_invite_code() -> str:
    return "".join(secrets.choice(INVITE_ALPHABET) for _ in range(7))


def create_household_invite(conn: sqlite3.Connection, household_id: int) -> str:
    for _ in range(10):
        invite_code = generate_invite_code()
        try:
            conn.execute(
                "INSERT INTO household_invites (household_id, invite_code) VALUES (?, ?)",
                (household_id, invite_code),
            )
            return invite_code
        except sqlite3.IntegrityError:
            collision = conn.execute(
                "SELECT 1 FROM household_invites WHERE invite_code = ?",
                (invite_code,),
            ).fetchone()
            if not collision:
                raise
    raise RuntimeError("Could not generate a unique household invite code")


def init() -> None:
    with connect() as conn:
        conn.executescript(SCHEMA)
        households_without_invites = conn.execute(
            """SELECT h.id FROM households h
               LEFT JOIN household_invites i ON i.household_id = h.id
               WHERE i.household_id IS NULL"""
        ).fetchall()
        for household in households_without_invites:
            create_household_invite(conn, household["id"])

        invalid_invites = conn.execute(
            """SELECT household_id FROM household_invites
               WHERE length(invite_code) != 7
                  OR invite_code GLOB '*[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]*'"""
        ).fetchall()
        for invite in invalid_invites:
            conn.execute(
                "DELETE FROM household_invites WHERE household_id = ?",
                (invite["household_id"],),
            )
            create_household_invite(conn, invite["household_id"])


def rows(cursor) -> list[dict]:
    return [dict(r) for r in cursor.fetchall()]
