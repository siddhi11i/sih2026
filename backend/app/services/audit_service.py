import datetime
import hashlib
from typing import Dict, Any, List, Optional
from app.db.database import execute_insert_or_update, execute_query

def log_recommendation_audit(
    query_text: str,
    results_count: int,
    top_standard: Optional[str],
    data_version: str,
    user_role: str = "anonymous",
    client_ip: str = "127.0.0.1",
    details: str = ""
):
    ip_hash = hashlib.sha256(client_ip.encode()).hexdigest()[:12]
    now_str = datetime.datetime.utcnow().isoformat() + "Z"
    execute_insert_or_update(
        """
        INSERT INTO audit_logs (timestamp, event_type, user_role, query_text, results_count, top_standard, data_version, ip_hash, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """,
        (now_str, "RECOMMENDATION_QUERY", user_role, query_text, results_count, top_standard, data_version, ip_hash, details)
    )

def record_human_review(
    query_text: str,
    standard_number: str,
    decision: str,
    reviewer_name: str,
    reviewer_role: str,
    feedback: Optional[str] = None,
    data_version: str = "v1.0.0"
) -> int:
    now_str = datetime.datetime.utcnow().isoformat() + "Z"
    row_id = execute_insert_or_update(
        """
        INSERT INTO reviews (timestamp, query_text, standard_number, decision, reviewer_name, reviewer_role, feedback, data_version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """,
        (now_str, query_text, standard_number, decision, reviewer_name, reviewer_role, feedback or "", data_version)
    )
    return row_id

def get_recent_audit_logs(limit: int = 50) -> List[Dict[str, Any]]:
    return execute_query("SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?;", (limit,))

def get_human_reviews(limit: int = 50) -> List[Dict[str, Any]]:
    return execute_query("SELECT * FROM reviews ORDER BY id DESC LIMIT ?;", (limit,))
