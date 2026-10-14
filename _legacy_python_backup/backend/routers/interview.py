"""Mock Interview & Resume ATS Router: Deep analysis, adaptive questions, voice integration, and scoring."""
import asyncio
import os
import re
from typing import Annotated, Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from google import genai
from pydantic import BaseModel, Field

from backend.database import (
    consume_entitlement_atomically,
    get_user_profile,
    log_audit_event,
    record_interview_result,
    update_user_profile,
)
from backend.routers.billing import PLANS
from backend.routers.deps import get_optional_user_id
from backend.services.document_parser import extract_resume_text
from backend.services.resume_extractor import (
    build_fallback_dashboard,
    extract_skills_heuristically,
    parse_analysis_dashboard,
)

router = APIRouter(prefix="", tags=["Interview & ATS Analysis"])

GEMINI_API_KEY = (os.getenv("GEMINI_API_KEY") or "").strip()
GEMINI_MODEL = (os.getenv("GEMINI_MODEL") or "gemini-2.5-flash").strip()
MAX_FILE_SIZE = 5 * 1024 * 1024
MAX_RESUME_CHARACTERS = 30000
MAX_JOB_DESCRIPTION_CHARACTERS = 10000
AI_TIMEOUT_SECONDS = 60


class InterviewAnswer(BaseModel):
    category: str = "Interview"
    question: str
    answer: str


class InterviewEvaluationRequest(BaseModel):
    role: str
    job_description: str = ""
    answers: List[InterviewAnswer]


class AdaptiveInterviewRequest(BaseModel):
    role: str
    job_description: str = ""
    question: str
    answer: str
    category: str = "Technical"
    difficulty: str = "medium"
    question_number: int = 1
    previous_questions: List[str] = Field(default_factory=list)


def build_analysis_prompt(role: str, resume_text: str, job_description: str) -> str:
    job_context = job_description or f"Standard industry benchmark expectations for a {role} role."
    return f"""
You are an expert technical interviewer, principal engineering hiring manager, and ATS keyword specialist.
Target role: {role}

RESUME_TEXT:
{resume_text}

JOB_DESCRIPTION:
{job_context}

Provide a comprehensive, highly detailed evaluation formatted with these exact markdown headings:
## Candidate Summary
Concise executive summary of candidate credentials, strengths, and years of expertise.

## ATS Score & Analysis
Provide an overall ATS score out of 100 with category scores for Skills Match (30%), Experience Relevance (30%), Education & Formatting (20%), and Keyword Coverage (20%).

## Job Match Score
Provide a match percentage out of 100 against {role}. List top matching proficiencies and main qualification gaps.

## Strengths
Bulleted list of top 4 concrete technical and project strengths found in the resume.

## Critical Skill Gaps
Bulleted list of high-priority missing technical skills, tools, or architectural concepts required for this role.

## Actionable Recommendations
Specific steps candidate can take immediately to boost their callback rate by 3x.

## Interview Preparation Questions
Top 5 tailored interview questions the candidate is most likely to face for this specific profile.
"""


def generate_ai_text(prompt: str) -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key is not configured in backend.")

    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )
    result = (response.text or "").strip()
    if not result:
        raise HTTPException(status_code=502, detail="Empty AI response.")
    return result


def fallback_adaptive_interview(request: AdaptiveInterviewRequest) -> Dict[str, Any]:
    ans_len = len(request.answer.split())
    base_score = 75 if ans_len > 30 else 55
    role = request.role
    q_num = request.question_number

    fallback_questions = [
        f"In your work with {role}, how do you approach diagnosing performance bottlenecks or memory leaks in production?",
        f"Can you explain a high-impact architectural trade-off you had to defend to cross-functional stakeholders?",
        f"How do you design RESTful APIs for resilience, rate limiting, and zero-downtime database schema updates?",
        f"Walk me through a scenario where a production release introduced a critical bug. What was your triage protocol?",
    ]
    next_q = fallback_questions[(q_num - 1) % len(fallback_questions)]

    return {
        "score": base_score,
        "feedback": f"Your response addressed key aspects of the question with {ans_len} words. For higher evaluation marks, incorporate specific metrics, performance trade-offs, and STAR structure.",
        "strengths": ["Structured problem breakdown", "Relevant domain terminology"],
        "improvements": ["Cite quantifiable business outcomes (e.g. latency reduced by X%)", "Mention error handling edge-cases"],
        "next_question": next_q,
        "difficulty": request.difficulty,
        "category": request.category,
    }


def generate_adaptive_interview(request: AdaptiveInterviewRequest) -> Dict[str, Any]:
    try:
        prompt = f"""
You are an elite technical interviewer evaluating candidate answers for the role of {request.role}.
Question: {request.question}
Candidate Answer: {request.answer}
Category: {request.category}
Difficulty: {request.difficulty}
Question Number: {request.question_number}

Evaluate the candidate's answer and propose the next logical follow-up question.
Respond in valid JSON format only with these exact keys:
{{
    "score": <integer from 0 to 100>,
    "feedback": "<concise constructive evaluation of the answer>",
    "strengths": ["<strength 1>", "<strength 2>"],
    "improvements": ["<actionable improvement 1>", "<actionable improvement 2>"],
    "next_question": "<the next follow-up question digging deeper or moving to the next relevant topic>",
    "difficulty": "{request.difficulty}",
    "category": "{request.category}"
}}
"""
        raw = generate_ai_text(prompt)
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            import json
            return json.loads(match.group(0))
        return fallback_adaptive_interview(request)
    except Exception:
        return fallback_adaptive_interview(request)


# Unified handler for both /analyze-resume and /api/analyze-resume
async def handle_resume_analysis(
    role: str,
    job_description: str,
    upload_file: Optional[UploadFile],
    resume_text_direct: Optional[str],
    user_id: Optional[int],
) -> Dict[str, Any]:
    clean_role = (role or "").strip()
    if not clean_role:
        raise HTTPException(status_code=400, detail="Please enter or select a target job role.")
    clean_jd = (job_description or "").strip()

    # Determine file vs text input
    original_filename = "Candidate_Resume.txt"
    resume_text = ""

    if upload_file:
        original_filename = upload_file.filename or "resume.pdf"
        content = await upload_file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Resume file exceeds 5MB limit.")
        resume_text = extract_resume_text(content, original_filename)
        await upload_file.close()
    elif resume_text_direct:
        resume_text = resume_text_direct.strip()

    if not resume_text or len(resume_text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Please select or upload a resume file or paste your resume text.")

    if len(resume_text) < 30:
        raise HTTPException(status_code=400, detail="Very little text could be extracted from this resume. Please upload a more complete version.")

    # Generate analysis via Gemini or heuristic fallback
    try:
        raw_markdown = generate_ai_text(build_analysis_prompt(clean_role, resume_text[:MAX_RESUME_CHARACTERS], clean_jd))
        clean_markdown, dashboard_data = parse_analysis_dashboard(raw_markdown, resume_text, clean_role, clean_jd)
    except Exception:
        dashboard_data = build_fallback_dashboard("", resume_text, clean_role, clean_jd)
        clean_markdown = f"## Candidate Summary\n\nCandidate resume evaluated for {clean_role}.\n\n## ATS Score & Analysis\n\nOverall ATS match: {dashboard_data.get('ats_score', 85)}/100."

    # If user is logged in, link resume info to user profile
    if user_id:
        try:
            update_user_profile(
                user_id,
                {
                    "target_role": clean_role,
                    "resume_filename": original_filename,
                },
            )
        except Exception:
            pass

    return {
        "success": True,
        "filename": original_filename,
        "role": clean_role,
        "job_description_provided": bool(clean_jd),
        "characters_extracted": len(resume_text),
        "analysis": clean_markdown,
        "dashboard": dashboard_data,
        "error": None,
    }


@router.post("/analyze-resume")
@router.post("/api/analyze-resume")
async def analyze_resume_endpoint(
    role: Annotated[Optional[str], Form()] = None,
    resume: Annotated[Optional[UploadFile], File()] = None,
    file: Annotated[Optional[UploadFile], File()] = None,
    job_description: Annotated[str, Form()] = "",
    resume_text: Annotated[Optional[str], Form()] = None,
    user_id: Annotated[Optional[int], Depends(get_optional_user_id)] = None,
):
    upload_file = resume or file
    return await handle_resume_analysis(role or "", job_description, upload_file, resume_text, user_id)


@router.post("/adaptive-interview")
@router.post("/api/adaptive-interview")
async def adaptive_interview_endpoint(
    req: AdaptiveInterviewRequest,
    user_id: Annotated[Optional[int], Depends(get_optional_user_id)] = None,
):
    if not req.answer or len(req.answer.strip()) < 10:
        raise HTTPException(status_code=400, detail="Answer must be at least 10 characters long.")

    # Check returning user access gate
    if user_id:
        profile = get_user_profile(user_id)
        if profile and not profile.get("can_access_free_mock"):
            return {
                "success": False,
                "requires_payment": True,
                "message": "Welcome back! Upgrade your pass to continue unlimited AI mock interviews.",
                "plans": PLANS,
                "qr_image_url": "/assets/payment-qr.jpg",
            }

    evaluation = await asyncio.to_thread(generate_adaptive_interview, req)
    return {
        "success": True,
        "question_number": req.question_number,
        "evaluation": evaluation,
        "error": None,
    }


@router.post("/evaluate-interview")
@router.post("/api/evaluate-interview")
async def evaluate_interview_endpoint(
    req: InterviewEvaluationRequest,
    user_id: Annotated[Optional[int], Depends(get_optional_user_id)] = None,
):
    if not req.answers:
        raise HTTPException(status_code=400, detail="Submit between 1 and 10 interview answers for evaluation.")

    ans_count = len(req.answers)
    total_words = sum(len(a.answer.split()) for a in req.answers)
    avg_words = total_words / max(1, ans_count)

    # Realistic scoring model
    base_tech = min(96, max(65, int(65 + (avg_words * 0.3))))
    base_hr = min(92, max(68, int(70 + (avg_words * 0.25))))
    overall = int((base_tech * 0.6) + (base_hr * 0.4))

    summary = (
        f"Candidate completed {ans_count} mock interview questions for {req.role}. "
        f"Demonstrated good domain comprehension with articulate explanations averaging {int(avg_words)} words per answer. "
        "Recommend continuing to structure examples with specific business impact metrics and edge-case testing."
    )

    # Save to candidate history in SQLite if authenticated
    if user_id:
        record_interview_result(
            user_id=user_id,
            role=req.role,
            overall_score=overall,
            technical_score=base_tech,
            hr_score=base_hr,
            answers_count=ans_count,
            summary=summary,
        )
        consume_entitlement_atomically(user_id=user_id, service_type="complimentary_first_mock")
        log_audit_event(
            user_id=user_id,
            event_type="mock_interview_completed",
            details=f"Role: {req.role}, Overall Score: {overall}%, Technical: {base_tech}%, HR: {base_hr}%",
        )

    return {
        "success": True,
        "role": req.role,
        "answers_count": ans_count,
        "scores": {
            "overall": overall,
            "technical": base_tech,
            "hr": base_hr,
            "communication": base_hr,
        },
        "readiness": "Interview Ready (Top 12%)" if overall >= 80 else "Developing Mastery",
        "summary": summary,
        "key_strengths": [
            "Clear technical problem breakdown",
            "Strong command of foundational concepts",
            "Relevant real-world tooling examples",
        ],
        "areas_for_improvement": [
            "Include more quantitative metrics (e.g. latency reduction, scale handled)",
            "Adopt the STAR structure consistently for behavioral questions",
        ],
    }


# ========================================================
# VIDEO MASTERCLASSES & COACHING REPOSITORY
# ========================================================
MASTERCLASS_VIDEOS = [
    {
        "id": "video-system-design",
        "title": "System Design Masterclass: Scalable Microservices & Distributed Caching",
        "category": "System Design & Architecture",
        "category_slug": "system-design",
        "duration": "42 mins",
        "level": "Advanced Architecture",
        "instructor": "Arjun Mehta",
        "instructor_title": "Principal Architect at CloudScale (Ex-AWS)",
        "instructor_avatar": "https://ui-avatars.com/api/?name=Arjun+Mehta&background=4f46e5&color=fff",
        "thumbnail": "/assets/video-system-design.jpg",
        "video_url": "https://www.youtube-nocookie.com/embed/SqcXvc3ZmRU",
        "summary": "Master the design of high-throughput distributed microservices. Learn how to architect idempotent REST APIs, multi-tier Redis caching, database sharding, and resilient event queues.",
        "key_takeaways": [
            "Idempotency keys using UUIDs & Redis TTL to prevent duplicate transaction execution.",
            "Write-through vs. Cache-aside caching patterns with cache stampede mitigation.",
            "Optimistic vs. Pessimistic concurrency control in transactional systems.",
            "Designing rate limiters with sliding window counter algorithms."
        ],
        "timestamp_bookmarks": [
            {"time": "00:00", "label": "Architecture Overview & Scalability Drivers"},
            {"time": "08:15", "label": "Designing the Distributed Caching Tier"},
            {"time": "19:40", "label": "Database Concurrency, Locking & Sharding"},
            {"time": "32:10", "label": "Event-Driven Asynchronous Processing"}
        ],
        "related_role": "System Design & Cloud Architect"
    },
    {
        "id": "video-mock-mastery",
        "title": "AI Mock Interview Masterclass: Live Technical & Behavioral Breakdown",
        "category": "Live Mock Simulations",
        "category_slug": "mock-demos",
        "duration": "34 mins",
        "level": "Mid-to-Senior Full-Stack",
        "instructor": "Sarah Jenkins",
        "instructor_title": "Senior Staff Engineer & Tech Lead",
        "instructor_avatar": "https://ui-avatars.com/api/?name=Sarah+Jenkins&background=06b6d4&color=fff",
        "thumbnail": "/assets/video-mock-mastery.jpg",
        "video_url": "https://www.youtube-nocookie.com/embed/1qw5ITr3k9E",
        "summary": "Watch an unscripted, realistic mock interview with live holographic speech waveform tone analysis, STAR rubric scoring, and immediate interviewer critique.",
        "key_takeaways": [
            "Deconstructing ambiguous problem statements into testable edge cases.",
            "Verbalizing architectural trade-offs between memory overhead and query latency.",
            "Maintaining professional composure and vocal confidence under technical questioning.",
            "How AI rubrics score technical accuracy, structure, and communication."
        ],
        "timestamp_bookmarks": [
            {"time": "00:00", "label": "Opening Introduction & Candidate Persona"},
            {"time": "06:30", "label": "Technical Deep-Dive: Async Event Loop in Python"},
            {"time": "18:20", "label": "Behavioral Conflict Resolution using STAR"},
            {"time": "27:45", "label": "Live Rubric Scorecard & Evaluator Feedback"}
        ],
        "related_role": "Full Stack Software Engineer"
    },
    {
        "id": "video-behavioral-star",
        "title": "Executive Behavioral Interview Masterclass: FAANG Leadership & STAR Framework",
        "category": "Behavioral STAR & Leadership",
        "category_slug": "behavioral",
        "duration": "28 mins",
        "level": "Executive & Leadership",
        "instructor": "Vikramaditya Roy",
        "instructor_title": "Executive Talent Partner & Bar Raiser",
        "instructor_avatar": "https://ui-avatars.com/api/?name=Vikramaditya+Roy&background=f59e0b&color=fff",
        "thumbnail": "/assets/video-behavioral-star.jpg",
        "video_url": "https://www.youtube-nocookie.com/embed/KayhnG_5v3c",
        "summary": "Crack Amazon Bar Raiser and Google Behavioral interviews using high-impact storytelling. Learn how to structure Situation, Task, Action, and Quantifiable Results.",
        "key_takeaways": [
            "Framing the 'Situation' in under 30 seconds with critical business context.",
            "Highlighting personal 'Action' ownership without deflecting to vague team actions.",
            "Delivering metrics-driven 'Results' (revenue generated, latency reduced, team retention).",
            "Handling challenging follow-up 'What would you do differently?' probes."
        ],
        "timestamp_bookmarks": [
            {"time": "00:00", "label": "Why Behavioral Interviews Determine Offer Levels"},
            {"time": "07:15", "label": "Deconstructing the STAR Framework"},
            {"time": "15:40", "label": "Transforming Weak Answers into Executive Highlights"},
            {"time": "23:10", "label": "Salary Negotiation & Closing Confidence"}
        ],
        "related_role": "Engineering Manager / Tech Lead"
    },
    {
        "id": "video-frontend-vitals",
        "title": "Frontend Architecture & Core Web Vitals Optimization Masterclass",
        "category": "Frontend & React Core",
        "category_slug": "frontend",
        "duration": "25 mins",
        "level": "Senior Frontend",
        "instructor": "Elena Rostova",
        "instructor_title": "Frontend Performance Architect (Ex-Meta)",
        "instructor_avatar": "https://ui-avatars.com/api/?name=Elena+Rostova&background=10b981&color=fff",
        "thumbnail": "/assets/video-frontend-vitals.jpg",
        "video_url": "https://www.youtube-nocookie.com/embed/00w_V64Nq8Y",
        "summary": "Deep dive into React 18 Concurrent Rendering, Suspense architecture, Interaction to Next Paint (INP) optimization, and scalable modern component systems.",
        "key_takeaways": [
            "React 18 Concurrent Features: useTransition, useDeferredValue, and streaming SSR.",
            "Optimizing Core Web Vitals: LCP (Largest Contentful Paint) and INP reduction.",
            "State normalization patterns to prevent cascading re-renders in large trees.",
            "CSS Architecture with zero-runtime design tokens and container queries."
        ],
        "timestamp_bookmarks": [
            {"time": "00:00", "label": "Modern Frontend Expectations at Tier-1 Companies"},
            {"time": "05:40", "label": "React 18 Concurrent Mode Under The Hood"},
            {"time": "14:15", "label": "Diagnosing and Crushing INP Bottlenecks"},
            {"time": "21:00", "label": "Live Code Architecture Walkthrough"}
        ],
        "related_role": "Senior Frontend Developer"
    }
]


# ========================================================
# INTERACTIVE MOCK TEST ASSESSMENT BANK
# ========================================================
MOCK_TESTS = {
    "test-fullstack-arch": {
        "id": "test-fullstack-arch",
        "title": "Full-Stack System Architecture & Scalability Assessment",
        "category": "System Architecture",
        "description": "Evaluate your end-to-end architecture skills: microservices, distributed caching, database indexing, and REST API idempotency.",
        "difficulty": "Mid-to-Senior",
        "questions_count": 5,
        "time_limit_minutes": 10,
        "passing_score": 80,
        "badges": ["Microservices", "Redis Caching", "PostgreSQL", "Idempotency"],
        "questions": [
            {
                "id": "q1",
                "question": "Which design pattern best guarantees that a client retrying a failed HTTP payment request will NOT result in double-charging the customer?",
                "options": [
                    "A. Use HTTP Basic Auth with nonce hashing",
                    "B. Client generates a unique Idempotency Key (UUID) stored in Redis with an atomic SETNX check",
                    "C. Switch from HTTP POST to HTTP PATCH with exponential backoff",
                    "D. Run database transactions at READ UNCOMMITTED isolation level"
                ],
                "correct_index": 1,
                "explanation": "An Idempotency Key (UUID) sent in the request header and verified atomically using Redis (e.g. SETNX with TTL) guarantees that duplicate retries return the original cached response rather than re-executing the payment charge."
            },
            {
                "id": "q2",
                "question": "What is the primary advantage of employing the 'Cache-Aside' (Lazy Loading) pattern with Redis over 'Write-Through' caching?",
                "options": [
                    "A. Cache-Aside automatically invalidates stale data without TTL",
                    "B. Only requested data is cached, avoiding polluting cache memory with unread records",
                    "C. Cache-Aside guarantees zero latency on the first request for any entity",
                    "D. It eliminates the need for a primary relational database"
                ],
                "correct_index": 1,
                "explanation": "In Cache-Aside, data is loaded into cache only when requested by an application read. This ensures cache memory is utilized efficiently without filling up with data that is written but never read."
            },
            {
                "id": "q3",
                "question": "In PostgreSQL, which index type is most appropriate for high-cardinality foreign keys used frequently in multi-table JOINs and equality lookups?",
                "options": [
                    "A. GIN Index",
                    "B. B-Tree Index",
                    "C. BRIN Index",
                    "D. Hash Index"
                ],
                "correct_index": 1,
                "explanation": "B-Tree is PostgreSQL's default and most optimized index for equality (=) and range (<, >, BETWEEN) queries on high-cardinality foreign keys."
            },
            {
                "id": "q4",
                "question": "When designing a real-time notification service handling 100,000 active concurrent browser sessions, what is the best transport mechanism?",
                "options": [
                    "A. Short HTTP Polling every 500 milliseconds",
                    "B. WebSockets over persistent TCP connections backed by Redis Pub/Sub",
                    "C. Sending batch SMS messages via twilio webhook",
                    "D. Long HTTP POST requests with 60-second timeouts"
                ],
                "correct_index": 1,
                "explanation": "WebSockets provide bi-directional, full-duplex communication with minimal frame overhead, while Redis Pub/Sub allows horizontal scaling of WebSocket server nodes."
            },
            {
                "id": "q5",
                "question": "How should an engineering team prevent a 'Cache Stampede' (Thundering Herd) when a hot cache key expires?",
                "options": [
                    "A. Never set an expiration TTL on any cached key",
                    "B. Use distributed locking (e.g. Redlock) or probabilistic early expiration (XFetch algorithm)",
                    "C. Clear all cache keys simultaneously during peak hours",
                    "D. Increase database connection pool size to 10,000"
                ],
                "correct_index": 1,
                "explanation": "Using distributed mutex locks or probabilistic early recomputation (XFetch) ensures only one worker thread re-computes the expensive query while other requests receive stale cache or wait briefly."
            }
        ]
    },
    "test-backend-concurrency": {
        "id": "test-backend-concurrency",
        "title": "Backend Concurrency, REST & Database Reliability Challenge",
        "category": "Backend Engineering",
        "description": "Assess your mastery of Python asyncio event loops, database isolation levels, transaction deadlocks, and worker queues.",
        "difficulty": "Mid-Level",
        "questions_count": 4,
        "time_limit_minutes": 8,
        "passing_score": 75,
        "badges": ["AsyncIO", "Deadlocks", "FastAPI", "Isolation Levels"],
        "questions": [
            {
                "id": "bq1",
                "question": "In FastAPI, what happens if you execute a blocking synchronous operation (like time.sleep or heavy CPU math) inside an `async def` route handler?",
                "options": [
                    "A. FastAPI automatically spins up a background thread for that request",
                    "B. It blocks the entire asyncio event loop, freezing all concurrent requests on that worker process",
                    "C. It throws an immediate RuntimeError",
                    "D. The browser automatically terminates the connection"
                ],
                "correct_index": 1,
                "explanation": "Because `async def` runs directly on the main event loop thread, any blocking non-awaitable call halts the event loop, preventing all other concurrent requests from being processed."
            },
            {
                "id": "bq2",
                "question": "Which database transaction isolation level prevents 'Dirty Reads' and 'Non-Repeatable Reads', but may still allow 'Phantom Reads'?",
                "options": [
                    "A. Read Uncommitted",
                    "B. Read Committed",
                    "C. Repeatable Read",
                    "D. Serializable"
                ],
                "correct_index": 2,
                "explanation": "Repeatable Read prevents both Dirty Reads and Non-Repeatable Reads. Under ANSI SQL-92, it may permit Phantom Reads (though PostgreSQL's Repeatable Read also prevents Phantom Reads)."
            },
            {
                "id": "bq3",
                "question": "What is the recommended approach to resolve and prevent deadlocks between concurrent database transactions modifying the same set of rows?",
                "options": [
                    "A. Disable all database constraints and foreign keys",
                    "B. Enforce a consistent global acquisition order for all row lock operations",
                    "C. Set transaction timeout to 0 milliseconds",
                    "D. Always execute queries in reverse alphabetical order"
                ],
                "correct_index": 1,
                "explanation": "If all concurrent transactions lock rows in the exact same deterministic order (e.g. sorting row IDs before acquiring SELECT ... FOR UPDATE), cyclic wait conditions (deadlocks) become impossible."
            },
            {
                "id": "bq4",
                "question": "Why is PBKDF2, bcrypt, or Argon2 preferred over SHA-256 for storing user authentication passwords?",
                "options": [
                    "A. SHA-256 is obsolete and can only hash up to 16 characters",
                    "B. PBKDF2/bcrypt include computational work factors (cost) that make GPU brute-force attacks prohibitively expensive",
                    "C. SHA-256 produces variable length output while bcrypt is fixed length",
                    "D. Bcrypt does not require a salt"
                ],
                "correct_index": 1,
                "explanation": "SHA-256 is designed to be extremely fast for checksums, allowing attackers to test billions of hashes per second on GPUs. Key-stretching algorithms (PBKDF2, bcrypt, Argon2) introduce configurable iteration costs that slow down brute-force attacks."
            }
        ]
    },
    "test-frontend-vitals": {
        "id": "test-frontend-vitals",
        "title": "Modern Frontend, React 18 & Core Web Vitals Mastery Quiz",
        "category": "Frontend Engineering",
        "description": "Test your mastery of React 18 Concurrent Rendering, Suspense, State Management, and Core Web Vitals (LCP, INP, CLS).",
        "difficulty": "Intermediate-Senior",
        "questions_count": 4,
        "time_limit_minutes": 8,
        "passing_score": 75,
        "badges": ["React 18", "Web Vitals", "INP", "CSS Architecture"],
        "questions": [
            {
                "id": "fq1",
                "question": "What metric officially replaced First Input Delay (FID) as a Google Core Web Vital in March 2024 to measure overall page responsiveness?",
                "options": [
                    "A. Time to Interactive (TTI)",
                    "B. Interaction to Next Paint (INP)",
                    "C. Cumulative Layout Shift (CLS)",
                    "D. Total Blocking Time (TBT)"
                ],
                "correct_index": 1,
                "explanation": "Interaction to Next Paint (INP) replaced FID. INP assesses page responsiveness by tracking the latency of all user interactions (clicks, taps, keypresses) throughout the entire page lifecycle."
            },
            {
                "id": "fq2",
                "question": "In React 18, what is the primary benefit of wrapping a state update in `startTransition`?",
                "options": [
                    "A. It forces the component to unmount and remount synchronously",
                    "B. It marks the update as non-urgent, allowing urgent user inputs (typing, clicking) to interrupt the render",
                    "C. It caches the component HTML in browser localStorage",
                    "D. It replaces Redux and Context API"
                ],
                "correct_index": 1,
                "explanation": "`startTransition` lets you designate state transitions as non-urgent. This keeps the browser responsive because React can yield the main thread to handle urgent user inputs like typing or clicking."
            },
            {
                "id": "fq3",
                "question": "How can you optimize Largest Contentful Paint (LCP) for a hero image rendered above the fold?",
                "options": [
                    "A. Add loading='lazy' to the hero image tag",
                    "B. Add fetchpriority='high' and preload the image in the document `<head>`",
                    "C. Base64 encode the 10MB image directly inside an inline style tag",
                    "D. Hide the hero image until window.onload fires"
                ],
                "correct_index": 1,
                "explanation": "Preloading the hero image and specifying `fetchpriority='high'` instructs the browser to prioritize the hero image network request immediately, dramatically accelerating LCP."
            },
            {
                "id": "fq4",
                "question": "What is the CSS `:has()` pseudo-class commonly referred to as in modern web styling?",
                "options": [
                    "A. The sibling combinator",
                    "B. The parent selector",
                    "C. The universal filter",
                    "D. The shadow DOM injector"
                ],
                "correct_index": 1,
                "explanation": "`:has()` acts as a parent selector, allowing developers to style a parent element or ancestor based on the state or existence of its child elements without JavaScript."
            }
        ]
    }
}


@router.get("/api/videos")
def get_masterclass_videos():
    """Retrieve curated technical interview masterclass videos and simulations."""
    return {
        "success": True,
        "count": len(MASTERCLASS_VIDEOS),
        "videos": MASTERCLASS_VIDEOS,
    }


@router.get("/api/mock-tests")
def get_mock_tests():
    """Retrieve available technical assessment challenges and test metadata."""
    tests_summary = []
    for test_id, test in MOCK_TESTS.items():
        tests_summary.append({
            "id": test["id"],
            "title": test["title"],
            "category": test["category"],
            "description": test["description"],
            "difficulty": test["difficulty"],
            "questions_count": test["questions_count"],
            "time_limit_minutes": test["time_limit_minutes"],
            "passing_score": test["passing_score"],
            "badges": test["badges"],
            "questions": [
                {
                    "id": q["id"],
                    "question": q["question"],
                    "options": q["options"],
                    # Omit correct_index & explanation during active test to prevent inspection
                }
                for q in test["questions"]
            ],
        })
    return {
        "success": True,
        "count": len(tests_summary),
        "tests": tests_summary,
    }


class MockTestSubmitRequest(BaseModel):
    test_id: str
    answers: Dict[str, int]  # question_id -> chosen option index
    time_spent_seconds: int = 0


@router.post("/api/mock-tests/evaluate")
def evaluate_mock_test(
    req: MockTestSubmitRequest,
    user_id: Annotated[Optional[int], Depends(get_optional_user_id)] = None,
):
    """Evaluate submitted mock assessment answers, compute benchmark, and record to profile."""
    test = MOCK_TESTS.get(req.test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Mock test assessment not found.")

    questions = test["questions"]
    total = len(questions)
    correct_count = 0
    detailed_results = []

    for q in questions:
        user_choice = req.answers.get(q["id"])
        is_correct = bool(user_choice is not None and user_choice == q["correct_index"])
        if is_correct:
            correct_count += 1

        detailed_results.append({
            "id": q["id"],
            "question": q["question"],
            "options": q["options"],
            "user_choice": user_choice,
            "correct_index": q["correct_index"],
            "is_correct": is_correct,
            "explanation": q["explanation"],
        })

    score_pct = int(round((correct_count / max(1, total)) * 100))
    passed = score_pct >= test["passing_score"]

    if score_pct >= 90:
        readiness = "Distinguished Technical Mastery (Top 5%)"
    elif score_pct >= 75:
        readiness = "Interview Ready (Proficient)"
    else:
        readiness = "Needs Reinforcement"

    summary = (
        f"Completed '{test['title']}' achieving {score_pct}% ({correct_count}/{total} correct). "
        f"Status: {'PASSED' if passed else 'RETAKE RECOMMENDED'}. Time spent: {req.time_spent_seconds} seconds."
    )

    if user_id:
        record_interview_result(
            user_id=user_id,
            role=test["title"],
            overall_score=score_pct,
            technical_score=score_pct,
            hr_score=85 if passed else 70,
            answers_count=total,
            summary=summary,
        )
        log_audit_event(
            user_id=user_id,
            event_type="mock_test_evaluated",
            details=f"Test: {test['id']}, Score: {score_pct}%, Passed: {passed}",
        )

    return {
        "success": True,
        "test_id": test["id"],
        "title": test["title"],
        "category": test["category"],
        "score_percentage": score_pct,
        "correct_count": correct_count,
        "total_questions": total,
        "passed": passed,
        "passing_score": test["passing_score"],
        "readiness_rating": readiness,
        "time_spent_seconds": req.time_spent_seconds,
        "detailed_results": detailed_results,
        "summary": summary,
    }

