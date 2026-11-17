"""
Scholarship Sathi — Database Setup
===================================
Module : backend/database.py

Creates and manages the SQLite database.
Tables: users, student_profiles, application_statuses
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scholarship_sathi.db")


def get_connection():
    """Return a new SQLite connection with row_factory so rows behave like dicts."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """
    Create all tables if they do not already exist.
    Safe to call on every startup.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Users table — stores credentials only
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT    NOT NULL,
            email      TEXT    NOT NULL UNIQUE,
            password   TEXT    NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Student profiles — one row per user, updated on save
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS student_profiles (
            user_id       INTEGER PRIMARY KEY REFERENCES users(id),
            nationality   TEXT DEFAULT 'Indian',
            category      TEXT DEFAULT 'General',
            annual_income INTEGER DEFAULT 200000,
            state         TEXT DEFAULT 'Assam',
            course        TEXT DEFAULT 'Undergraduate (B.Tech / B.E.)',
            marks         REAL DEFAULT 80.0,
            gender        TEXT DEFAULT 'Any',
            citizenship   TEXT DEFAULT 'Indian',
            updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Ensure nationality column exists if table was created earlier
    try:
        cursor.execute("ALTER TABLE student_profiles ADD COLUMN nationality TEXT DEFAULT 'Indian'")
    except sqlite3.OperationalError:
        pass

    # Application tracking table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS application_statuses (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            scholarship_id INTEGER NOT NULL,
            status         TEXT,
            updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()
    print(f"[DB] Initialised → {DB_PATH}")


if __name__ == "__main__":
    init_db()
