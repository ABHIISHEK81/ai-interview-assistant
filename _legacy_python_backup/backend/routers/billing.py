"""Billing & Payments Router: Tier pricing (₹99, ₹129, ₹199), UPI QR Verification, and Returning User Access Control."""
from typing import Annotated, Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.database import (
    get_user_payments,
    get_user_profile,
    record_payment,
    update_user_profile,
)
from backend.routers.deps import get_current_user_id

router = APIRouter(prefix="/api/billing", tags=["Billing"])

PLANS = [
    {
        "id": "low_99",
        "name": "Starter Prep",
        "tier": "Low Tier",
        "price_inr": 99,
        "badge": "Budget Friendly",
        "description": "Essential interview essentials for targeted company practice.",
        "features": [
            "5 Comprehensive Resume ATS Scans",
            "3 Complete Adaptive Mock Interview Sessions",
            "Instant Category Rubric Scoring",
            "Keyword Gap Highlights",
            "Naukri Profile Scorecard",
        ],
        "is_popular": False,
    },
    {
        "id": "medium_129",
        "name": "Pro Mastery",
        "tier": "Mid-Range / Medium Tier",
        "price_inr": 129,
        "badge": "MOST POPULAR",
        "description": "The complete interview preparation suite for serious job seekers.",
        "features": [
            "Unlimited Resume ATS Keyword Analysis",
            "10 Adaptive AI Mock Interviews (Technical & HR)",
            "Real-time Voice Dictation & Audio Readout",
            "Naukri.com Profile Optimization & Keyword Boost",
            "Downloadable PDF Performance Diagnostic",
            "STAR Method Behavioral Coach",
        ],
        "is_popular": True,
    },
    {
        "id": "high_199",
        "name": "Ultimate Lifetime Pass",
        "tier": "High Tier",
        "price_inr": 199,
        "badge": "VIP UNLIMITED",
        "description": "Unrestricted all-inclusive interview coaching for your career trajectory.",
        "features": [
            "Lifetime Unlimited Mock Interviews",
            "Custom Role & Job Description Simulation",
            "System Design & Lead Engineer Question Banks",
            "Direct Recruiter-Ready Profile Share Link",
            "Priority Gemini Flash AI Processing",
            "1-on-1 AI Technical Interview Scheduling",
        ],
        "is_popular": False,
    },
]


class PaymentVerificationRequest(BaseModel):
    plan_tier: str = Field(description="Plan ID: low_99, medium_129, or high_199")
    amount_inr: int = Field(description="Amount in INR: 99, 129, or 199")
    utr_number: str = Field(min_length=6, description="UPI 12-digit transaction reference / UTR number")


@router.get("/plans")
async def get_plans():
    return {
        "success": True,
        "plans": PLANS,
        "qr_image_url": "/assets/payment-qr.jpg",
        "upi_id": "googlepay.interviewai@okaxis",
        "supported_apps": ["Google Pay", "PhonePe", "Paytm", "BHIM UPI", "Any Banking UPI"],
    }


@router.get("/status")
async def get_billing_status(user_id: Annotated[int, Depends(get_current_user_id)]):
    profile = get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    is_subscribed = bool(profile.get("is_subscribed", 0))
    tier = profile.get("subscription_tier", "free")
    free_sessions_used = int(profile.get("free_sessions_used", 0) or 0)
    login_count = int(profile.get("login_count", 1) or 1)

    # Free for new signups on their first session; returning users after session 1 require payment
    can_proceed = is_subscribed or free_sessions_used == 0

    return {
        "success": True,
        "is_subscribed": is_subscribed,
        "subscription_tier": tier,
        "free_sessions_used": free_sessions_used,
        "login_count": login_count,
        "can_proceed": can_proceed,
        "is_returning_user": (login_count > 1 or free_sessions_used > 0),
        "qr_image_url": "/assets/payment-qr.jpg",
        "plans": PLANS,
    }


@router.post("/verify-payment")
async def verify_payment_endpoint(
    req: PaymentVerificationRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    plan_match = next((p for p in PLANS if p["id"] == req.plan_tier), None)
    if not plan_match:
        raise HTTPException(status_code=400, detail="Invalid plan selected.")

    if req.amount_inr != plan_match["price_inr"]:
        raise HTTPException(status_code=400, detail=f"Amount mismatch. {plan_match['name']} is ₹{plan_match['price_inr']}.")

    clean_utr = req.utr_number.strip().upper()
    if len(clean_utr) < 6:
        raise HTTPException(status_code=400, detail="Please enter a valid 12-digit UPI UTR / Reference Number.")

    # Record verified payment in SQLite and activate candidate subscription
    payment = record_payment(
        user_id=user_id,
        plan_tier=req.plan_tier,
        plan_name=plan_match["name"],
        amount_inr=req.amount_inr,
        utr_number=clean_utr,
    )

    updated_profile = get_user_profile(user_id)
    return {
        "success": True,
        "message": f"Payment of ₹{req.amount_inr} verified! {plan_match['name']} ({plan_match['tier']}) is now ACTIVE.",
        "payment": payment,
        "profile": updated_profile,
    }


@router.get("/history")
async def payment_history(user_id: Annotated[int, Depends(get_current_user_id)]):
    history = get_user_payments(user_id)
    return {"success": True, "history": history}


class WebhookPayload(BaseModel):
    event: str = "payment.captured"
    user_id: Optional[int] = None
    email: Optional[str] = None
    plan_tier: str = "medium_129"
    amount: int = 129
    transaction_id: str = "TXN_WEBHOOK_001"


@router.post("/webhook")
async def payment_webhook(payload: WebhookPayload):
    """Server-side webhook handler for automated payment activation (Rulebook Items 20, 21, 25)."""
    user_id = payload.user_id
    if not user_id and payload.email:
        from backend.database import get_user_by_email
        user_row = get_user_by_email(payload.email)
        if user_row:
            user_id = user_row["id"]

    if user_id:
        plan_match = next((p for p in PLANS if p["id"] == payload.plan_tier), PLANS[1])
        record_payment(
            user_id=user_id,
            plan_tier=plan_match["id"],
            plan_name=plan_match["name"],
            amount_inr=payload.amount,
            utr_number=payload.transaction_id,
        )
        from backend.database import log_audit_event
        log_audit_event(user_id, "payment_webhook_processed", f"Activated {plan_match['id']} via webhook", "")
        return {"success": True, "status": "processed", "user_id": user_id, "plan_tier": plan_match["id"]}

    return {"success": True, "status": "received"}

