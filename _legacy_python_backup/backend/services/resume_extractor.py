import json
import re
from typing import Any


COMMON_TECH_SKILLS = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "C", "Go", "Rust",
    "Ruby", "PHP", "Swift", "Kotlin", "HTML", "HTML5", "CSS", "CSS3", "Sass",
    "React", "React.js", "Angular", "Vue", "Vue.js", "Next.js", "Node.js", "Express",
    "Express.js", "FastAPI", "Django", "Flask", "Spring", "Spring Boot", ".NET",
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Oracle",
    "Git", "GitHub", "GitLab", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
    "Linux", "CI/CD", "REST", "RESTful API", "GraphQL", "Microservices",
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas",
    "NumPy", "Scikit-Learn", "Data Analysis", "Power BI", "Tableau"
]

COMMON_SOFT_SKILLS = [
    "Communication", "Problem Solving", "Teamwork", "Collaboration", "Leadership",
    "Critical Thinking", "Adaptability", "Time Management", "Work Ethic",
    "Creativity", "Emotional Intelligence", "Conflict Resolution", "Agile", "Scrum"
]

ROLE_KEYWORD_MAP = {
    "software developer": ["Data Structures", "Algorithms", "Git", "REST APIs", "Debugging", "OOP", "Unit Testing", "System Design"],
    "frontend developer": ["JavaScript", "React", "CSS", "HTML", "Responsive Design", "TypeScript", "UI/UX", "Webpack/Vite"],
    "backend developer": ["Python", "FastAPI", "Node.js", "SQL", "Database Design", "REST APIs", "Docker", "Authentication"],
    "full stack developer": ["Frontend", "Backend", "React", "Node.js", "SQL", "REST APIs", "Git", "Deployment"],
    "data science intern": ["Python", "Pandas", "NumPy", "Machine Learning", "Data Visualization", "SQL", "Statistics"],
    "machine learning engineer": ["Python", "PyTorch", "TensorFlow", "Scikit-Learn", "Model Training", "Data Pipelines", "MLOps"],
    "business analyst": ["Data Analysis", "SQL", "Excel", "Requirements Gathering", "Stakeholder Management", "Tableau", "Process Mapping"]
}


def extract_skills_heuristically(resume_text: str, role: str, job_description: str = "") -> dict[str, list[str]]:
    """Extract skills directly from resume text using keyword pattern matching."""
    text_lower = resume_text.lower()
    found_tech: list[str] = []
    found_soft: list[str] = []

    # Match tech skills
    for skill in COMMON_TECH_SKILLS:
        # Match as whole word/token
        pattern = r"(?:\b|_)" + re.escape(skill.lower()) + r"(?:\b|_)"
        if re.search(pattern, text_lower):
            if skill not in found_tech:
                found_tech.append(skill)

    # Match soft skills
    for skill in COMMON_SOFT_SKILLS:
        pattern = r"(?:\b|_)" + re.escape(skill.lower()) + r"(?:\b|_)"
        if re.search(pattern, text_lower):
            if skill not in found_soft:
                found_soft.append(skill)

    # Target role benchmark keywords
    role_key = role.lower().strip()
    target_keywords = ROLE_KEYWORD_MAP.get(role_key, ["Problem Solving", "Software Engineering", "Testing", "Git"])

    # If job description provided, extract required keywords from JD
    if job_description:
        jd_lower = job_description.lower()
        for skill in COMMON_TECH_SKILLS + COMMON_SOFT_SKILLS:
            pattern = r"(?:\b|_)" + re.escape(skill.lower()) + r"(?:\b|_)"
            if re.search(pattern, jd_lower) and skill not in target_keywords:
                target_keywords.append(skill)

    # Calculate matched vs missing
    matched: list[str] = []
    missing: list[str] = []

    for req in target_keywords:
        req_pattern = r"(?:\b|_)" + re.escape(req.lower()) + r"(?:\b|_)"
        if re.search(req_pattern, text_lower):
            matched.append(req)
        else:
            missing.append(req)

    return {
        "technical": found_tech[:15],
        "soft": found_soft[:10],
        "matched": matched[:12],
        "missing": missing[:8]
    }


def extract_education_heuristically(resume_text: str) -> list[dict[str, str]]:
    """Extract educational degrees, institutions, and years using regex patterns."""
    education_items: list[dict[str, str]] = []
    lines = [line.strip() for line in resume_text.split("\n") if line.strip()]

    degree_patterns = [
        r"\b(?:Bachelor|B\.Tech|B\.E|B\.S|BCA|B\.Sc|Master|M\.Tech|M\.E|M\.S|MCA|M\.Sc|Ph\.D|Diploma)\b[^\n,]*",
        r"\b(?:Computer Science|Information Technology|Mechanical|Electrical|Electronics|Data Science|Engineering)\b[^\n,]*"
    ]

    institution_pattern = r"\b[A-Z][A-Za-z0-9&.\s]{3,35}(?:University|College|Institute|Academy|School)\b"
    year_pattern = r"\b(20[12][0-9]|19[89][0-9])\b"

    for i, line in enumerate(lines):
        degree_found = None
        for dp in degree_patterns:
            m = re.search(dp, line, re.IGNORECASE)
            if m:
                degree_found = m.group(0).strip()
                break

        if degree_found:
            institution = "Recognized Institution"
            year = ""

            # Check surrounding lines for institution or year
            surrounding = " ".join(lines[max(0, i - 1):min(len(lines), i + 3)])
            inst_match = re.search(institution_pattern, surrounding, re.IGNORECASE)
            if inst_match:
                institution = inst_match.group(0).strip()

            year_match = re.search(year_pattern, surrounding)
            if year_match:
                year = year_match.group(0).strip()

            education_items.append({
                "degree": degree_found[:60],
                "institution": institution[:60],
                "year": year or "Completed"
            })
            if len(education_items) >= 3:
                break

    if not education_items:
        education_items.append({
            "degree": "Higher Education Degree",
            "institution": "University / College",
            "year": "Documented in Resume"
        })

    return education_items


def extract_experience_heuristically(resume_text: str) -> list[dict[str, str]]:
    """Extract job titles, companies, and durations using pattern heuristics."""
    experience_items: list[dict[str, str]] = []
    lines = [line.strip() for line in resume_text.split("\n") if line.strip()]

    title_pattern = r"\b(?:Software Engineer|Developer|Intern|Analyst|Associate|Lead|Manager|Consultant|Architect|Designer|Specialist)\b"
    date_pattern = r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*(?:20[12][0-9])\s*(?:-|–|to)\s*(?:Present|Current|20[12][0-9])\b"

    for i, line in enumerate(lines):
        if re.search(title_pattern, line, re.IGNORECASE):
            role_title = line[:50].strip()
            company = "Technology Organization"
            duration = "Professional Experience"

            # Check surrounding lines for dates or company name
            surrounding = " ".join(lines[max(0, i - 1):min(len(lines), i + 3)])
            date_m = re.search(date_pattern, surrounding, re.IGNORECASE)
            if date_m:
                duration = date_m.group(0).strip()

            # Highlights from next line
            highlights = lines[i + 1][:120] if i + 1 < len(lines) else "Key responsibilities and contributions."

            experience_items.append({
                "role": role_title,
                "company": company,
                "duration": duration,
                "highlights": highlights
            })
            if len(experience_items) >= 3:
                break

    if not experience_items:
        experience_items.append({
            "role": "Relevant Project & Professional Experience",
            "company": "Portfolio & Practical Work",
            "duration": "Documented in Resume",
            "highlights": "Hands-on projects and domain contributions described in resume."
        })

    return experience_items


def calculate_ats_score(
    skills_data: dict[str, list[str]],
    resume_text: str,
    job_description: str = ""
) -> tuple[int, str, dict[str, int]]:
    """Calculate deterministic ATS score and rating based on skills and structure."""
    tech_count = len(skills_data.get("technical", []))
    matched_count = len(skills_data.get("matched", []))
    missing_count = len(skills_data.get("missing", []))

    # Category 1: Skills Match (40% weight)
    if matched_count + missing_count > 0:
        skills_match = int((matched_count / (matched_count + missing_count)) * 100)
    else:
        skills_match = min(95, max(50, tech_count * 8))

    # Category 2: Experience Relevance (25% weight)
    exp_indicators = ["project", "experience", "developed", "built", "implemented", "managed", "designed"]
    found_exp = sum(1 for word in exp_indicators if word in resume_text.lower())
    experience_relevance = min(95, max(45, found_exp * 14))

    # Category 3: Education & Formatting (15% weight)
    edu_formatting = 85 if ("education" in resume_text.lower() or "bachelor" in resume_text.lower()) else 65

    # Category 4: Keyword Coverage (20% weight)
    if job_description:
        jd_words = set(re.findall(r"\b[a-zA-Z]{4,}\b", job_description.lower()))
        res_words = set(re.findall(r"\b[a-zA-Z]{4,}\b", resume_text.lower()))
        overlap = len(jd_words.intersection(res_words))
        keyword_coverage = min(95, max(40, int((overlap / max(1, len(jd_words))) * 160)))
    else:
        keyword_coverage = min(90, max(55, tech_count * 9))

    # Weighted Overall ATS Score
    overall_score = int(
        (skills_match * 0.40) +
        (experience_relevance * 0.25) +
        (edu_formatting * 0.15) +
        (keyword_coverage * 0.20)
    )
    overall_score = max(35, min(98, overall_score))

    if overall_score >= 80:
        rating = "Excellent"
    elif overall_score >= 65:
        rating = "Good"
    else:
        rating = "Needs Improvement"

    breakdown = {
        "skills_match": skills_match,
        "experience_relevance": experience_relevance,
        "education_formatting": edu_formatting,
        "keyword_coverage": keyword_coverage
    }

    return overall_score, rating, breakdown


def build_fallback_dashboard(
    ai_text: str,
    resume_text: str,
    role: str,
    job_description: str
) -> dict[str, Any]:
    """Extract and synthesize structured dashboard data if AI JSON output is absent."""
    skills_data = extract_skills_heuristically(resume_text, role, job_description)
    ats_score, ats_rating, breakdown = calculate_ats_score(skills_data, resume_text, job_description)
    education = extract_education_heuristically(resume_text)
    experience = extract_experience_heuristically(resume_text)

    # Scrape job match score if present in AI markdown
    match_score = ats_score
    match_m = re.search(r"(?:Job\s*Match\s*Score)[^\d]*(\d{1,3})", ai_text, re.IGNORECASE)
    if match_m:
        try:
            match_score = max(0, min(100, int(match_m.group(1))))
        except Exception:
            pass

    # Extract bullet points from Resume Improvements section
    improvements: list[str] = []
    imp_section = re.search(r"##\s*Resume Improvements\s*\n(.*?)(?=\n##|\Z)", ai_text, re.DOTALL | re.IGNORECASE)
    if imp_section:
        bullets = re.findall(r"(?:^|\n)\s*[-*•\d.]+\s*(.+)", imp_section.group(1))
        improvements = [b.strip() for b in bullets if len(b.strip()) > 8][:5]

    if not improvements:
        improvements = [
            f"Tailor experience bullet points specifically toward the {role} role requirements.",
            "Quantify project achievements with measurable metrics (e.g. performance gains, user impact).",
            "Highlight core missing skills in a dedicated technical proficiencies section."
        ]

    # Extract interview questions from markdown if present
    tech_questions: list[str] = []
    hr_questions: list[str] = []

    tech_section = re.search(r"##\s*Technical Interview Questions\s*\n(.*?)(?=\n##|\Z)", ai_text, re.DOTALL | re.IGNORECASE)
    if tech_section:
        q_bullets = re.findall(r"(?:^|\n)\s*[-*•\d.]+\s*(.+)", tech_section.group(1))
        tech_questions = [q.strip() for q in q_bullets if len(q.strip()) > 10][:5]

    hr_section = re.search(r"##\s*HR Interview Questions\s*\n(.*?)(?=\n##|\Z)", ai_text, re.DOTALL | re.IGNORECASE)
    if hr_section:
        hr_bullets = re.findall(r"(?:^|\n)\s*[-*•\d.]+\s*(.+)", hr_section.group(1))
        hr_questions = [q.strip() for q in hr_bullets if len(q.strip()) > 10][:3]

    if not tech_questions:
        tech_questions = [
            f"Can you explain your experience and architecture choices for projects related to {role}?",
            "How do you approach performance optimization and debugging in production applications?",
            "Explain the difference between relational and non-relational databases for this role."
        ]

    if not hr_questions:
        hr_questions = [
            "Tell me about a challenging technical hurdle you faced and how you overcame it.",
            f"Why are you interested in pursuing the {role} position at this stage in your career?",
            "How do you prioritize competing deadlines when working on multiple assignments?"
        ]

    # Scrape candidate summary
    summary = ""
    summary_sec = re.search(r"##\s*Candidate Summary\s*\n(.*?)(?=\n##|\Z)", ai_text, re.DOTALL | re.IGNORECASE)
    if summary_sec:
        summary = summary_sec.group(1).strip()
    if not summary or len(summary) < 20:
        summary = f"Candidate profile evaluated for {role}, demonstrating core domain skills and practical project experience."

    return {
        "ats_score": ats_score,
        "ats_rating": ats_rating,
        "score_breakdown": breakdown,
        "job_match_score": match_score,
        "summary": summary,
        "extracted_skills": skills_data,
        "extracted_education": education,
        "extracted_experience": experience,
        "key_strengths": [
            f"Verified technical foundation in {', '.join(skills_data['technical'][:3]) or 'software tools'}.",
            "Demonstrated practical project and hands-on application experience.",
            "Relevant background suited for progressive interview preparation."
        ],
        "improvement_suggestions": improvements,
        "interview_questions": {
            "technical": tech_questions,
            "hr": hr_questions
        }
    }


def normalize_dashboard_data(
    raw_data: dict[str, Any],
    ai_text: str,
    resume_text: str,
    role: str,
    job_description: str
) -> dict[str, Any]:
    """Validate and sanitize dashboard fields to guarantee safe and complete frontend rendering."""
    fallback = build_fallback_dashboard(ai_text, resume_text, role, job_description)

    ats_score = raw_data.get("ats_score", fallback["ats_score"])
    try:
        ats_score = max(0, min(100, int(ats_score)))
    except Exception:
        ats_score = fallback["ats_score"]

    job_match = raw_data.get("job_match_score", fallback["job_match_score"])
    try:
        job_match = max(0, min(100, int(job_match)))
    except Exception:
        job_match = fallback["job_match_score"]

    if ats_score >= 80:
        rating = "Excellent"
    elif ats_score >= 65:
        rating = "Good"
    else:
        rating = "Needs Improvement"

    raw_bd = raw_data.get("score_breakdown", {})
    breakdown = {
        "skills_match": max(0, min(100, int(raw_bd.get("skills_match", fallback["score_breakdown"]["skills_match"])))),
        "experience_relevance": max(0, min(100, int(raw_bd.get("experience_relevance", fallback["score_breakdown"]["experience_relevance"])))),
        "education_formatting": max(0, min(100, int(raw_bd.get("education_formatting", fallback["score_breakdown"]["education_formatting"])))),
        "keyword_coverage": max(0, min(100, int(raw_bd.get("keyword_coverage", fallback["score_breakdown"]["keyword_coverage"]))))
    }

    raw_skills = raw_data.get("extracted_skills", {})
    skills = {
        "technical": [str(s).strip() for s in raw_skills.get("technical", fallback["extracted_skills"]["technical"]) if str(s).strip()],
        "soft": [str(s).strip() for s in raw_skills.get("soft", fallback["extracted_skills"]["soft"]) if str(s).strip()],
        "matched": [str(s).strip() for s in raw_skills.get("matched", fallback["extracted_skills"]["matched"]) if str(s).strip()],
        "missing": [str(s).strip() for s in raw_skills.get("missing", fallback["extracted_skills"]["missing"]) if str(s).strip()]
    }

    # Ensure technical skills list is populated
    if not skills["technical"]:
        skills["technical"] = fallback["extracted_skills"]["technical"]

    education = raw_data.get("extracted_education", fallback["extracted_education"])
    if not isinstance(education, list) or not education:
        education = fallback["extracted_education"]

    experience = raw_data.get("extracted_experience", fallback["extracted_experience"])
    if not isinstance(experience, list) or not experience:
        experience = fallback["extracted_experience"]

    improvements = raw_data.get("improvement_suggestions", fallback["improvement_suggestions"])
    if not isinstance(improvements, list) or not improvements:
        improvements = fallback["improvement_suggestions"]

    raw_questions = raw_data.get("interview_questions", {})
    interview_questions = {
        "technical": raw_questions.get("technical", fallback["interview_questions"]["technical"]),
        "hr": raw_questions.get("hr", fallback["interview_questions"]["hr"])
    }

    return {
        "ats_score": ats_score,
        "ats_rating": rating,
        "score_breakdown": breakdown,
        "job_match_score": job_match,
        "summary": str(raw_data.get("summary", fallback["summary"])).strip(),
        "extracted_skills": skills,
        "extracted_education": education,
        "extracted_experience": experience,
        "key_strengths": raw_data.get("key_strengths", fallback["key_strengths"]),
        "improvement_suggestions": improvements,
        "interview_questions": interview_questions
    }


def parse_analysis_dashboard(
    ai_text: str,
    resume_text: str,
    role: str,
    job_description: str
) -> tuple[str, dict[str, Any]]:
    """Extract both clean markdown report and validated dashboard data from AI response."""
    cleaned_markdown = ai_text.strip()
    dashboard_dict = None

    # Search for trailing ```json ... ``` block
    json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", ai_text, re.DOTALL)
    if json_match:
        try:
            raw_json = json_match.group(1).strip()
            dashboard_dict = json.loads(raw_json)
            # Remove JSON block from markdown presented to candidate
            part1 = ai_text[:json_match.start()].strip()
            part2 = ai_text[json_match.end():].strip()
            cleaned_markdown = (part1 + "\n\n" + part2).strip()
        except Exception:
            dashboard_dict = None

    if not dashboard_dict or not isinstance(dashboard_dict, dict):
        dashboard_dict = build_fallback_dashboard(cleaned_markdown, resume_text, role, job_description)

    normalized = normalize_dashboard_data(dashboard_dict, cleaned_markdown, resume_text, role, job_description)
    return cleaned_markdown, normalized
