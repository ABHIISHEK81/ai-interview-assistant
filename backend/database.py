"""Relational SQLite database manager for InterviewAI user accounts and profiles."""
import json
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
                    target_role TEXT DEFAULT '',
                    experience_level TEXT DEFAULT 'Mid-Level',
                    skills TEXT DEFAULT '',
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
                    grade_or_honors TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_education_user_id ON education_history(user_id);

                CREATE TABLE IF NOT EXISTS work_experience (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    job_title TEXT NOT NULL,
                    company TEXT NOT NULL,
                    location TEXT DEFAULT '',
                    start_date TEXT DEFAULT '',
                    end_date TEXT DEFAULT '',
                    is_current INTEGER DEFAULT 0,
                    description TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_work_exp_user_id ON work_experience(user_id);

                CREATE TABLE IF NOT EXISTS interview_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    role TEXT NOT NULL,
                    overall_score INTEGER DEFAULT 0,
                    technical_score INTEGER DEFAULT 0,
                    hr_score INTEGER DEFAULT 0,
                    answers_count INTEGER DEFAULT 0,
                    summary TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_interview_history_user_id ON interview_history(user_id);
                """
            )

            # Safely check and add columns if upgrading an existing SQLite database
            cursor = conn.execute("PRAGMA table_info(users)")
            existing_cols = {row["name"] for row in cursor.fetchall()}
            if "target_role" not in existing_cols:
                conn.execute("ALTER TABLE users ADD COLUMN target_role TEXT DEFAULT ''")
            if "experience_level" not in existing_cols:
                conn.execute("ALTER TABLE users ADD COLUMN experience_level TEXT DEFAULT 'Mid-Level'")
            if "skills" not in existing_cols:
                conn.execute("ALTER TABLE users ADD COLUMN skills TEXT DEFAULT ''")

            edu_cursor = conn.execute("PRAGMA table_info(education_history)")
            existing_edu_cols = {row["name"] for row in edu_cursor.fetchall()}
            if "grade_or_honors" not in existing_edu_cols:
                conn.execute("ALTER TABLE education_history ADD COLUMN grade_or_honors TEXT DEFAULT ''")
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
    """Retrieve full user profile, associated education, work experience, and interview performance statistics."""
    conn = get_connection(db_path)
    try:
        cursor = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user_row = cursor.fetchone()
        if not user_row:
            return None

        profile = dict(user_row)
        profile["full_name"] = profile.get("name") or ""
        profile["bio"] = profile.get("bio_summary") or ""
        profile["target_role"] = profile.get("target_role") or ""
        profile["experience_level"] = profile.get("experience_level") or "Mid-Level"

        # Format skills as a clean list
        skills_raw = (profile.get("skills") or "").strip()
        if skills_raw.startswith("[") and skills_raw.endswith("]"):
            try:
                parsed_skills = json.loads(skills_raw)
                profile["skills_list"] = parsed_skills if isinstance(parsed_skills, list) else []
            except Exception:
                profile["skills_list"] = [s.strip() for s in skills_raw.strip("[]").replace('"', '').replace("'", '').split(",") if s.strip()]
        else:
            profile["skills_list"] = [s.strip() for s in skills_raw.split(",") if s.strip()]

        # 1. Education History
        edu_cursor = conn.execute(
            """
            SELECT id, degree_title, field_of_study, institution, start_year, end_year, grade_or_honors
            FROM education_history
            WHERE user_id = ?
            ORDER BY id ASC
            """,
            (user_id,),
        )
        profile["education"] = [dict(row) for row in edu_cursor.fetchall()]

        # 2. Work & Professional Experience
        work_cursor = conn.execute(
            """
            SELECT id, job_title, company, location, start_date, end_date, is_current, description
            FROM work_experience
            WHERE user_id = ?
            ORDER BY id ASC
            """,
            (user_id,),
        )
        profile["work_experience"] = [dict(row) for row in work_cursor.fetchall()]

        # 3. Interview History & Performance Statistics
        history_cursor = conn.execute(
            """
            SELECT id, role, overall_score, technical_score, hr_score, answers_count, summary, created_at
            FROM interview_history
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT 15
            """,
            (user_id,),
        )
        history = [dict(row) for row in history_cursor.fetchall()]
        profile["interview_history"] = history

        total_interviews = len(history)
        if total_interviews > 0:
            avg_overall = round(sum(h.get("overall_score", 0) for h in history) / total_interviews)
            avg_tech = round(sum(h.get("technical_score", 0) for h in history) / total_interviews)
            avg_hr = round(sum(h.get("hr_score", 0) for h in history) / total_interviews)
            highest_score = max(h.get("overall_score", 0) for h in history)
        else:
            avg_overall = 0
            avg_tech = 0
            avg_hr = 0
            highest_score = 0

        if avg_overall >= 85:
            readiness = "Tier-1 / High Readiness"
        elif avg_overall >= 70:
            readiness = "Solid / Interview Ready"
        elif avg_overall > 0:
            readiness = "Developing / More Practice Recommended"
        else:
            readiness = "Not Assessed Yet"

        profile["interview_stats"] = {
            "total_interviews": total_interviews,
            "avg_overall_score": avg_overall,
            "avg_technical_score": avg_tech,
            "avg_hr_score": avg_hr,
            "highest_score": highest_score,
            "readiness_rating": readiness,
        }

        return profile
    finally:
        conn.close()


def update_user_profile(
    user_id: int,
    data: Dict[str, Any],
    db_path: Optional[Path] = None,
) -> Optional[Dict[str, Any]]:
    """Update user contact, platforms, role, skills, work experience, and educational details."""
    conn = get_connection(db_path)
    try:
        with conn:
            allowed_fields = [
                "name",
                "first_name",
                "last_name",
                "email",
                "phone",
                "avatar_url",
                "bio_summary",
                "primary_field",
                "target_role",
                "experience_level",
                "skills",
                "linkedin_url",
                "github_url",
                "portfolio_url",
                "other_activities",
            ]
            updates = ["updated_at = CURRENT_TIMESTAMP"]
            params: List[Any] = []

            # Handle skills formatting
            if "skills" in data:
                if isinstance(data["skills"], list):
                    clean_skills = [str(s).strip() for s in data["skills"] if str(s).strip()]
                    data["skills"] = json.dumps(clean_skills)
                elif isinstance(data["skills"], str):
                    data["skills"] = data["skills"].strip()

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
                    degree = (item.get("degree_title") or item.get("degree") or "").strip()
                    institution = (item.get("institution") or "").strip()
                    if not degree and not institution:
                        continue
                    conn.execute(
                        """
                        INSERT INTO education_history (
                            user_id, degree_title, field_of_study, institution, start_year, end_year, grade_or_honors
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            user_id,
                            degree,
                            (item.get("field_of_study") or item.get("major") or "").strip(),
                            institution,
                            (item.get("start_year") or "").strip(),
                            (item.get("end_year") or "").strip(),
                            (item.get("grade_or_honors") or item.get("gpa") or "").strip(),
                        ),
                    )

            # If work_experience array is provided, replace entries
            if "work_experience" in data and isinstance(data["work_experience"], list):
                conn.execute("DELETE FROM work_experience WHERE user_id = ?", (user_id,))
                for item in data["work_experience"]:
                    if not isinstance(item, dict):
                        continue
                    job_title = (item.get("job_title") or item.get("role") or item.get("title") or "").strip()
                    company = (item.get("company") or item.get("company_name") or item.get("organization") or "").strip()
                    if not job_title and not company:
                        continue
                    conn.execute(
                        """
                        INSERT INTO work_experience (
                            user_id, job_title, company, location, start_date, end_date, is_current, description
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            user_id,
                            job_title,
                            company,
                            (item.get("location") or "").strip(),
                            (item.get("start_date") or item.get("duration") or item.get("start_year") or "").strip(),
                            (item.get("end_date") or item.get("end_year") or "").strip(),
                            1 if item.get("is_current") else 0,
                            (item.get("description") or item.get("highlights") or "").strip(),
                        ),
                    )

        return get_user_profile(user_id, db_path)
    finally:
        conn.close()


def record_interview_result(
    user_id: int,
    role: str,
    overall_score: int,
    technical_score: int = 0,
    hr_score: int = 0,
    answers_count: int = 0,
    summary: str = "",
    db_path: Optional[Path] = None,
) -> Optional[Dict[str, Any]]:
    """Log an evaluated mock interview session into the user's permanent interview history."""
    conn = get_connection(db_path)
    try:
        with conn:
            cursor = conn.execute(
                """
                INSERT INTO interview_history (
                    user_id, role, overall_score, technical_score, hr_score, answers_count, summary
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    (role or "General Technical Role").strip(),
                    int(overall_score or 0),
                    int(technical_score or 0),
                    int(hr_score or 0),
                    int(answers_count or 0),
                    (summary or "").strip(),
                ),
            )
            new_id = cursor.lastrowid
            row = conn.execute("SELECT * FROM interview_history WHERE id = ?", (new_id,)).fetchone()
            return dict(row) if row else None
    finally:
        conn.close()
