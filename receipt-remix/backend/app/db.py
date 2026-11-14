"""SQLite storage. Deliberately ORM-free so anyone on the team can read/edit it."""
import os
import sqlite3

DB_PATH = os.environ.get("DB_PATH", "receipts.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS households (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
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


def init() -> None:
    with connect() as conn:
        conn.executescript(SCHEMA)


def rows(cursor) -> list[dict]:
    return [dict(r) for r in cursor.fetchall()]
