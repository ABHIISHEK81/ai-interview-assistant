import os
import io
import sys
from fastapi.testclient import TestClient
from PyPDF2 import PdfWriter

# Set test environment variables before importing app
os.environ["FRONTEND_URL"] = "https://custom-test-domain.com,https://another-frontend.netlify.app"
from backend.main import app

client = TestClient(app)

def test_health():
    print("Testing GET /health...")
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.status_code} - {res.text}"
    data = res.json()
    assert data["status"] == "ok", f"Expected status 'ok', got: {data.get('status')}"
    print(f"  PASS: /health returned {data}")

def test_cors():
    print("\nTesting CORS headers...")
    # Test netlify origin regex
    res = client.options("/health", headers={
        "Origin": "https://my-awesome-app.netlify.app",
        "Access-Control-Request-Method": "GET"
    })
    assert res.headers.get("access-control-allow-origin") == "https://my-awesome-app.netlify.app", \
        f"Netlify CORS failed: {res.headers}"
    print("  PASS: Netlify origin allowed via regex.")

    # Test custom origin from FRONTEND_URL
    res = client.options("/health", headers={
        "Origin": "https://custom-test-domain.com",
        "Access-Control-Request-Method": "GET"
    })
    assert res.headers.get("access-control-allow-origin") == "https://custom-test-domain.com", \
        f"Custom FRONTEND_URL CORS failed: {res.headers}"
    print("  PASS: Custom origin from FRONTEND_URL allowed.")

    # Test localhost origin
    res = client.options("/health", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET"
    })
    assert res.headers.get("access-control-allow-origin") == "http://localhost:3000", \
        f"Localhost CORS failed: {res.headers}"
    print("  PASS: Localhost:3000 allowed.")

def test_analyze_resume():
    print("\nTesting POST /analyze-resume with sample PDF...")
    # Read sample resume if exists, or create a minimal one
    sample_path = "sample-resumes/sample_software_developer_resume.pdf"
    if os.path.exists(sample_path):
        with open(sample_path, "rb") as f:
            pdf_bytes = f.read()
    else:
        writer = PdfWriter()
        writer.add_blank_page(width=200, height=200)
        buf = io.BytesIO()
        writer.write(buf)
        pdf_bytes = buf.getvalue()

    res = client.post(
        "/analyze-resume",
        data={
            "role": "Software Developer",
            "job_description": "We are looking for a Python / FastAPI engineer with React skills."
        },
        files={
            "resume": ("sample.pdf", pdf_bytes, "application/pdf")
        }
    )
    assert res.status_code == 200, f"Analyze resume failed: {res.status_code} - {res.text}"
    data = res.json()
    assert data["success"] is True, f"Expected success=True, got: {data}"
    assert "dashboard" in data, "Dashboard data missing"
    db = data["dashboard"]
    print("  PASS: /analyze-resume succeeded.")
    print(f"  ATS Score: {db.get('ats_score')}")
    print(f"  Job Match: {db.get('job_match_score')}")
    print(f"  Extracted Skills: {list(db.get('extracted_skills', {}).keys())}")
    print(f"  Interview Questions: {list(db.get('interview_questions', {}).keys())}")

if __name__ == "__main__":
    try:
        test_health()
        test_cors()
        test_analyze_resume()
        print("\nALL INTEGRATION CHECKS PASSED SUCCESSFULLY!")
    except Exception as e:
        print(f"\nTEST FAILED: {e}", file=sys.stderr)
        sys.exit(1)
