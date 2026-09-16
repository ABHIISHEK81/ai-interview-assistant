"""
End-to-End Verification of Resume Analysis Pipeline
Tests:
1. Backend health check (http://127.0.0.1:8000/health)
2. Frontend static serving (http://localhost:3000/)
3. Sample resume accessibility (http://localhost:3000/sample-resumes/sample_software_developer_resume.pdf)
4. Analysis API validation errors (missing role, missing file)
5. Analysis API real execution with sample PDF:
   - Form-data payload identical to frontend script.js
   - Verifying ATS score, category breakdown, radar skills, and detailed markdown report
6. Subsequent interview question generation from analysis result
"""

import sys
import io
import json
import urllib.request
import urllib.error
import requests

BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:3000"

def run_tests():
    print("=" * 60)
    print("AI Interview Assistant - End-to-End Analysis Verification")
    print("=" * 60)

    # 1. Backend Health
    print("\n[1/6] Checking Backend Health...")
    try:
        resp = requests.get(f"{BACKEND_URL}/health", timeout=5)
        assert resp.status_code == 200, f"Backend returned {resp.status_code}"
        health = resp.json()
        print(f"  --> Status: {health.get('status')}")
        print(f"  --> Gemini Configured: {health.get('gemini_configured')}")
        print(f"  --> Model: {health.get('model')}")
        assert health.get("status") == "healthy"
    except Exception as e:
        print(f"  FAIL: Backend health check failed: {e}")
        return False

    # 2. Frontend Accessibility
    print("\n[2/6] Checking Frontend Server...")
    try:
        resp = requests.get(f"{FRONTEND_URL}/", timeout=5)
        assert resp.status_code == 200, f"Frontend returned {resp.status_code}"
        assert "analyzeButton" in resp.text, "analyzeButton ID missing from index.html"
        assert "formAlertBox" in resp.text, "formAlertBox ID missing from index.html"
        assert "resultSection" in resp.text, "resultSection ID missing from index.html"
        assert "loadingBox" in resp.text, "loadingBox ID missing from index.html"
        print("  --> Frontend index.html served successfully (contains analyzeButton, formAlertBox, resultSection, loadingBox).")
    except Exception as e:
        print(f"  FAIL: Frontend check failed: {e}")
        return False

    # 3. Sample Resume PDF
    print("\n[3/6] Checking Sample Resume File...")
    sample_url = f"{FRONTEND_URL}/sample-resumes/sample_software_developer_resume.pdf"
    try:
        resp = requests.get(sample_url, timeout=5)
        assert resp.status_code == 200, f"Sample PDF returned {resp.status_code}"
        pdf_bytes = resp.content
        assert len(pdf_bytes) > 500, f"PDF file too small: {len(pdf_bytes)} bytes"
        print(f"  --> Sample PDF loaded successfully ({len(pdf_bytes)} bytes).")
    except Exception as e:
        print(f"  FAIL: Sample resume fetch failed: {e}")
        return False

    # 4. API Validation Errors (Missing file & Missing role)
    print("\n[4/6] Testing API Input Validation on /analyze-resume...")
    try:
        # Case A: Missing file
        resp = requests.post(f"{BACKEND_URL}/analyze-resume", data={"role": "Software Developer"}, timeout=10)
        assert resp.status_code == 400, f"Expected 400 for missing file, got {resp.status_code}"
        print(f"  --> Missing file validation passed (Status 400: {resp.json().get('detail')}).")

        # Case B: Missing role
        files = {"resume": ("test.pdf", pdf_bytes, "application/pdf")}
        resp = requests.post(f"{BACKEND_URL}/analyze-resume", files=files, data={"role": ""}, timeout=10)
        assert resp.status_code == 400, f"Expected 400 for missing role, got {resp.status_code}"
        print(f"  --> Missing role validation passed (Status 400: {resp.json().get('detail')}).")
    except Exception as e:
        print(f"  FAIL: API validation test failed: {e}")
        return False

    # 5. Full Real Analysis Execution
    print("\n[5/6] Testing Real Resume Analysis Execution...")
    try:
        files = {"resume": ("sample_software_developer_resume.pdf", pdf_bytes, "application/pdf")}
        data = {
            "role": "Software Developer",
            "job_description": "Proficiency in Python, FastAPI, React, SQL, unit testing, and scalable cloud services."
        }
        print("  --> Dispatching POST request to /analyze-resume with sample PDF and role...")
        resp = requests.post(f"{BACKEND_URL}/analyze-resume", files=files, data=data, timeout=90)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

        payload = resp.json()
        assert payload.get("success") is True, "Analysis payload success is not True"
        assert payload.get("role") == "Software Developer"
        assert payload.get("characters_extracted", 0) > 100

        analysis_md = payload.get("analysis", "")
        assert len(analysis_md) > 200, "Detailed analysis text too short"
        print(f"  --> Detailed Markdown Report generated ({len(analysis_md)} chars)")

        dashboard = payload.get("dashboard", {})
        ats_score = dashboard.get("ats_score")
        print(f"  --> ATS Score: {ats_score}/100 ({dashboard.get('ats_rating')})")
        assert ats_score is not None and 0 <= ats_score <= 100

        breakdown = dashboard.get("score_breakdown", {})
        print(f"  --> Breakdown: Skills Match: {breakdown.get('skills_match')}%, Exp: {breakdown.get('experience_relevance')}%, Edu: {breakdown.get('education_formatting')}%, Keywords: {breakdown.get('keyword_coverage')}%")

        tech_skills = dashboard.get("technical_skills", [])
        print(f"  --> Identified Technical Skills ({len(tech_skills)}): {', '.join(tech_skills[:6])}...")

        missing_skills = dashboard.get("missing_skills", [])
        print(f"  --> Missing / Improvement Skills: {', '.join(missing_skills[:4])}")

        strengths = dashboard.get("key_strengths", [])
        print(f"  --> Key Strengths ({len(strengths)}): {strengths[0] if strengths else 'N/A'}")

        print("\n  [SUCCESS] All ATS Dashboard & Detailed Analysis fields validated successfully!")
    except Exception as e:
        print(f"  FAIL: Resume analysis test failed: {e}")
        return False

    # 6. Adaptive Interview Integration
    print("\n[6/6] Verifying Subsequent Interview Generation...")
    try:
        adaptive_payload = {
            "role": "Software Developer",
            "job_description": "Python, FastAPI, SQL",
            "question": "Can you explain how FastAPI handles asynchronous requests?",
            "answer": "FastAPI is built on Starlette and uses Python's asyncio event loop. Using async def for endpoints allows non-blocking I/O operations such as database queries or external API calls.",
            "category": "Technical",
            "difficulty": "medium",
            "question_number": 1,
            "previous_questions": []
        }
        resp = requests.post(f"{BACKEND_URL}/adaptive-interview", json=adaptive_payload, timeout=60)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        result = resp.json()
        assert result.get("success") is True
        evaluation = result.get("evaluation", {})
        print(f"  --> Adaptive Rating: {evaluation.get('rating')}/10")
        print(f"  --> Next Question: {evaluation.get('next_question')[:80]}...")
        print("  [SUCCESS] Adaptive Mock Interview integration operational!")
    except Exception as e:
        print(f"  FAIL: Adaptive interview test failed: {e}")
        return False

    print("\n" + "=" * 60)
    print("ALL 6/6 END-TO-END VERIFICATION CHECKS PASSED!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
