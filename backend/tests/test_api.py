import io
import docx
import pytest
from fastapi.testclient import TestClient
from PyPDF2 import PdfWriter

from backend.main import app
from backend.services.document_parser import (
    extract_docx_text,
    extract_pdf_text,
    extract_resume_text,
)
from backend.services.resume_extractor import (
    calculate_ats_score,
    extract_education_heuristically,
    extract_experience_heuristically,
    extract_skills_heuristically,
    parse_analysis_dashboard,
)


client = TestClient(app)


def create_dummy_pdf(text: str) -> bytes:
    """Create a minimal in-memory PDF containing text for testing."""
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    # PyPDF2 blank pages have valid PDF structure
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def create_dummy_docx(paragraphs: list[str]) -> bytes:
    """Create a minimal in-memory DOCX document."""
    doc = docx.Document()
    for p in paragraphs:
        doc.add_paragraph(p)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "AI Interview Assistant API" in data["message"]


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "gemini_configured" in data


def test_docx_text_extraction():
    paragraphs = [
        "Alex Rivera",
        "Skills: Python, FastAPI, React, SQL, Git",
        "Education: Bachelor of Technology in Computer Science, XYZ University 2024",
        "Experience: Software Engineer at ABC Tech (2023 - Present)"
    ]
    docx_bytes = create_dummy_docx(paragraphs)
    extracted = extract_docx_text(docx_bytes)
    assert "Python" in extracted
    assert "XYZ University" in extracted
    assert "Software Engineer" in extracted


def test_extract_resume_text_routing():
    docx_bytes = create_dummy_docx(["Sample Resume Text for Testing with sufficient length here."])
    text = extract_resume_text("resume.docx", docx_bytes)
    assert "Sample Resume Text" in text

    with pytest.raises(Exception) as exc:
        extract_resume_text("resume.xyz", docx_bytes)
    assert "Unsupported file format" in str(exc.value.detail)


def test_skills_extraction_heuristically():
    resume = """
    Jane Developer
    Technical Skills: Python, JavaScript, React, FastAPI, PostgreSQL, Docker, Git.
    Soft Skills: Communication, Teamwork, Problem Solving.
    Experience: 2 years building web apps.
    """
    skills = extract_skills_heuristically(resume, role="Full Stack Developer")
    assert "Python" in skills["technical"]
    assert "React" in skills["technical"]
    assert "Communication" in skills["soft"]
    assert isinstance(skills["matched"], list)
    assert isinstance(skills["missing"], list)


def test_ats_score_calculation():
    resume = """
    Software Engineer with experience in Python, SQL, REST APIs, Git, Docker.
    Education: B.Tech Computer Science, ABC University.
    Developed scalable backend systems with 99.9% uptime.
    """
    skills = extract_skills_heuristically(resume, role="Backend Developer")
    score, rating, breakdown = calculate_ats_score(skills, resume)
    assert 0 <= score <= 100
    assert rating in ["Excellent", "Good", "Needs Improvement"]
    assert "skills_match" in breakdown
    assert "experience_relevance" in breakdown
    assert "education_formatting" in breakdown
    assert "keyword_coverage" in breakdown


def test_education_and_experience_extraction():
    resume = """
    John Smith
    Bachelor of Technology in Information Technology
    Stanford Institute 2023
    Software Engineer at CloudCorp
    Jan 2023 - Present
    Built REST APIs using Python and FastAPI.
    """
    edu = extract_education_heuristically(resume)
    assert len(edu) > 0
    assert any("Bachelor" in e["degree"] or "Technology" in e["degree"] for e in edu)

    exp = extract_experience_heuristically(resume)
    assert len(exp) > 0
    assert any("Software Engineer" in e["role"] for e in exp)


def test_dashboard_normalization():
    ai_raw = """
    ## Candidate Summary
    Candidate is a skilled software engineer.

    ## ATS Score & Analysis
    Score is 85/100.

    ## Job Match Score
    Match score is 80/100.

    ## Resume Improvements
    - Quantify achievements.
    - Highlight system design.

    ```json
    {
      "ats_score": 88,
      "ats_rating": "Excellent",
      "score_breakdown": {
        "skills_match": 90,
        "experience_relevance": 85,
        "education_formatting": 88,
        "keyword_coverage": 89
      },
      "job_match_score": 85,
      "summary": "High performing developer.",
      "extracted_skills": {
        "technical": ["Python", "FastAPI"],
        "soft": ["Problem Solving"],
        "matched": ["Python"],
        "missing": ["Docker"]
      },
      "extracted_education": [{"degree": "B.Tech", "institution": "State University", "year": "2024"}],
      "extracted_experience": [{"role": "Dev", "company": "Tech Inc", "duration": "1 Year", "highlights": "APIs"}],
      "key_strengths": ["Quick learner"],
      "improvement_suggestions": ["Add CI/CD"],
      "interview_questions": {
        "technical": ["Explain async await."],
        "hr": ["Tell me about yourself."]
      }
    }
    ```
    """
    resume_text = "Python Developer with B.Tech and FastAPI experience."
    cleaned_md, dash = parse_analysis_dashboard(ai_raw, resume_text, "Software Developer", "")

    assert "```json" not in cleaned_md
    assert dash["ats_score"] == 88
    assert dash["ats_rating"] == "Excellent"
    assert "Python" in dash["extracted_skills"]["technical"]
    assert len(dash["interview_questions"]["technical"]) > 0


def test_analyze_resume_validations():
    # Missing file
    res = client.post("/analyze-resume", data={"role": "Software Developer"})
    assert res.status_code == 400
    assert "Please select or upload a resume file" in res.json()["detail"]

    # Missing role
    docx_bytes = create_dummy_docx(["John Doe resume content with enough characters to pass extraction."])
    res = client.post(
        "/analyze-resume",
        data={"role": ""},
        files={"resume": ("resume.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    )
    assert res.status_code == 400
    assert "Please enter or select a target job role" in res.json()["detail"]

    # Short resume text
    short_docx = create_dummy_docx(["Too short"])
    res = client.post(
        "/analyze-resume",
        data={"role": "Software Developer"},
        files={"resume": ("resume.docx", short_docx, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    )
    assert res.status_code == 400
    assert "Very little text could be extracted" in res.json()["detail"]


def test_adaptive_interview_validation():
    # Answer too short
    payload = {
        "role": "Software Developer",
        "question": "What is polymorphism?",
        "answer": "short",
        "category": "Technical",
        "difficulty": "medium",
        "question_number": 1
    }
    res = client.post("/adaptive-interview", json=payload)
    assert res.status_code == 400
    assert "at least 10 characters" in res.json()["detail"]


def test_evaluate_interview_validation():
    # Empty answers list
    payload = {
        "role": "Software Developer",
        "answers": []
    }
    res = client.post("/evaluate-interview", json=payload)
    assert res.status_code == 400
    assert "Submit between 1 and 10 interview answers" in res.json()["detail"]
