"""Automated tests for OAuth authentication and educational profile management."""
import pytest
from fastapi.testclient import TestClient

from backend.database import (
    find_or_create_user,
    get_user_profile,
    init_db,
    update_user_profile,
)
from backend.main import app
from backend.services.auth import create_access_token, verify_access_token


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    init_db()


def test_jwt_lifecycle():
    token = create_access_token({"user_id": 99, "email": "test@domain.com"})
    assert isinstance(token, str)
    assert len(token.split(".")) == 3

    payload = verify_access_token(token)
    assert payload is not None
    assert payload["user_id"] == 99
    assert payload["email"] == "test@domain.com"

    # Malformed token
    assert verify_access_token("bad.token") is None
    # Tampered signature
    parts = token.split(".")
    tampered = f"{parts[0]}.{parts[1]}.tampered_sig"
    assert verify_access_token(tampered) is None


def test_database_user_and_education_crud(tmp_path):
    test_db = tmp_path / "test_interviewai.db"
    init_db(test_db)

    # 1. Create User
    user = find_or_create_user(
        provider="google",
        provider_id="g_12345",
        email="alex.physics@example.edu",
        name="Alex Morgan",
        first_name="Alex",
        last_name="Morgan",
        avatar_url="https://example.com/avatar.jpg",
        db_path=test_db,
    )
    assert user["id"] is not None
    assert user["email"] == "alex.physics@example.edu"
    assert user["auth_provider"] == "google"

    # 2. Update Profile & Education
    updated = update_user_profile(
        user["id"],
        {
            "primary_field": "Quantum Physics & Scientific Computing",
            "phone": "+1 (555) 019-2834",
            "portfolio_url": "https://alexphysics.dev",
            "github_url": "https://github.com/alex-physics",
            "other_activities": "Choir Director, Classical Folk Song performer",
            "education": [
                {
                    "degree_title": "B.S. in Physics",
                    "field_of_study": "Physics",
                    "institution": "MIT",
                    "start_year": "2018",
                    "end_year": "2022",
                }
            ],
        },
        db_path=test_db,
    )
    assert updated["primary_field"] == "Quantum Physics & Scientific Computing"
    assert updated["portfolio_url"] == "https://alexphysics.dev"
    assert updated["other_activities"] == "Choir Director, Classical Folk Song performer"
    assert len(updated["education"]) == 1
    assert updated["education"][0]["degree_title"] == "B.S. in Physics"


def test_auth_demo_login_endpoint():
    client = TestClient(app)
    response = client.post("/auth/demo-login", json={"provider": "google"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data
    assert data["user"]["email"] == "alex.morgan.physics@gmail.com"
    assert data["user"]["auth_provider"] == "google"

    # LinkedIn Demo
    res_li = client.post("/auth/demo-login", json={"provider": "linkedin"})
    assert res_li.status_code == 200
    data_li = res_li.json()
    assert data_li["success"] is True
    assert data_li["user"]["auth_provider"] == "linkedin"


def test_profile_endpoints_authenticated():
    client = TestClient(app)

    # 1. Login to get token
    login_res = client.post("/auth/demo-login", json={"provider": "google"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. GET Profile
    get_res = client.get("/api/profile", headers=headers)
    assert get_res.status_code == 200
    profile = get_res.json()["profile"]
    assert profile["email"] == "alex.morgan.physics@gmail.com"

    # 3. PUT Profile Update
    update_payload = {
        "name": "Alex Morgan, Ph.D. Candidate",
        "phone": "+1 (555) 432-1098",
        "primary_field": "Theoretical Physics & Quantum Algorithms",
        "portfolio_url": "https://morgan-research.io",
        "github_url": "https://github.com/alex-quantum",
        "linkedin_url": "https://linkedin.com/in/alex-morgan-physics",
        "other_activities": "Lead Soloist in Academic Choir, National Physics Olympiad Winner",
        "education": [
            {
                "degree_title": "B.S. in Physics",
                "field_of_study": "Physics & Applied Mathematics",
                "institution": "Stanford University",
                "start_year": "2017",
                "end_year": "2021",
            },
            {
                "degree_title": "M.S. in Computational Physics",
                "field_of_study": "Quantum Computing",
                "institution": "Caltech",
                "start_year": "2021",
                "end_year": "2023",
            },
        ],
    }
    put_res = client.put("/api/profile", json=update_payload, headers=headers)
    assert put_res.status_code == 200
    updated_profile = put_res.json()["profile"]
    assert updated_profile["name"] == "Alex Morgan, Ph.D. Candidate"
    assert updated_profile["primary_field"] == "Theoretical Physics & Quantum Algorithms"
    assert len(updated_profile["education"]) == 2
    assert updated_profile["education"][0]["institution"] == "Stanford University"
    assert updated_profile["education"][1]["institution"] == "Caltech"


def test_profile_unauthorized_access():
    client = TestClient(app)

    # Missing header
    res_missing = client.get("/api/profile")
    assert res_missing.status_code == 401

    # Invalid token
    res_bad = client.get("/api/profile", headers={"Authorization": "Bearer invalid_garbage_token"})
    assert res_bad.status_code == 401
