"""Root entry point for AI Interview Assistant FastAPI application."""
import os
import uvicorn
from backend.main import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    environment = os.environ.get("ENVIRONMENT", "development").lower()
    reload = environment == "development"

    print(f"[InterviewAI] Starting backend on 0.0.0.0:{port} (env={environment}, reload={reload})")
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=port,
        reload=reload,
        reload_dirs=["backend", "frontend"] if reload else None,
        reload_excludes=[".git/*", "scratch/*", "*.log"] if reload else None,
    )
