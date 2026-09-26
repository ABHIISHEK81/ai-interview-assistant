"""
InterviewAI Main Application Entrypoint.
Modular, high-performance FastAPI service with clean separation of concerns.
"""
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.database import init_db
from backend.routers.auth import router as auth_router
from backend.routers.billing import router as billing_router
from backend.routers.interview import router as interview_router
from backend.routers.profile import router as profile_router

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"

# Load environment variables from both root and backend
load_dotenv()
load_dotenv(BASE_DIR / ".env")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite schema and run safe column migrations
    init_db()
    print("[InterviewAI] Database initialized and verified.")
    yield


app = FastAPI(
    title="InterviewAI - Next-Gen AI Interview Intelligence API",
    version="2.0.0",
    description="Full-stack AI Mock Interview, ATS Resume Diagnostics, and Candidate Profile Management Platform",
    lifespan=lifespan,
)

# CORS configuration
allowed_origins = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
]
frontend_url_env = (os.getenv("FRONTEND_URL") or os.getenv("ALLOWED_ORIGINS") or "").strip()
if frontend_url_env:
    for origin in frontend_url_env.split(","):
        cleaned = origin.strip().rstrip("/")
        if cleaned and cleaned not in allowed_origins:
            allowed_origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1)(:\d+)?|https?://([a-zA-Z0-9-]+\.)*netlify\.app|null)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular API routers
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(interview_router)
app.include_router(billing_router)


@app.get("/api/status")
@app.get("/api")
def api_status():
    return {
        "success": True,
        "service": "InterviewAI API",
        "version": app.version,
        "status": "online",
        "database": "SQLite (WAL Mode Enabled)",
    }


@app.get("/health")
def health_check():
    gemini_key = (os.getenv("GEMINI_API_KEY") or "").strip()
    return {
        "status": "healthy",
        "gemini_configured": bool(gemini_key),
        "model": os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
    }


# Serve root index.html
@app.get("/", include_in_schema=False)
async def serve_root():
    index_path = FRONTEND_DIR / "index.html"
    if index_path.is_file():
        return FileResponse(str(index_path))
    raise HTTPException(status_code=404, detail="Frontend index.html was not found.")


# Mount frontend static directory for CSS, JS, and media assets
if FRONTEND_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")