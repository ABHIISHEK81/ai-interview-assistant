"""
InterviewAI Database Seeding and Initialization Utility.
Populates SQLite with production-grade candidate profiles, work timelines, education,
projects, certifications, mock interview evaluations, booked slots, UPI payments, and audit events.
"""
import sys
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.database import (
    get_connection,
    init_db,
    find_or_create_user,
    update_user_profile,
    record_interview_result,
    record_payment,
    log_audit_event,
)


def seed_database():
    print("=" * 60)
    print("  INITIALIZING INTERVIEWAI SQLITE DATABASE")
    print("=" * 60)

    # 1. Initialize tables and WAL mode
    init_db()
    print("[1/6] Schema & Tables initialized (WAL mode enabled).")

    # 2. Seed Candidate 1: Priya Sharma (Senior Full-Stack Engineer)
    u1 = find_or_create_user(
        provider="candidate",
        provider_id="demo_priya",
        email="priya.sharma@example.com",
        name="Priya Sharma",
        first_name="Priya",
        last_name="Sharma",
        avatar_url="https://ui-avatars.com/api/?name=Priya+Sharma&background=4f46e5&color=fff&size=160",
        password="Password123!",
    )
    u1_id = u1["id"]

    update_user_profile(
        u1_id,
        {
            "professional_title": "Senior Full-Stack Engineer | React, Python, FastAPI & Cloud Architect",
            "target_role": "Full Stack Software Engineer",
            "experience_level": "Mid-Level",
            "total_experience": "3.5 Years Exp",
            "current_company": "TechFlow Innovations",
            "notice_period": "15 Days",
            "annual_salary": "₹14,00,000 / yr",
            "expected_salary": "₹18,00,000 - ₹22,00,000 / yr",
            "job_type": "Full-time, Permanent",
            "preferred_location": "Bengaluru, Remote, Hyderabad",
            "job_status": "Actively Interviewing",
            "resume_headline": "Senior Full-Stack Engineer with 3.5+ years of experience engineering high-performance Python FastAPI and React applications. Specialized in REST API microservices, database optimization, and AI platform integration.",
            "skills": ["Python", "FastAPI", "React.js", "TypeScript", "PostgreSQL", "Docker", "REST APIs", "System Design", "Redis", "Git"],
            "soft_skills": ["Technical Communication", "System Architecture", "Analytical Problem Solving", "Agile Adaptability"],
            "is_subscribed": 1,
            "subscription_tier": "medium_129",
            "two_factor_enabled": 1,
        },
    )
    print(f"[2/6] Seeded primary candidate: Priya Sharma (ID: {u1_id})")

    # 3. Seed Candidate 2: Alex Morgan (Google Account Verified)
    u2 = find_or_create_user(
        provider="google",
        provider_id="google_108239019283",
        email="alex.morgan.physics@gmail.com",
        name="Alex Morgan",
        first_name="Alex",
        last_name="Morgan",
        avatar_url="https://ui-avatars.com/api/?name=Alex+Morgan&background=06b6d4&color=fff&size=160",
    )
    u2_id = u2["id"]

    update_user_profile(
        u2_id,
        {
            "professional_title": "Lead Cloud Infrastructure & AI Systems Architect",
            "target_role": "Cloud Solutions Architect",
            "experience_level": "Senior",
            "total_experience": "6+ Years Exp",
            "current_company": "Apex Cloud Dynamics",
            "notice_period": "Immediate",
            "annual_salary": "₹28,00,000 / yr",
            "expected_salary": "₹35,00,000 / yr",
            "job_type": "Remote / Contract",
            "preferred_location": "Worldwide Remote, Bengaluru",
            "job_status": "Open to Offers",
            "resume_headline": "Cloud Solutions Architect specializing in distributed high-availability microservices, Kubernetes clusters, and LLM inference deployment pipelines.",
            "skills": ["AWS", "Google Cloud", "Kubernetes", "Docker", "Python", "Go", "Terraform", "Kafka", "PostgreSQL"],
            "soft_skills": ["Technical Leadership", "Cross-functional Mentorship", "Stakeholder Communication"],
            "is_subscribed": 1,
            "subscription_tier": "high_199",
            "two_factor_enabled": 1,
        },
    )
    print(f"[3/6] Seeded secondary candidate: Alex Morgan (ID: {u2_id})")

    # 4. Populate Achievements, Certifications & Booked Slots
    conn = get_connection()
    try:
        with conn:
            # Additional certifications for Priya
            conn.execute(
                """
                INSERT OR IGNORE INTO achievements (user_id, title, issuer, issue_date, description)
                VALUES (?, 'Top 5% Global Coding Rank (LeetCode & HackerRank)', 'LeetCode & HackerRank', '2023', 'Solved 450+ Data Structures & Algorithms challenges across Graph Algorithms and Dynamic Programming.')
                """,
                (u1_id,),
            )
            conn.execute(
                """
                INSERT OR IGNORE INTO achievements (user_id, title, issuer, issue_date, description)
                VALUES (?, 'Google Cloud Certified Professional Cloud Architect', 'Google Cloud', '2024', 'Validated enterprise cloud infrastructure, high-availability architecture, and data engineering patterns.')
                """,
                (u2_id,),
            )

            # Booked Slots
            conn.execute(
                """
                INSERT OR IGNORE INTO booked_slots (user_id, title, role, slot_date, slot_time, interviewer_type, status, notes)
                VALUES (?, 'System Architecture & Concurrency Mock', 'Full Stack Software Engineer', '2026-09-28', '14:30', 'AI Technical Interviewer', 'Confirmed', 'Focus on database caching, race conditions, and REST API security.')
                """,
                (u1_id,),
            )
            conn.execute(
                """
                INSERT OR IGNORE INTO booked_slots (user_id, title, role, slot_date, slot_time, interviewer_type, status, notes)
                VALUES (?, 'Distributed Microservices & Kubernetes Screening', 'Cloud Solutions Architect', '2026-09-30', '16:00', 'AI Technical Interviewer', 'Confirmed', 'Testing container networking, service meshes, and failover design.')
                """,
                (u2_id,),
            )

            # Entitlements
            conn.execute(
                """
                INSERT OR IGNORE INTO entitlements (user_id, service_type, status, created_at)
                VALUES (?, 'pro_mastery_pass', 'active', CURRENT_TIMESTAMP)
                """,
                (u1_id,),
            )
            conn.execute(
                """
                INSERT OR IGNORE INTO entitlements (user_id, service_type, status, created_at)
                VALUES (?, 'vip_lifetime_pass', 'active', CURRENT_TIMESTAMP)
                """,
                (u2_id,),
            )
    finally:
        conn.close()
    print("[4/6] Populated achievements, certifications, booked slots, and entitlements.")

    # 5. Populate Interview Evaluations
    record_interview_result(
        user_id=u1_id,
        role="Full Stack Software Engineer",
        overall_score=88,
        technical_score=92,
        hr_score=84,
        answers_count=5,
        summary="Candidate exhibited outstanding mastery of asynchronous Python FastAPI endpoints, React memoization, and PostgreSQL query index optimization. Excellent architectural composure.",
    )
    record_interview_result(
        user_id=u1_id,
        role="Senior Frontend Developer",
        overall_score=82,
        technical_score=84,
        hr_score=79,
        answers_count=5,
        summary="Solid grasp of state management and Core Web Vitals optimization. Recommended incorporating more STAR structure in behavioral responses.",
    )
    record_interview_result(
        user_id=u2_id,
        role="Cloud Solutions Architect",
        overall_score=94,
        technical_score=96,
        hr_score=91,
        answers_count=5,
        summary="Exceptional knowledge of distributed system design, multi-region failover topologies, and zero-trust Kubernetes networking.",
    )
    print("[5/6] Populated AI interview evaluation records.")

    # 6. Populate Verified UPI Payments & Audit Trail
    record_payment(
        user_id=u1_id,
        plan_tier="medium_129",
        plan_name="Pro Mastery (Medium Tier)",
        amount_inr=129,
        utr_number="UPI492019482019",
    )
    record_payment(
        user_id=u2_id,
        plan_tier="high_199",
        plan_name="Ultimate Lifetime Pass (High Tier)",
        amount_inr=199,
        utr_number="UPI883019283019",
    )
    log_audit_event(u1_id, "user_registration", "Candidate Priya Sharma registered and onboarded.")
    log_audit_event(u1_id, "payment_verified", "Verified ₹129 UPI payment with UTR UPI492019482019.")
    log_audit_event(u2_id, "user_registration", "Candidate Alex Morgan authenticated via Google OAuth.")
    log_audit_event(u2_id, "payment_verified", "Verified ₹199 VIP payment with UTR UPI883019283019.")
    print("[6/6] Populated UPI payments and security audit events.")

    # 7. Print Table Summary
    print("\n" + "=" * 60)
    print("  DATABASE POPULATION COMPLETED SUCCESSFULLY")
    print("=" * 60)
    conn = get_connection()
    try:
        tables = [
            "users",
            "work_experience",
            "education_history",
            "projects",
            "achievements",
            "booked_slots",
            "interview_history",
            "payments",
            "entitlements",
            "audit_events",
        ]
        for t in tables:
            cnt = conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
            print(f"  • Table '{t}': {cnt} records")
    finally:
        conn.close()
    print("=" * 60)


if __name__ == "__main__":
    seed_database()
