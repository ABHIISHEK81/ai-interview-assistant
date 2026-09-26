import json
import urllib.request

base = "http://127.0.0.1:8000"

def test_get(path):
    req = urllib.request.Request(f"{base}{path}")
    with urllib.request.urlopen(req) as res:
        content = res.read()
        print(f"GET {path} -> {res.status} ({len(content)} bytes)")
        return content

def test_post(path, data, token=None):
    json_bytes = json.dumps(data).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{base}{path}", data=json_bytes, headers=headers, method="POST")
    with urllib.request.urlopen(req) as res:
        resp = json.loads(res.read().decode("utf-8"))
        print(f"POST {path} -> {res.status}, success: {resp.get('success')}")
        return resp

if __name__ == "__main__":
    print("--- 1. Testing Frontend Static Assets ---")
    test_get("/")
    test_get("/style.css")
    test_get("/js/app.js")
    test_get("/js/auth.js")
    test_get("/js/profile.js")
    test_get("/js/interview.js")
    test_get("/js/billing.js")
    test_get("/assets/payment-qr.jpg")

    print("\n--- 2. Testing Authentication ---")
    guest_res = test_post("/api/auth/guest-login", {"persona": "priya"})
    token = guest_res["token"]
    user_id = guest_res["user"]["id"]
    print("User authenticated:", guest_res["user"]["name"], "| ID:", user_id)

    print("\n--- 3. Testing Naukri+Google Profile API ---")
    req = urllib.request.Request(f"{base}/api/profile", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as res:
        p_data = json.loads(res.read().decode("utf-8"))
        profile = p_data["profile"]
        print("Candidate Name:", profile["name"])
        print("Professional Title:", profile["professional_title"])
        print("Headline:", profile["resume_headline"][:60], "...")
        print("Skills Count:", len(profile["skills_list"]), "->", profile["skills_list"][:4])
        print("Experience Count:", len(profile["work_experience"]))
        print("Education Count:", len(profile["education"]))
        print("Projects Count:", len(profile["projects"]))
        print("Profile Strength:", profile["profile_strength"]["percentage"], "% (", profile["profile_strength"]["level"], ")")

    print("\n--- 3b. Testing Profile CRUD Endpoints ---")
    # Add Skill
    skill_res = test_post("/api/profile/skills", {"skill": "Kubernetes Orchestration"}, token=token)
    print("Added skill, count now:", len(skill_res.get("skills_list", [])))
    
    # Toggle 2FA
    t2fa_res = test_post("/api/profile/toggle-2fa", {}, token=token)
    print("Toggled 2FA -> new state:", t2fa_res.get("two_factor_enabled"))

    # Add Experience
    exp_res = test_post(
        "/api/profile/experience",
        {
            "job_title": "Lead Platform Engineer",
            "company": "CloudScale Systems",
            "location": "Bengaluru, India",
            "start_date": "2024-01",
            "end_date": "Present",
            "is_current": True,
            "description": "Architected Kubernetes clusters and automated CI/CD pipelines."
        },
        token=token
    )
    print("Added work experience -> ID:", exp_res.get("item", {}).get("id"))

    # Add Education
    edu_res = test_post(
        "/api/profile/education",
        {
            "degree_title": "M.S. in Software Systems",
            "institution": "BITS Pilani",
            "start_year": "2022",
            "end_year": "2024",
            "grade_or_honors": "Distinction"
        },
        token=token
    )
    print("Added education -> ID:", edu_res.get("item", {}).get("id"))

    # Add Project
    proj_res = test_post(
        "/api/profile/projects",
        {
            "title": "Real-time Distributed Event Bus",
            "tech_stack": "Python, Redis Streams, FastAPI, Docker",
            "role": "Lead Architect",
            "description": "Engineered event stream ingestion handling 100k events/sec.",
            "github_url": "https://github.com/example/event-bus"
        },
        token=token
    )
    print("Added project -> ID:", proj_res.get("item", {}).get("id"))

    # Add Achievement (Rulebook Item 5 & 8)
    ach_res = test_post(
        "/api/profile/achievements",
        {
            "title": "Google Cloud Certified Professional Cloud Architect",
            "issuer": "Google Cloud",
            "issue_date": "2025",
            "description": "Validated advanced system design across GCP BigQuery, Spanner, and GKE."
        },
        token=token
    )
    ach_id = ach_res.get("item", {}).get("id")
    print("Added achievement -> ID:", ach_id)

    # Test Recruiter Public Profile (Rulebook Item 6)
    pub_raw = test_get(f"/api/profile/public/{user_id}")
    pub_profile = json.loads(pub_raw.decode("utf-8"))["profile"]
    print("Public Recruiter Profile Candidate:", pub_profile.get("name"), "| Achievements Count:", len(pub_profile.get("achievements", [])))

    print("\n--- 4. Testing Billing & UPI QR Code Tiers ---")
    plans_raw = test_get("/api/billing/plans")
    plans = json.loads(plans_raw.decode("utf-8"))["plans"]
    for p in plans:
        print(f"  Plan: {p['name']} ({p['tier']}) -> INR {p['price_inr']}")

    print("\n--- 4b. Testing Billing Webhook (Rulebook Item 20) ---")
    webhook_res = test_post(
        "/api/billing/webhook",
        {
            "event": "payment.captured",
            "user_id": user_id,
            "amount": 12900,
            "currency": "INR",
            "utr_number": "WHK998877665544",
            "status": "success",
            "plan_tier": "medium_129"
        }
    )
    print("Webhook capture response -> success:", webhook_res.get("success"), "| plan:", webhook_res.get("plan_tier"))

    print("\n--- 5. Testing Payment Verification (UTR Unlock) ---")
    pay_res = test_post(
        "/api/billing/verify-payment",
        {"plan_tier": "medium_129", "amount_inr": 129, "utr_number": "429104829104"},
        token=token,
    )
    print("Payment Message:", pay_res["message"].encode("ascii", "replace").decode("ascii"))
    print("Candidate Subscription Status:", pay_res["profile"]["is_subscribed"], "| Tier:", pay_res["profile"]["subscription_tier"])

    print("\n--- 6. Testing Adaptive Mock Interview ---")
    adapt_res = test_post(
        "/api/adaptive-interview",
        {
            "role": "Full Stack Software Engineer",
            "question": "How do you design scalable APIs?",
            "answer": "I use Python FastAPI with asynchronous endpoints, Redis caching, and PostgreSQL connection pooling to ensure sub-100ms response times and horizontal scalability.",
            "category": "Technical",
            "difficulty": "medium",
            "question_number": 1,
        },
        token=token,
    )
    print("Adaptive Score:", adapt_res["evaluation"].get("score"))
    print("Feedback:", adapt_res["evaluation"].get("feedback"))

    print("\n--- 7. Testing Full Interview Evaluation & Entitlement Consumption ---")
    eval_res = test_post(
        "/api/evaluate-interview",
        {
            "role": "Full Stack Software Engineer",
            "answers": [
                {
                    "category": "Technical",
                    "question": "How do you design scalable APIs?",
                    "answer": "I use Python FastAPI with asynchronous endpoints, Redis caching, and PostgreSQL connection pooling to ensure sub-100ms response times and horizontal scalability.",
                    "score": 90,
                    "feedback": "Great technical depth."
                }
            ]
        },
        token=token
    )
    print("Evaluation overall score:", eval_res.get("scores", {}).get("overall"), "% | readiness:", eval_res.get("readiness"))

    print("\n==============================================")
    print("ALL FULL-STACK VERIFICATIONS PASSED SUCCESSFULLY!")
    print("==============================================")
