"""Relational SQLite database manager for InterviewAI user accounts and profiles."""
import os
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DB_PATH = BASE_DIR / "interviewai.db"


def get_db_path() -> Path:
    custom_path = os.getenv("DATABASE_PATH")
    if custom_path:
        return Path(custom_path).resolve()
    return DEFAULT_DB_PATH


def get_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    target = db_path or get_db_path()
    target.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(target), timeout=15.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn


def init_db(db_path: Optional[Path] = None) -> None:
    """Initialize database tables and indexes idempotently."""
    conn = get_connection(db_path)
    try:
        with conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT DEFAULT '',
                    first_name TEXT DEFAULT '',
                    last_name TEXT DEFAULT '',
                    avatar_url TEXT DEFAULT '',
                    auth_provider TEXT NOT NULL DEFAULT 'google',
                    google_id TEXT UNIQUE,
                    linkedin_id TEXT UNIQUE,
                    phone TEXT DEFAULT '',
                    bio_summary TEXT DEFAULT '',
                    primary_field TEXT DEFAULT '',
                    linkedin_url TEXT DEFAULT '',
                    github_url TEXT DEFAULT '',
                    portfolio_url TEXT DEFAULT '',
                    other_activities TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
                CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
                CREATE INDEX IF NOT EXISTS idx_users_linkedin_id ON users(linkedin_id);

                CREATE TABLE IF NOT EXISTS education_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    degree_title TEXT NOT NULL,
                    field_of_study TEXT DEFAULT '',
                    institution TEXT NOT NULL,
                    start_year TEXT DEFAULT '',
                    end_year TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_education_user_id ON education_history(user_id);
                """
            )
    finally:
        conn.close()


def find_or_create_user(
    provider: str,
    provider_id: str,
    email: str,
    name: str = "",
    first_name: str = "",
    last_name: str = "",
    avatar_url: str = "",
    db_path: Optional[Path] = None,
) -> Dict[str, Any]:
    """
    Find existing user by provider ID or email; create if not found.
    Updates avatar and name if newly supplied.
    """
    conn = get_connection(db_path)
    try:
        with conn:
            user = None
            clean_email = (email or "").strip().lower()

            # 1. Match by provider-specific ID
            if provider == "google" and provider_id:
                cursor = conn.execute("SELECT * FROM users WHERE google_id = ?", (provider_id,))
                user = cursor.fetchone()
            elif provider == "linkedin" and provider_id:
                cursor = conn.execute("SELECT * FROM users WHERE linkedin_id = ?", (provider_id,))
                user = cursor.fetchone()

            # 2. Match by email
            if not user and clean_email:
                cursor = conn.execute("SELECT * FROM users WHERE email = ?", (clean_email,))
                user = cursor.fetchone()

            if user:
                # Update existing user profile metadata and link provider ID
                user_id = user["id"]
                updates = ["updated_at = CURRENT_TIMESTAMP"]
                params: List[Any] = []

                if provider == "google" and not user["google_id"] and provider_id:
                    updates.append("google_id = ?")
                    params.append(provider_id)
                elif provider == "linkedin" and not user["linkedin_id"] and provider_id:
                    updates.append("linkedin_id = ?")
                    params.append(provider_id)

                if avatar_url and not user["avatar_url"]:
                    updates.append("avatar_url = ?")
                    params.append(avatar_url)

                if not user["name"] and name:
                    updates.append("name = ?")
                    params.append(name)
                if not user["first_name"] and first_name:
                    updates.append("first_name = ?")
                    params.append(first_name)
                if not user["last_name"] and last_name:
                    updates.append("last_name = ?")
                    params.append(last_name)

                if len(updates) > 1:
                    params.append(user_id)
                    conn.execute(
                        f"UPDATE users SET {', '.join(updates)} WHERE id = ?",
                        params,
                    )

                cursor = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
                return dict(cursor.fetchone())

            # 3. Create new user
            display_name = (name or f"{first_name} {last_name}").strip() or clean_email.split("@")[0]
            cursor = conn.execute(
                """
                INSERT INTO users (
                    email, name, first_name, last_name, avatar_url, auth_provider,
                    google_id, linkedin_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    clean_email,
                    display_name,
                    first_name,
                    last_name,
                    avatar_url,
                    provider,
                    provider_id if provider == "google" else None,
                    provider_id if provider == "linkedin" else None,
                ),
            )
            new_id = cursor.lastrowid
            cursor = conn.execute("SELECT * FROM users WHERE id = ?", (new_id,))
            return dict(cursor.fetchone())
    finally:
        conn.close()


def get_user_profile(user_id: int, db_path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    """Retrieve full user profile and associated education entries."""
    conn = get_connection(db_path)
    try:
        cursor = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user_row = cursor.fetchone()
        if not user_row:
            return None

        profile = dict(user_row)

        edu_cursor = conn.execute(
            """
            SELECT id, degree_title, field_of_study, institution, start_year, end_year
            FROM education_history
            WHERE user_id = ?
            ORDER BY id ASC
            """,
            (user_id,),
        )
        profile["education"] = [dict(row) for row in edu_cursor.fetchall()]
        return profile
    finally:
        conn.close()


def update_user_profile(
    user_id: int,
    data: Dict[str, Any],
    db_path: Optional[Path] = None,
) -> Optional[Dict[str, Any]]:
    """Update user contact, platforms, and extracurricular details."""
    conn = get_connection(db_path)
    try:
        with conn:
            allowed_fields = [
                "name",
                "first_name",
                "last_name",
                "email",
                "phone",
                "bio_summary",
                "primary_field",
                "linkedin_url",
                "github_url",
                "portfolio_url",
                "other_activities",
            ]
            updates = ["updated_at = CURRENT_TIMESTAMP"]
            params: List[Any] = []

            for field in allowed_fields:
                if field in data:
                    updates.append(f"{field} = ?")
                    params.append(str(data[field]).strip() if data[field] is not None else "")

            params.append(user_id)
            conn.execute(
                f"UPDATE users SET {', '.join(updates)} WHERE id = ?",
                params,
            )

            # If education array is provided, replace entries
            if "education" in data and isinstance(data["education"], list):
                conn.execute("DELETE FROM education_history WHERE user_id = ?", (user_id,))
                for item in data["education"]:
                    if not isinstance(item, dict):
                        continue
                    degree = (item.get("degree_title") or "").strip()
                    institution = (item.get("institution") or "").strip()
                    if not degree and not institution:
                        continue
                    conn.execute(
                        """
                        INSERT INTO education_history (
                            user_id, degree_title, field_of_study, institution, start_year, end_year
                        ) VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (
                            user_id,
                            degree,
                            (item.get("field_of_study") or "").strip(),
                            institution,
                            (item.get("start_year") or "").strip(),
                            (item.get("end_year") or "").strip(),
                        ),
                    )

        return get_user_profile(user_id, db_path)
    finally:
        conn.close()
