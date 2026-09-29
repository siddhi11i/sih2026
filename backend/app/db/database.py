import sqlite3
import os
from typing import Generator, List, Dict, Any
from app.config import settings

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS admin_activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            action_type TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            details TEXT,
            user_email TEXT,
            user_name TEXT,
            user_role TEXT,
            ip_address TEXT
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            event_type TEXT NOT NULL,
            user_role TEXT,
            query_text TEXT,
            results_count INTEGER,
            top_standard TEXT,
            data_version TEXT,
            ip_hash TEXT,
            details TEXT
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            query_text TEXT,
            standard_number TEXT NOT NULL,
            decision TEXT NOT NULL,
            reviewer_name TEXT,
            reviewer_role TEXT,
            feedback TEXT,
            data_version TEXT
        );
    """)
    conn.commit()
    conn.close()

# Auto-initialize on import
init_db()

def execute_query(sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(sql, params)
    rows = cur.fetchall()
    result = [dict(row) for row in rows]
    conn.close()
    return result

def execute_insert_or_update(sql: str, params: tuple = ()) -> int:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(sql, params)
    conn.commit()
    last_id = cur.lastrowid
    conn.close()
    return last_id

