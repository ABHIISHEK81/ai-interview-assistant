"""Automated tests for comprehensive 5-section candidate profile and interview management."""
import base64
import pytest
from fastapi.testclient import TestClient

from backend.database import (
    find_or_create_user,
    get_user_profile,
    init_db,
    update_user_profile,
    book_interview_slot,
    delete_booked_slot,
)
from backend.main import app
from backend.services.auth import create_access_token


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    init_db()


def test_full_5_section_profile_crud(tmp_path):
    test_db = tmp_path / "test_full_profile.db"
    init_db(test_db)

    # 1. Create User
    user = find_or_create_user(
        provider="google",
        provider_id="g_test_999",
        email="developer.lead@test.com",
        name="Aarav Sharma",
        first_name="Aarav",
        last_name="Sharma",
        avatar_url="https://images.unsplash.com/photo-1534528741775?w=150",
        db_path=test_db,
    )
    user_id = user["id"]
    assert user_id is not None

    # 2. Update all 5 sections
    update_data = {
        # Section 1: Basic & Contact
        "name": "Aarav Sharma",
        "professional_title": "Senior Full Stack Architect",
        "phone": "+91 98765 43210",
        "location": "Bengaluru, India",
        "linkedin_url": "https://linkedin.com/in/aarav-sharma-dev",
        "github_url": "https://github.com/aaravsharma",
        "portfolio_url": "https://aaravsharma.tech",
        "behance_url": "https://behance.net/aaravsharma",
        "dribbble_url": "https://dribbble.com/aaravsharma",
        # Section 2: Preferences
        "target_role": "Staff Software Engineer",
        "job_type": "Full-time",
        "preferred_location": "Remote / Hybrid (Bengaluru)",
        "job_status": "Actively Interviewing",
        # Section 3: Professional Background
        "skills": ["Python", "React", "TypeScript", "FastAPI", "Docker", "PostgreSQL", "System Design"],
        "soft_skills": ["Leadership", "Stakeholder Communication", "Mentorship", "Agile Execution"],
        "resume_filename": "Aarav_Sharma_CV.pdf",
        "resume_uploaded_at": "2026-09-23 16:30",
        "resume_file_base64": base64.b64encode(b"%PDF-1.4 Mock resume content").decode("utf-8"),
        "education": [
            {
                "degree_title": "B.Tech in Computer Science",
                "field_of_study": "Computer Science & Engineering",
                "institution": "IIT Madras",
                "start_year": "2018",
                "end_year": "2022",
                "grade_or_honors": "CGPA 9.2/10.0 (Gold Medalist)",
            }
        ],
        "work_experience": [
            {
                "job_title": "Lead Software Engineer",
                "company": "Nexus Technologies",
                "location": "Bengaluru, India",
                "start_date": "2022-07",
                "end_date": "Present",
                "is_current": True,
                "description": "Architected distributed event streaming backend handling 50k requests/sec.",
            }
        ],
        # Section 5: Account Settings & Privacy
        "privacy_level": "public",
        "email_notifications": 1,
        "sms_notifications": 1,
        "job_alerts": 1,
        "two_factor_enabled": 0,
    }

    updated = update_user_profile(user_id, update_data, db_path=test_db)
    assert updated["professional_title"] == "Senior Full Stack Architect"
    assert updated["location"] == "Bengaluru, India"
    assert updated["job_status"] == "Actively Interviewing"
    assert updated["job_type"] == "Full-time"
    assert "Python" in updated["skills_list"]
    assert "Leadership" in updated["soft_skills_list"]
    assert len(updated["work_experience"]) == 1
    assert updated["work_experience"][0]["company"] == "Nexus Technologies"
    assert len(updated["education"]) == 1
    assert updated["education"][0]["institution"] == "IIT Madras"
    assert updated["resume_filename"] == "Aarav_Sharma_CV.pdf"

    # 3. Booked Slots
    slot = book_interview_slot(
        user_id,
        {
            "title": "System Design Architecture Round",
            "role": "Staff Software Engineer",
            "slot_date": "2026-09-30",
            "slot_time": "15:00",
            "interviewer_type": "AI Technical Interviewer",
            "notes": "Preparation for scalable microservices design.",
        },
        db_path=test_db,
    )
    assert slot["id"] is not None
    assert slot["title"] == "System Design Architecture Round"

    profile = get_user_profile(user_id, db_path=test_db)
    assert len(profile["booked_slots"]) >= 1
    assert any(s["title"] == "System Design Architecture Round" for s in profile["booked_slots"])

    # 4. Delete slot
    deleted = delete_booked_slot(user_id, slot["id"], db_path=test_db)
    assert deleted is True


def test_api_profile_comprehensive_endpoints():
    client = TestClient(app)

    # 1. Sign in as demo user
    login_res = client.post("/auth/demo-login", json={"provider": "google"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get profile
    get_res = client.get("/api/profile", headers=headers)
    assert get_res.status_code == 200
    data = get_res.json()["profile"]
    assert "skills_list" in data
    assert "soft_skills_list" in data
    assert "interview_stats" in data
    assert "booked_slots" in data

    # 3. Put Profile Update with all sections
    update_payload = {
        "full_name": "Dr. Sarah Chen, Ph.D.",
        "professional_title": "Principal AI & Systems Engineer",
        "location": "San Francisco, CA",
        "job_status": "Open to Offers",
        "job_type": "Remote",
        "preferred_location": "Worldwide Remote",
        "skills": ["Python", "Rust", "FastAPI", "React", "Docker", "PyTorch"],
        "soft_skills": ["Technical Architecture", "Mentorship", "Cross-functional Collaboration"],
        "work_experience": [
            {
                "job_title": "Staff AI Engineer",
                "company": "DeepModel Labs",
                "location": "San Francisco",
                "start_date": "2023",
                "end_date": "Present",
                "is_current": True,
                "description": "Led team of 8 developing real-time generative agents.",
            }
        ],
        "privacy_level": "private",
        "email_notifications": 1,
        "two_factor_enabled": 1,
    }
    put_res = client.put("/api/profile", json=update_payload, headers=headers)
    assert put_res.status_code == 200
    updated_profile = put_res.json()["profile"]
    assert updated_profile["professional_title"] == "Principal AI & Systems Engineer"
    assert updated_profile["job_status"] == "Open to Offers"
    assert updated_profile["privacy_level"] == "private"
    assert updated_profile["two_factor_enabled"] == 1
    assert len(updated_profile["work_experience"]) == 1

    # 4. Test Booked Slots API
    slot_payload = {
        "title": "Mock Technical Algorithm Screening",
        "role": "Principal AI & Systems Engineer",
        "slot_date": "2026-10-05",
        "slot_time": "11:00",
        "interviewer_type": "AI Technical Interviewer",
        "notes": "Testing graph traversal and dynamic programming.",
    }
    slot_res = client.post("/api/profile/booked-slots", json=slot_payload, headers=headers)
    assert slot_res.status_code == 200
    slot_data = slot_res.json()["slot"]
    slot_id = slot_data["id"]

    # Delete the slot
    del_res = client.delete(f"/api/profile/booked-slots/{slot_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 5. Test Resume Upload and Download API
    sample_pdf_b64 = base64.b64encode(b"%PDF-1.4 sample resume content").decode("utf-8")
    upload_res = client.post(
        "/api/profile/resume",
        json={"filename": "sarah_chen_ai_resume.pdf", "file_base64": sample_pdf_b64},
        headers=headers,
    )
    assert upload_res.status_code == 200
    assert upload_res.json()["resume_filename"] == "sarah_chen_ai_resume.pdf"

    download_res = client.get("/api/profile/resume/download", headers=headers)
    assert download_res.status_code == 200
    assert b"%PDF-1.4" in download_res.content

    # 6. Test Password Change and 2FA toggle
    pwd_res = client.post(
        "/api/profile/change-password",
        json={"current_password": "oldpassword123", "new_password": "supersecurenewpassword456"},
        headers=headers,
    )
    assert pwd_res.status_code == 200
    assert pwd_res.json()["success"] is True

    tfa_res = client.post("/api/profile/toggle-2fa", headers=headers)
    assert tfa_res.status_code == 200
    assert "two_factor_enabled" in tfa_res.json()
