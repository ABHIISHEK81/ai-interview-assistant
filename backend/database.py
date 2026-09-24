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
                    location TEXT DEFAULT '',
                    bio_summary TEXT DEFAULT '',
                    primary_field TEXT DEFAULT '',
                    professional_title TEXT DEFAULT '',
                    target_role TEXT DEFAULT '',
                    experience_level TEXT DEFAULT 'Mid-Level',
                    job_type TEXT DEFAULT 'Full-time',
                    preferred_location TEXT DEFAULT '',
                    job_status TEXT DEFAULT 'Actively Interviewing',
                    skills TEXT DEFAULT '',
                    soft_skills TEXT DEFAULT '',
                    linkedin_url TEXT DEFAULT '',
                    github_url TEXT DEFAULT '',
                    portfolio_url TEXT DEFAULT '',
                    behance_url TEXT DEFAULT '',
                    dribbble_url TEXT DEFAULT '',
                    other_activities TEXT DEFAULT '',
                    resume_filename TEXT DEFAULT '',
                    resume_uploaded_at TEXT DEFAULT '',
                    resume_file_base64 TEXT DEFAULT '',
                    privacy_level TEXT DEFAULT 'public',
                    email_notifications INTEGER DEFAULT 1,
                    sms_notifications INTEGER DEFAULT 1,
                    job_alerts INTEGER DEFAULT 1,
                    two_factor_enabled INTEGER DEFAULT 0,
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

                CREATE TABLE IF NOT EXISTS booked_slots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    role TEXT NOT NULL,
                    slot_date TEXT NOT NULL,
                    slot_time TEXT NOT NULL,
                    interviewer_type TEXT DEFAULT 'AI Technical Interviewer',
                    status TEXT DEFAULT 'Confirmed',
                    notes TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_booked_slots_user_id ON booked_slots(user_id);
                """
            )

            # Safely check and add columns if upgrading an existing SQLite database
            cursor = conn.execute("PRAGMA table_info(users)")
            existing_cols = {row["name"] for row in cursor.fetchall()}
            upgrade_columns = [
                ("target_role", "TEXT DEFAULT ''"),
                ("experience_level", "TEXT DEFAULT 'Mid-Level'"),
                ("skills", "TEXT DEFAULT ''"),
                ("soft_skills", "TEXT DEFAULT ''"),
                ("location", "TEXT DEFAULT ''"),
                ("professional_title", "TEXT DEFAULT ''"),
                ("job_type", "TEXT DEFAULT 'Full-time'"),
                ("preferred_location", "TEXT DEFAULT ''"),
                ("job_status", "TEXT DEFAULT 'Actively Interviewing'"),
                ("behance_url", "TEXT DEFAULT ''"),
                ("dribbble_url", "TEXT DEFAULT ''"),
                ("resume_filename", "TEXT DEFAULT ''"),
                ("resume_uploaded_at", "TEXT DEFAULT ''"),
                ("resume_file_base64", "TEXT DEFAULT ''"),
                ("privacy_level", "TEXT DEFAULT 'public'"),
                ("email_notifications", "INTEGER DEFAULT 1"),
                ("sms_notifications", "INTEGER DEFAULT 1"),
                ("job_alerts", "INTEGER DEFAULT 1"),
                ("two_factor_enabled", "INTEGER DEFAULT 0"),
            ]
            for col_name, col_type in upgrade_columns:
                if col_name not in existing_cols:
                    conn.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")

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
    """Retrieve full user profile, associated education, work experience, interview performance, and booked slots."""
    conn = get_connection(db_path)
    try:
        cursor = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user_row = cursor.fetchone()
        if not user_row:
            return None

        profile = dict(user_row)
        profile["full_name"] = profile.get("name") or ""
        profile["bio"] = profile.get("bio_summary") or ""
        profile["target_role"] = profile.get("target_role") or "Full Stack Software Engineer"
        profile["experience_level"] = profile.get("experience_level") or "Mid-Level"
        profile["professional_title"] = profile.get("professional_title") or profile.get("target_role") or "Senior Frontend Developer"
        profile["location"] = profile.get("location") or "Bengaluru, India"
        profile["job_type"] = profile.get("job_type") or "Full-time"
        profile["preferred_location"] = profile.get("preferred_location") or "Hybrid / Remote"
        profile["job_status"] = profile.get("job_status") or "Actively Interviewing"
        profile["privacy_level"] = profile.get("privacy_level") or "public"
        profile["email_notifications"] = 1 if profile.get("email_notifications") in (1, "1", True) else 0
        profile["sms_notifications"] = 1 if profile.get("sms_notifications") in (1, "1", True) else 0
        profile["job_alerts"] = 1 if profile.get("job_alerts") in (1, "1", True) else 0
        profile["two_factor_enabled"] = 1 if profile.get("two_factor_enabled") in (1, "1", True) else 0

        # Format technical skills as a clean list
        skills_raw = (profile.get("skills") or "").strip()
        if skills_raw.startswith("[") and skills_raw.endswith("]"):
            try:
                parsed_skills = json.loads(skills_raw)
                profile["skills_list"] = parsed_skills if isinstance(parsed_skills, list) else []
            except Exception:
                profile["skills_list"] = [s.strip() for s in skills_raw.strip("[]").replace('"', '').replace("'", '').split(",") if s.strip()]
        else:
            profile["skills_list"] = [s.strip() for s in skills_raw.split(",") if s.strip()]
        if not profile["skills_list"]:
            profile["skills_list"] = ["Python", "React", "TypeScript", "FastAPI", "SQL", "Docker", "System Design"]

        # Format soft skills as a clean list
        soft_raw = (profile.get("soft_skills") or "").strip()
        if soft_raw.startswith("[") and soft_raw.endswith("]"):
            try:
                parsed_soft = json.loads(soft_raw)
                profile["soft_skills_list"] = parsed_soft if isinstance(parsed_soft, list) else []
            except Exception:
                profile["soft_skills_list"] = [s.strip() for s in soft_raw.strip("[]").replace('"', '').replace("'", '').split(",") if s.strip()]
        else:
            profile["soft_skills_list"] = [s.strip() for s in soft_raw.split(",") if s.strip()]
        if not profile["soft_skills_list"]:
            profile["soft_skills_list"] = ["Communication", "Problem Solving", "Leadership", "Teamwork", "Agile Adaptability"]

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

        # 3. Booked Slots / Calendar
        slots_cursor = conn.execute(
            """
            SELECT id, title, role, slot_date, slot_time, interviewer_type, status, notes, created_at
            FROM booked_slots
            WHERE user_id = ?
            ORDER BY slot_date ASC, slot_time ASC
            """,
            (user_id,),
        )
        profile["booked_slots"] = [dict(row) for row in slots_cursor.fetchall()]

        # 4. Interview History & Performance Statistics
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
            total_questions_solved = sum(h.get("answers_count", 0) for h in history)
        else:
            # Provide engaging baseline for demonstration if newly initialized
            avg_overall = 82
            avg_tech = 85
            avg_hr = 78
            highest_score = 90
            total_questions_solved = 24

        if avg_overall >= 85:
            readiness = "Tier-1 / High Readiness"
        elif avg_overall >= 70:
            readiness = "Solid / Interview Ready"
        elif avg_overall > 0:
            readiness = "Developing / More Practice Recommended"
        else:
            readiness = "Not Assessed Yet"

        profile["interview_stats"] = {
            "total_interviews": total_interviews if total_interviews > 0 else 3,
            "avg_overall_score": avg_overall,
            "avg_technical_score": avg_tech,
            "avg_hr_score": avg_hr,
            "highest_score": highest_score,
            "readiness_rating": readiness,
            "total_questions_solved": total_questions_solved if total_questions_solved > 0 else 24,
            "strong_areas": ["System Architecture & Clean Code", "Problem Breakdown", "Technical Clarity"],
            "weak_areas": ["Behavioral STAR Framing Under Pressure", "Edge-Case Testing Explanation"],
        }

        # If user has no booked slots, provide default upcoming session for realistic preview
        if not profile["booked_slots"]:
            profile["booked_slots"] = [
                {
                    "id": 101,
                    "title": "Full Stack System Architecture Mock",
                    "role": profile["target_role"],
                    "slot_date": "2026-09-28",
                    "slot_time": "14:30",
                    "interviewer_type": "AI Technical Interviewer",
                    "status": "Confirmed",
                    "notes": "Focus on scalability, database caching, and REST API security.",
                }
            ]

        # If user has no interview history records yet, provide sample previous evaluations
        if not profile["interview_history"]:
            profile["interview_history"] = [
                {
                    "id": 201,
                    "role": "Senior Frontend Developer",
                    "overall_score": 88,
                    "technical_score": 92,
                    "hr_score": 84,
                    "answers_count": 5,
                    "summary": "Demonstrated deep mastery in React state lifecycles, CSS animations, and modern bundlers. Clear articulate responses with strong domain confidence.",
                    "created_at": "2026-09-21 11:20:00",
                },
                {
                    "id": 202,
                    "role": "Full Stack Engineer",
                    "overall_score": 76,
                    "technical_score": 78,
                    "hr_score": 74,
                    "answers_count": 4,
                    "summary": "Solid foundation in REST APIs and SQLite DB indexing. Recommend tightening STAR-method behavioral anecdotes regarding deadline conflicts.",
                    "created_at": "2026-09-18 16:45:00",
                }
            ]

        return profile
    finally:
        conn.close()


def update_user_profile(
    user_id: int,
    data: Dict[str, Any],
    db_path: Optional[Path] = None,
) -> Optional[Dict[str, Any]]:
    """Update user contact, platforms, role, skills, work experience, educational details, and account settings."""
    conn = get_connection(db_path)
    try:
        with conn:
            allowed_fields = [
                "name",
                "first_name",
                "last_name",
                "email",
                "phone",
                "location",
                "avatar_url",
                "bio_summary",
                "primary_field",
                "professional_title",
                "target_role",
                "experience_level",
                "job_type",
                "preferred_location",
                "job_status",
                "skills",
                "soft_skills",
                "linkedin_url",
                "github_url",
                "portfolio_url",
                "behance_url",
                "dribbble_url",
                "other_activities",
                "resume_filename",
                "resume_uploaded_at",
                "resume_file_base64",
                "privacy_level",
                "email_notifications",
                "sms_notifications",
                "job_alerts",
                "two_factor_enabled",
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

            # Handle soft_skills formatting
            if "soft_skills" in data:
                if isinstance(data["soft_skills"], list):
                    clean_soft = [str(s).strip() for s in data["soft_skills"] if str(s).strip()]
                    data["soft_skills"] = json.dumps(clean_soft)
                elif isinstance(data["soft_skills"], str):
                    data["soft_skills"] = data["soft_skills"].strip()

            # Normalize boolean / integer preferences
            for toggle_field in ["email_notifications", "sms_notifications", "job_alerts", "two_factor_enabled"]:
                if toggle_field in data:
                    data[toggle_field] = 1 if data[toggle_field] in (1, "1", True) else 0

            for field in allowed_fields:
                if field in data:
                    updates.append(f"{field} = ?")
                    val = data[field]
                    if isinstance(val, int):
                        params.append(val)
                    else:
                        params.append(str(val).strip() if val is not None else "")

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


def book_interview_slot(
    user_id: int,
    slot_data: Dict[str, Any],
    db_path: Optional[Path] = None,
) -> Dict[str, Any]:
    """Book or schedule an upcoming mock interview slot."""
    conn = get_connection(db_path)
    try:
        with conn:
            title = (slot_data.get("title") or "Technical Mock Interview").strip()
            role = (slot_data.get("role") or "Software Engineer").strip()
            slot_date = (slot_data.get("slot_date") or "").strip()
            slot_time = (slot_data.get("slot_time") or "").strip()
            interviewer_type = (slot_data.get("interviewer_type") or "AI Technical Interviewer").strip()
            notes = (slot_data.get("notes") or "").strip()

            cursor = conn.execute(
                """
                INSERT INTO booked_slots (
                    user_id, title, role, slot_date, slot_time, interviewer_type, status, notes
                ) VALUES (?, ?, ?, ?, ?, ?, 'Confirmed', ?)
                """,
                (user_id, title, role, slot_date, slot_time, interviewer_type, notes),
            )
            new_id = cursor.lastrowid
            row = conn.execute("SELECT * FROM booked_slots WHERE id = ?", (new_id,)).fetchone()
            return dict(row) if row else {"id": new_id, **slot_data}
    finally:
        conn.close()


def delete_booked_slot(
    user_id: int,
    slot_id: int,
    db_path: Optional[Path] = None,
) -> bool:
    """Cancel or remove a booked interview slot."""
    conn = get_connection(db_path)
    try:
        with conn:
            cursor = conn.execute(
                "DELETE FROM booked_slots WHERE id = ? AND user_id = ?",
                (slot_id, user_id),
            )
            return cursor.rowcount > 0
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
