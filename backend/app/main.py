import os
import sys
from importlib.metadata import version
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings, reload_settings_key
from app.models import (
    SearchRequest,
    SearchResponse,
    SavedJobRequest,
    SavedJobResponse,
    KeyUpdateRequest,
    SystemStatusResponse,
)
from app.database import (
    init_db,
    save_job,
    get_saved_jobs,
    delete_saved_job,
    get_search_history,
)
from app.services.tinyfish_client import tinyfish_service
from app.services.orchestrator import search_orchestrator
from tinyfish._utils.exceptions import AuthenticationError

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite tables on startup
    init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan
)

# CORS middleware for local frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "description": "JobScout AI — AI-Powered Job and Internship Finder Using TinyFish",
        "docs_url": "/docs"
    }

@app.get("/api/status", response_model=SystemStatusResponse)
def get_system_status():
    key = settings.TINYFISH_API_KEY
    is_configured = bool(key and len(key.strip()) > 5)
    masked_key = f"{key[:4]}...{key[-4:]}" if is_configured and len(key) > 8 else ("Configured" if is_configured else "Not Set")

    tf_version = "unknown"
    try:
        tf_version = version("tinyfish")
    except Exception:
        pass

    return SystemStatusResponse(
        status="ready" if is_configured else "needs_key",
        api_key_configured=is_configured,
        api_key_masked=masked_key,
        tinyfish_sdk_version=tf_version,
        database_connected=True,
        message="TinyFish integration is ready for live web discovery." if is_configured else "Please set TINYFISH_API_KEY to search live web openings."
    )

@app.post("/api/settings/key")
def update_api_key(req: KeyUpdateRequest):
    key = req.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="API key cannot be empty.")
    
    reload_settings_key(key)
    # Check credentials
    verification = tinyfish_service.verify_key()
    return {
        "success": True,
        "message": "TINYFISH_API_KEY updated successfully.",
        "verified": verification.get("valid", False),
        "detail": verification.get("error")
    }

@app.post("/api/search", response_model=SearchResponse)
def execute_job_search(req: SearchRequest):
    if not settings.TINYFISH_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="TINYFISH_API_KEY is not configured. Please supply a valid key in the top settings modal or set the TINYFISH_API_KEY environment variable."
        )

    try:
        response = search_orchestrator.execute_workflow(req)
        return response
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"TinyFish Authentication Failed: {str(e)}. Please check your TINYFISH_API_KEY."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search pipeline error: {str(e)}"
        )

@app.get("/api/jobs/saved")
def list_saved_jobs():
    try:
        return get_saved_jobs()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/jobs/save")
def add_saved_job(req: SavedJobRequest):
    try:
        job_id = save_job(req.job)
        return {"success": True, "saved_id": job_id, "message": f"Job saved: {req.job.title} at {req.job.company}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/jobs/saved/{job_id}")
def remove_saved_job(job_id: int):
    try:
        deleted = delete_saved_job(job_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Saved job not found.")
        return {"success": True, "message": "Job removed from saved list."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
def fetch_history():
    try:
        return get_search_history()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/demo/scenarios")
def get_demo_scenarios():
    """Provides the 3 test presets required by Section 10."""
    return [
        {
            "id": "scenario-1",
            "name": "Python Internships in Bengaluru",
            "role": "Python Developer Intern",
            "location": "Bengaluru",
            "experience_level": "Internship",
            "keywords": ["Python", "FastAPI", "Git", "SQL"],
            "description": "Searches for real Python and backend development internships across Bengaluru tech hubs."
        },
        {
            "id": "scenario-2",
            "name": "Frontend Developer Fresher Jobs in Noida",
            "role": "Frontend Developer",
            "location": "Noida",
            "experience_level": "Fresher",
            "keywords": ["React", "JavaScript", "Tailwind CSS", "HTML"],
            "description": "Discovers entry-level and fresher frontend engineering roles around Noida / NCR."
        },
        {
            "id": "scenario-3",
            "name": "Remote AI/ML Internships in India",
            "role": "Machine Learning Intern",
            "location": "Remote",
            "experience_level": "Internship",
            "keywords": ["AI", "Machine Learning", "PyTorch", "Python"],
            "description": "Finds remote artificial intelligence and machine learning research & engineering internships."
        }
    ]
