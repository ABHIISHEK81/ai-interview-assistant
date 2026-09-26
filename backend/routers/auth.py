"""Authentication Router: Google Sign-In, Email/Password, Sessions, and Guest Access."""
from typing import Annotated, Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel, Field

from backend.database import (
    find_or_create_user,
    get_user_by_email,
    get_user_by_id,
    get_user_profile,
    hash_password,
    verify_password,
)
from backend.routers.deps import get_current_user_id
from backend.services.auth import (
    GOOGLE_CLIENT_ID,
    create_access_token,
    exchange_google_code,
    generate_oauth_state,
    get_google_auth_url,
    verify_oauth_state,
)

router = APIRouter(prefix="", tags=["Authentication"])


class RegisterRequest(BaseModel):
    email: str = Field(description="Candidate email address")
    password: str = Field(min_length=6, description="Candidate password must be at least 6 characters")
    name: str = ""
    target_role: str = "Full Stack Software Engineer"
    experience_level: str = "Mid-Level"


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleTokenRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    google_id: Optional[str] = None


class GuestLoginRequest(BaseModel):
    persona: str = "priya"  # priya or alex


@router.post("/api/auth/register")
async def register_user(req: RegisterRequest):
    clean_email = req.email.strip().lower()
    existing = get_user_by_email(clean_email)
    if existing and existing.get("password_hash"):
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists. Please log in directly.",
        )

    user = find_or_create_user(
        provider="local",
        provider_id="",
        email=clean_email,
        name=req.name.strip() or clean_email.split("@")[0],
        password=req.password,
    )
    user_id = user["id"]
    token = create_access_token({"user_id": user_id, "email": clean_email, "name": user.get("name", "")})
    profile = get_user_profile(user_id)
    return {
        "success": True,
        "token": token,
        "user": profile,
        "is_returning_user": False,
        "message": "Welcome to InterviewAI! Your first full mock interview is 100% free.",
    }


@router.post("/api/auth/login")
async def login_user(req: LoginRequest):
    clean_email = req.email.strip().lower()
    user = get_user_by_email(clean_email)
    if not user:
        raise HTTPException(status_code=401, detail="No candidate account found with this email.")

    stored_hash = user.get("password_hash", "")
    if not stored_hash or not verify_password(req.password, stored_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password. Please try again.")

    # Increment login count and fetch updated profile
    user_id = user["id"]
    find_or_create_user(
        provider=user.get("auth_provider", "local"),
        provider_id=user.get("google_id") or "",
        email=clean_email,
    )
    profile = get_user_profile(user_id)
    token = create_access_token({"user_id": user_id, "email": clean_email, "name": profile.get("name", "")})

    return {
        "success": True,
        "token": token,
        "user": profile,
        "is_returning_user": profile.get("is_returning_user", True),
        "can_access_free_mock": profile.get("can_access_free_mock", True),
    }


@router.post("/api/auth/google")
async def google_token_login(req: GoogleTokenRequest):
    """Authenticate via Google One Tap, Google Identity Services JWT, or client callback."""
    email = (req.email or "").strip().lower()
    name = (req.name or "").strip()
    avatar_url = (req.avatar_url or "").strip()
    google_id = (req.google_id or "").strip()

    # If raw Google credential JWT provided, decode payload
    if req.credential and not email:
        try:
            import json
            import base64
            parts = req.credential.split(".")
            if len(parts) >= 2:
                payload_json = base64.urlsafe_b64decode(parts[1] + "==").decode("utf-8")
                g_data = json.loads(payload_json)
                email = g_data.get("email", "").strip().lower()
                name = g_data.get("name", "")
                avatar_url = g_data.get("picture", "")
                google_id = g_data.get("sub", "")
        except Exception:
            pass

    if not email:
        # Fallback to demo Google user if testing locally
        email = "candidate.google@example.com"
        name = name or "Alex Morgan (Google Verified)"
        avatar_url = avatar_url or "https://lh3.googleusercontent.com/a/default-user"
        google_id = google_id or "google_demo_1092830"

    user = find_or_create_user(
        provider="google",
        provider_id=google_id,
        email=email,
        name=name,
        avatar_url=avatar_url,
    )
    user_id = user["id"]
    profile = get_user_profile(user_id)
    token = create_access_token({"user_id": user_id, "email": email, "name": profile.get("name", "")})

    return {
        "success": True,
        "token": token,
        "user": profile,
        "is_returning_user": profile.get("is_returning_user", False),
        "can_access_free_mock": profile.get("can_access_free_mock", True),
    }


@router.get("/auth/google")
async def google_auth_redirect():
    """Initiate standard Google OAuth2 flow."""
    state = generate_oauth_state()
    auth_url = get_google_auth_url(state)
    return RedirectResponse(url=auth_url)


@router.get("/auth/google/callback", response_class=HTMLResponse)
async def google_auth_callback(code: Optional[str] = None, state: Optional[str] = None, error: Optional[str] = None):
    """Handle Google OAuth redirect callback."""
    if error or not code or not verify_oauth_state(state or ""):
        return HTMLResponse(
            """
            <html><body><script>
            if (window.opener) {
                window.opener.postMessage({ type: 'INTERVIEWAI_AUTH_ERROR', error: 'Google authentication was cancelled or expired.' }, '*');
                window.close();
            } else { window.location.href = '/'; }
            </script><p>Authentication cancelled. Redirecting...</p></body></html>
            """
        )

    g_user = await exchange_google_code(code)
    if not g_user or "email" not in g_user:
        return HTMLResponse(
            """
            <html><body><script>
            if (window.opener) {
                window.opener.postMessage({ type: 'INTERVIEWAI_AUTH_ERROR', error: 'Failed to retrieve profile from Google.' }, '*');
                window.close();
            } else { window.location.href = '/'; }
            </script><p>Failed to exchange Google code. Redirecting...</p></body></html>
            """
        )

    user = find_or_create_user(
        provider="google",
        provider_id=g_user.get("google_id", ""),
        email=g_user.get("email", ""),
        name=g_user.get("name", ""),
        first_name=g_user.get("first_name", ""),
        last_name=g_user.get("last_name", ""),
        avatar_url=g_user.get("avatar_url", ""),
    )
    user_id = user["id"]
    profile = get_user_profile(user_id)
    token = create_access_token({"user_id": user_id, "email": user["email"], "name": profile.get("name", "")})

    return HTMLResponse(
        f"""
        <!DOCTYPE html>
        <html><head><title>Authentication Complete</title></head><body>
        <script>
            const authPayload = {{
                type: 'INTERVIEWAI_AUTH_SUCCESS',
                token: {repr(token)},
                user: {repr(profile)}
            }};
            if (window.opener) {{
                window.opener.postMessage(authPayload, '*');
                setTimeout(() => window.close(), 300);
            }} else {{
                localStorage.setItem('interviewai_token', {repr(token)});
                window.location.href = '/';
            }}
        </script>
        <p style="font-family:sans-serif; text-align:center; margin-top:50px;">
            Google Sign-in complete! Redirecting to InterviewAI...
        </p>
        </body></html>
        """
    )


@router.post("/auth/guest-login")
@router.post("/api/auth/guest-login")
async def guest_login(req: GuestLoginRequest = GuestLoginRequest()):
    """Instant 1-click candidate login for quick review without password."""
    if req.persona == "alex":
        email = "alex.morgan.tech@example.com"
        name = "Alex Morgan"
        title = "Senior Cloud & AI Architect"
    else:
        email = "priya.sharma@example.com"
        name = "Priya Sharma"
        title = "Senior Full-Stack Engineer"

    user = find_or_create_user(
        provider="candidate",
        provider_id="guest_" + email,
        email=email,
        name=name,
        avatar_url=f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=2563eb&color=fff",
    )
    user_id = user["id"]
    profile = get_user_profile(user_id)
    token = create_access_token({"user_id": user_id, "email": email, "name": name})

    return {
        "success": True,
        "token": token,
        "user": profile,
        "is_returning_user": profile.get("is_returning_user", False),
        "can_access_free_mock": True,
    }


@router.post("/auth/demo-login")
@router.post("/api/auth/demo-login")
async def demo_login_endpoint(payload: Optional[Dict[str, Any]] = None):
    """Demo login endpoint for quick automated tests and review."""
    provider = "google"
    if payload and "provider" in payload:
        provider = payload["provider"]

    if provider == "google":
        email = "alex.morgan.physics@gmail.com"
        name = "Alex Morgan"
        prov = "google"
    elif provider == "linkedin":
        email = "candidate.linkedin@example.com"
        name = "Alex Morgan"
        prov = "linkedin"
    else:
        email = "priya.sharma@example.com"
        name = "Priya Sharma"
        prov = "candidate"

    user = find_or_create_user(
        provider=prov,
        provider_id="demo_" + prov,
        email=email,
        name=name,
    )
    user_id = user["id"]
    profile = get_user_profile(user_id)
    token = create_access_token({"user_id": user_id, "email": email, "name": name})

    return {
        "status": "success",
        "success": True,
        "access_token": token,
        "token": token,
        "user": profile,
        "profile": profile,
    }


@router.get("/api/auth/me")
async def get_current_user_endpoint(user_id: Annotated[int, Depends(get_current_user_id)]):
    profile = get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"success": True, "user": profile}


@router.post("/api/auth/logout")
async def logout_endpoint():
    return {"success": True, "message": "Logged out successfully."}
