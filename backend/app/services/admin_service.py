import datetime
import re
from typing import Dict, Any, List, Optional
from app.db.database import execute_query, execute_insert_or_update
from app.services.hybrid_retriever import HybridRetriever

def record_admin_activity(
    action_type: str,
    entity_type: str,
    entity_id: str,
    details: str,
    user_email: Optional[str] = "admin@bis.gov.in",
    user_name: Optional[str] = "Chief Technical Director",
    user_role: Optional[str] = "admin",
    ip_address: str = "127.0.0.1"
) -> int:
    now_str = datetime.datetime.utcnow().isoformat() + "Z"
    row_id = execute_insert_or_update(
        """
        INSERT INTO admin_activity_log (timestamp, action_type, entity_type, entity_id, details, user_email, user_name, user_role, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """,
        (now_str, action_type, entity_type, entity_id, details, user_email, user_name, user_role, ip_address)
    )
    return row_id

def get_admin_activity_log(limit: int = 50) -> List[Dict[str, Any]]:
    return execute_query("SELECT * FROM admin_activity_log ORDER BY id DESC LIMIT ?;", (limit,))

def create_standard(data: Dict[str, Any], admin_user: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    is_num = data.get("is_number", "").strip()
    title = data.get("title", "").strip()
    category = data.get("category", "Milk & Dairy")
    year = str(data.get("year", "2026")).strip()
    status = data.get("status", "Current")
    standard_type = data.get("standard_type", "Product Specification")
    scope = data.get("scope_text", f"Standard specification and requirements for {title}")
    
    clean_num = re.sub(r'[^a-zA-Z0-9]', '', is_num).upper()
    clean_title = re.sub(r'[^a-zA-Z0-9\s]', ' ', title).lower()
    
    # Check if is_number already exists
    existing = execute_query("SELECT id FROM standards WHERE is_number = ?;", (is_num,))
    if existing:
        raise ValueError(f"Standard with number '{is_num}' already exists.")

    new_id = execute_insert_or_update(
        """
        INSERT INTO standards (is_number, clean_number, title, clean_title, year, category, standard_type, status, scope_text, data_status, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """,
        (is_num, clean_num, title, clean_title, year, category, standard_type, status, scope, "REAL", "Admin Authorized Entry")
    )

    admin_email = admin_user.get("email") if admin_user else "admin@bis.gov.in"
    admin_name = admin_user.get("name") if admin_user else "Chief Technical Director"
    admin_role = admin_user.get("role") if admin_user else "admin"

    record_admin_activity(
        action_type="CREATE_STANDARD",
        entity_type="INDIAN_STANDARD",
        entity_id=is_num,
        details=f"Added new standard '{is_num} - {title}' ({category}, Rev: {year})",
        user_email=admin_email,
        user_name=admin_name,
        user_role=admin_role
    )

    # Hot reload retriever
    HybridRetriever.get_instance().reload()

    return {
        "id": new_id,
        "is_number": is_num,
        "title": title,
        "category": category,
        "year": year,
        "status": status,
        "message": f"Successfully created standard '{is_num}'"
    }

def update_standard(std_id_or_number: str, data: Dict[str, Any], admin_user: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    if std_id_or_number.isdigit():
        rows = execute_query("SELECT * FROM standards WHERE id = ?;", (int(std_id_or_number),))
    else:
        rows = execute_query("SELECT * FROM standards WHERE is_number = ?;", (std_id_or_number,))
    
    if not rows:
        raise ValueError(f"Standard '{std_id_or_number}' not found.")
    
    std = dict(rows[0])
    std_id = std["id"]
    is_num = std["is_number"]

    title = data.get("title", std["title"])
    category = data.get("category", std["category"])
    year = str(data.get("year", std["year"]))
    status = data.get("status", std["status"])
    scope = data.get("scope_text", std.get("scope_text", ""))
    standard_type = data.get("standard_type", std.get("standard_type", "Product Specification"))
    clean_title = re.sub(r'[^a-zA-Z0-9\s]', ' ', title).lower()

    execute_insert_or_update(
        """
        UPDATE standards 
        SET title = ?, clean_title = ?, category = ?, year = ?, status = ?, scope_text = ?, standard_type = ?
        WHERE id = ?;
        """,
        (title, clean_title, category, year, status, scope, standard_type, std_id)
    )

    admin_email = admin_user.get("email") if admin_user else "admin@bis.gov.in"
    admin_name = admin_user.get("name") if admin_user else "Chief Technical Director"
    admin_role = admin_user.get("role") if admin_user else "admin"

    record_admin_activity(
        action_type="UPDATE_STANDARD",
        entity_type="INDIAN_STANDARD",
        entity_id=is_num,
        details=f"Updated standard '{is_num}' (Status: {status}, Year: {year}, Category: {category})",
        user_email=admin_email,
        user_name=admin_name,
        user_role=admin_role
    )

    # Hot reload retriever
    HybridRetriever.get_instance().reload()

    return {
        "id": std_id,
        "is_number": is_num,
        "title": title,
        "category": category,
        "year": year,
        "status": status,
        "message": f"Successfully updated standard '{is_num}'"
    }

def delete_standard(std_id_or_number: str, admin_user: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    if std_id_or_number.isdigit():
        rows = execute_query("SELECT * FROM standards WHERE id = ?;", (int(std_id_or_number),))
    else:
        rows = execute_query("SELECT * FROM standards WHERE is_number = ?;", (std_id_or_number,))
    
    if not rows:
        raise ValueError(f"Standard '{std_id_or_number}' not found.")
    
    std = dict(rows[0])
    std_id = std["id"]
    is_num = std["is_number"]

    execute_insert_or_update("DELETE FROM standards WHERE id = ?;", (std_id,))

    admin_email = admin_user.get("email") if admin_user else "admin@bis.gov.in"
    admin_name = admin_user.get("name") if admin_user else "Chief Technical Director"
    admin_role = admin_user.get("role") if admin_user else "admin"

    record_admin_activity(
        action_type="DELETE_STANDARD",
        entity_type="INDIAN_STANDARD",
        entity_id=is_num,
        details=f"Deleted standard '{is_num}' from canonical catalog.",
        user_email=admin_email,
        user_name=admin_name,
        user_role=admin_role
    )

    # Hot reload retriever
    HybridRetriever.get_instance().reload()

    return {
        "id": std_id,
        "is_number": is_num,
        "message": f"Successfully deleted standard '{is_num}'"
    }
