import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_get_masterclass_videos():
    response = client.get("/api/videos")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["count"] >= 4
    videos = data["videos"]
    assert len(videos) >= 4
    first = videos[0]
    assert "id" in first
    assert "title" in first
    assert "video_url" in first
    assert "thumbnail" in first
    assert "key_takeaways" in first
    assert "timestamp_bookmarks" in first


def test_get_mock_tests_summary():
    response = client.get("/api/mock-tests")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["count"] >= 3
    tests = data["tests"]
    assert len(tests) >= 3
    first_test = tests[0]
    assert "id" in first_test
    assert "title" in first_test
    assert "questions" in first_test
    # Verify that correct_index is NOT leaked in the summary endpoint
    for q in first_test["questions"]:
        assert "correct_index" not in q
        assert "explanation" not in q


def test_evaluate_mock_test_flow():
    # Submit answers to test-fullstack-arch
    payload = {
        "test_id": "test-fullstack-arch",
        "answers": {
            "q1": 1,  # correct
            "q2": 1,  # correct
            "q3": 1,  # correct
            "q4": 1,  # correct
            "q5": 1   # correct
        },
        "time_spent_seconds": 120
    }
    response = client.post("/api/mock-tests/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["score_percentage"] == 100
    assert data["passed"] is True
    assert data["correct_count"] == 5
    assert len(data["detailed_results"]) == 5
    # Explanations must be present in evaluation result
    assert "explanation" in data["detailed_results"][0]


def test_evaluate_mock_test_invalid_id():
    payload = {
        "test_id": "nonexistent-test-id",
        "answers": {},
        "time_spent_seconds": 10
    }
    response = client.post("/api/mock-tests/evaluate", json=payload)
    assert response.status_code == 404
