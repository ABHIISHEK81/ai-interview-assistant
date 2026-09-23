"""Authentication service providing JWT tokens, Google & LinkedIn OAuth 2.0, and CSRF protection."""
import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any, Dict, Optional
from urllib.parse import urlencode

import httpx

JWT_SECRET = os.getenv("JWT_SECRET") or os.getenv("APP_SECRET_KEY") or "interviewai_production_jwt_secret_key_8492048291"
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRY_SECONDS = 7 * 24 * 3600  # 7 days

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "").strip()
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://127.0.0.1:8000/auth/google/callback").strip()

LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID", "").strip()
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET", "").strip()
LINKEDIN_REDIRECT_URI = os.getenv("LINKEDIN_REDIRECT_URI", "http://127.0.0.1:8000/auth/linkedin/callback").strip()


# =========================================================
# 1. PURE PYTHON RFC 7519 COMPLIANT HS256 JWT
# =========================================================

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _base64url_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data)


def create_access_token(data: Dict[str, Any], expires_delta_seconds: int = TOKEN_EXPIRY_SECONDS) -> str:
    """Create a signed HS256 JWT access token."""
    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
    payload = data.copy()
    now = int(time.time())
    payload["iat"] = now
    payload["exp"] = now + expires_delta_seconds

    header_bytes = json.dumps(header, separators=(",", ":")).encode("utf-8")
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")

    encoded_header = _base64url_encode(header_bytes)
    encoded_payload = _base64url_encode(payload_bytes)

    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    signature = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    encoded_signature = _base64url_encode(signature)

    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"


def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify HS256 signature and expiration; return payload dict if valid."""
    try:
        parts = token.strip().split(".")
        if len(parts) != 3:
            return None

        encoded_header, encoded_payload, encoded_signature = parts
        signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
        expected_sig = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()

        # Constant-time comparison to prevent timing attacks
        actual_sig = _base64url_decode(encoded_signature)
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload_bytes = _base64url_decode(encoded_payload)
        payload = json.loads(payload_bytes.decode("utf-8"))

        # Check expiration
        exp = payload.get("exp")
        if exp and int(time.time()) > exp:
            return None

        return payload
    except Exception:
        return None


# =========================================================
# 2. CSRF STATE GENERATION & VALIDATION
# =========================================================

def generate_oauth_state() -> str:
    """Generate a secure cryptographic state token."""
    raw = secrets.token_urlsafe(24)
    sig = hmac.new(JWT_SECRET.encode("utf-8"), raw.encode("utf-8"), hashlib.sha256).hexdigest()[:16]
    return f"{raw}_{sig}"


def verify_oauth_state(state: str) -> bool:
    """Validate OAuth state parameter to prevent CSRF."""
    try:
        if not state or "_" not in state:
            return False
        raw, sig = state.split("_", 1)
        expected_sig = hmac.new(JWT_SECRET.encode("utf-8"), raw.encode("utf-8"), hashlib.sha256).hexdigest()[:16]
        return hmac.compare_digest(sig, expected_sig)
    except Exception:
        return False


# =========================================================
# 3. GOOGLE OAUTH 2.0 FLOW
# =========================================================

def get_google_auth_url(state: str) -> str:
    """Generate Google OAuth 2.0 authorization URL."""
    params = {
        "client_id": GOOGLE_CLIENT_ID or "placeholder_google_client_id",
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "select_account",
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"


async def exchange_google_code(code: str) -> Dict[str, Any]:
    """Exchange authorization code for tokens and fetch user profile."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            raise ValueError(f"Google token exchange failed: {token_resp.text}")

        token_data = token_resp.json()
        access_token = token_data.get("access_token")

        userinfo_resp = await client.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_resp.status_code != 200:
            raise ValueError(f"Failed to fetch Google user profile: {userinfo_resp.text}")

        user_data = userinfo_resp.json()
        return {
            "provider": "google",
            "provider_id": user_data.get("sub", ""),
            "email": user_data.get("email", ""),
            "name": user_data.get("name", ""),
            "first_name": user_data.get("given_name", ""),
            "last_name": user_data.get("family_name", ""),
            "avatar_url": user_data.get("picture", ""),
        }


# =========================================================
# 4. LINKEDIN OAUTH 2.0 FLOW
# =========================================================

def get_linkedin_auth_url(state: str) -> str:
    """Generate LinkedIn OAuth 2.0 authorization URL."""
    params = {
        "response_type": "code",
        "client_id": LINKEDIN_CLIENT_ID or "placeholder_linkedin_client_id",
        "redirect_uri": LINKEDIN_REDIRECT_URI,
        "state": state,
        "scope": "openid profile email",
    }
    return f"https://www.linkedin.com/oauth/v2/authorization?{urlencode(params)}"


async def exchange_linkedin_code(code: str) -> Dict[str, Any]:
    """Exchange LinkedIn authorization code for tokens and fetch user profile."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        token_resp = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": LINKEDIN_CLIENT_ID,
                "client_secret": LINKEDIN_CLIENT_SECRET,
                "redirect_uri": LINKEDIN_REDIRECT_URI,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if token_resp.status_code != 200:
            raise ValueError(f"LinkedIn token exchange failed: {token_resp.text}")

        token_data = token_resp.json()
        access_token = token_data.get("access_token")

        userinfo_resp = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_resp.status_code != 200:
            raise ValueError(f"Failed to fetch LinkedIn user info: {userinfo_resp.text}")

        user_data = userinfo_resp.json()
        return {
            "provider": "linkedin",
            "provider_id": user_data.get("sub", ""),
            "email": user_data.get("email", ""),
            "name": user_data.get("name", ""),
            "first_name": user_data.get("given_name", ""),
            "last_name": user_data.get("family_name", ""),
            "avatar_url": user_data.get("picture", ""),
        }


# =========================================================
# 5. DEMO MOCK PAYLOAD GENERATOR (INSTANT ZERO-CONFIG TESTING)
# =========================================================

def get_demo_user_payload(provider: str = "google") -> Dict[str, Any]:
    """
    Produce a realistic verified user payload for 1-click test sessions
    when OAuth client credentials have not yet been configured in .env.
    """
    if provider.lower() == "linkedin":
        return {
            "provider": "linkedin",
            "provider_id": "linkedin_demo_id_4829103948",
            "email": "sarah.chen.tech@example.com",
            "name": "Dr. Sarah Chen",
            "first_name": "Sarah",
            "last_name": "Chen",
            "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
            "primary_field": "Quantum Physics & Machine Learning",
            "target_role": "Senior AI/ML Research Scientist",
            "experience_level": "Senior (5-8 yrs)",
            "skills": '["Python", "PyTorch", "Quantum Computing", "TensorFlow", "C++", "Algorithms", "System Design", "Docker", "Machine Learning"]',
            "linkedin_url": "https://www.linkedin.com/in/sarah-chen-phd",
            "github_url": "https://github.com/sarahchen-quantum",
            "portfolio_url": "https://sarahchen.dev",
            "other_activities": "Choir Director (University Chamber Choir), Classical Cello performer, Hackathon Mentor",
        }
    return {
        "provider": "google",
        "provider_id": "google_demo_id_109283749102",
        "email": "alex.morgan.physics@gmail.com",
        "name": "Alex Morgan",
        "first_name": "Alex",
        "last_name": "Morgan",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        "primary_field": "Applied Physics & Software Engineering",
        "target_role": "Senior Full Stack & AI Systems Engineer",
        "experience_level": "Mid-Level (3-5 yrs)",
        "skills": '["Python", "React", "TypeScript", "FastAPI", "Docker", "PostgreSQL", "Machine Learning", "System Design", "Tailwind CSS"]',
        "linkedin_url": "https://www.linkedin.com/in/alex-morgan-physics",
        "github_url": "https://github.com/alexmorgan-physics",
        "portfolio_url": "https://alexmorgan-research.io",
        "other_activities": "Traditional Folk Song Ensemble lead vocalist, National Physics Olympiad Bronze Medalist, Robotics Club President",
    }
