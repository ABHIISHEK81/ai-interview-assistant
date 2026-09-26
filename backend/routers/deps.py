"""Common dependencies for FastAPI routers."""
from typing import Annotated, Optional
from fastapi import Header, HTTPException
from backend.services.auth import verify_access_token


async def get_current_user_id(authorization: Annotated[Optional[str], Header()] = None) -> int:
    """Extract user_id from Bearer JWT authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication credentials were not provided.")
    token = authorization.split(" ", 1)[1].strip()
    payload = verify_access_token(token)
    if not payload or "user_id" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token.")
    return int(payload["user_id"])


async def get_optional_user_id(authorization: Annotated[Optional[str], Header()] = None) -> Optional[int]:
    """Extract user_id if valid Bearer token provided, otherwise return None."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    payload = verify_access_token(token)
    if not payload or "user_id" not in payload:
        return None
    return int(payload["user_id"])
