"""Candidate Profile Router: Full Naukri.com + Google Account Profile Management."""
import base64
from pathlib import Path
from typing import Annotated, Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from backend.database import (
    add_education,
    add_project,
    add_user_achievement,
    add_user_skill,
    add_work_experience,
    book_interview_slot,
    delete_booked_slot,
    delete_education,
    delete_project,
    delete_user_achievement,
    delete_user_skill,
    delete_work_experience,
    get_user_profile,
    hash_password,
    update_user_profile,
)
from backend.routers.deps import get_current_user_id
from backend.services.document_parser import extract_resume_text
from backend.services.resume_extractor import extract_skills_heuristically

BASE_DIR = Path(__file__).resolve().parent.parent
SAMPLE_RESUME_PATH = BASE_DIR / "sample-resumes" / "sample_software_developer_resume.pdf"

router = APIRouter(prefix="/api/profile", tags=["Profile"])


class EducationItem(BaseModel):
    id: Optional[int] = None
    degree_title: str
    field_of_study: Optional[str] = ""
    institution: str
    start_year: Optional[str] = ""
    end_year: Optional[str] = ""
    grade_or_honors: Optional[str] = ""


class WorkExperienceItem(BaseModel):
    id: Optional[int] = None
    job_title: str
    company: str
    location: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    is_current: Optional[bool] = False
    description: Optional[str] = ""


class ProjectItem(BaseModel):
    id: Optional[int] = None
    title: str
    tech_stack: Optional[str] = ""
    role: Optional[str] = ""
    description: Optional[str] = ""
    project_url: Optional[str] = ""
    github_url: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""


class AchievementItem(BaseModel):
    id: Optional[int] = None
    title: str
    issuer: Optional[str] = ""
    issue_date: Optional[str] = ""
    description: Optional[str] = ""
    badge_url: Optional[str] = ""


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None
    bio_summary: Optional[str] = None
    professional_title: Optional[str] = None
    resume_headline: Optional[str] = None
    target_role: Optional[str] = None
    experience_level: Optional[str] = None
    total_experience: Optional[str] = None
    current_company: Optional[str] = None
    notice_period: Optional[str] = None
    annual_salary: Optional[str] = None
    expected_salary: Optional[str] = None
    job_type: Optional[str] = None
    preferred_location: Optional[str] = None
    job_status: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    languages: Optional[str] = None
    skills: Optional[Any] = None
    soft_skills: Optional[Any] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    privacy_level: Optional[str] = None
    primary_field: Optional[str] = None
    other_activities: Optional[str] = None
    email_notifications: Optional[Any] = None
    sms_notifications: Optional[Any] = None
    job_alerts: Optional[Any] = None
    two_factor_enabled: Optional[Any] = None
    education: Optional[List[Dict[str, Any]]] = None
    work_experience: Optional[List[Dict[str, Any]]] = None
    projects: Optional[List[Dict[str, Any]]] = None


class ResumeUploadRequest(BaseModel):
    filename: str
    file_base64: str


class BookSlotRequest(BaseModel):
    title: str = "Technical Mock Interview"
    role: str = "Software Engineer"
    slot_date: str
    slot_time: str
    interviewer_type: str = "AI Technical Interviewer"
    notes: Optional[str] = ""


class ChangePasswordRequest(BaseModel):
    current_password: Optional[str] = ""
    new_password: str = Field(min_length=6)


@router.get("")
async def get_profile(user_id: Annotated[int, Depends(get_current_user_id)]):
    profile = get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found.")
    return {"success": True, "profile": profile}


@router.put("")
async def update_profile(
    req: ProfileUpdateRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    update_data = req.model_dump(exclude_unset=True)
    updated = update_user_profile(user_id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Failed to update candidate profile.")
    return {"success": True, "message": "Profile updated successfully.", "profile": updated}


@router.post("/resume")
async def upload_resume(
    req: ResumeUploadRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    raw_b64 = req.file_base64
    if "," in raw_b64:
        raw_b64 = raw_b64.split(",", 1)[1]

    try:
        file_bytes = base64.b64decode(raw_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 resume content.")

    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Resume file exceeds 5MB limit.")

    # Parse resume text to auto-discover candidate skills
    extracted_text = extract_resume_text(req.filename, file_bytes)
    heuristics = extract_skills_heuristically(extracted_text, "Software Engineer")

    from datetime import datetime
    now_str = datetime.now().strftime("%d %b %Y, %I:%M %p")

    update_payload: Dict[str, Any] = {
        "resume_filename": req.filename,
        "resume_uploaded_at": now_str,
        "resume_file_base64": raw_b64,
    }

    if heuristics.get("found_technical"):
        update_payload["skills"] = heuristics["found_technical"]
    if heuristics.get("found_soft"):
        update_payload["soft_skills"] = heuristics["found_soft"]

    updated = update_user_profile(user_id, update_payload)
    return {
        "success": True,
        "resume_filename": req.filename,
        "resume_uploaded_at": now_str,
        "message": f"Resume '{req.filename}' processed and linked to your Naukri profile.",
        "profile": updated,
        "extracted_skills": heuristics.get("found_technical", []),
    }


@router.get("/resume/download")
async def download_resume(user_id: Annotated[int, Depends(get_current_user_id)]):
    profile = get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found.")

    raw_b64 = profile.get("resume_file_base64")
    if not raw_b64:
        if SAMPLE_RESUME_PATH.is_file():
            return FileResponse(
                str(SAMPLE_RESUME_PATH),
                media_type="application/pdf",
                filename=f"{profile.get('name', 'Candidate').replace(' ', '_')}_Resume.pdf",
            )
        return Response(content="Resume not yet uploaded.", media_type="text/plain")

    if "," in raw_b64:
        raw_b64 = raw_b64.split(",", 1)[1]

    try:
        file_bytes = base64.b64decode(raw_b64)
    except Exception:
        file_bytes = b"Unable to decode resume PDF."

    filename = profile.get("resume_filename") or f"{profile.get('name', 'Candidate').replace(' ', '_')}_Resume.pdf"
    return Response(
        content=file_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/booked-slots")
async def create_booked_slot(
    req: BookSlotRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    slot = book_interview_slot(user_id, req.model_dump())
    return {"success": True, "message": "Interview slot reserved.", "slot": slot}


@router.delete("/booked-slots/{slot_id}")
async def remove_booked_slot(
    slot_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    deleted = delete_booked_slot(user_id, slot_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Interview slot not found.")
    return {"success": True, "message": "Interview slot cancelled."}


@router.post("/change-password")
async def change_password(
    req: ChangePasswordRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    update_user_profile(user_id, {"password": req.new_password})
    return {"success": True, "message": "Password updated successfully."}


@router.post("/toggle-2fa")
async def toggle_2fa(user_id: Annotated[int, Depends(get_current_user_id)]):
    profile = get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    curr = profile.get("two_factor_enabled", 0)
    new_val = 0 if curr else 1
    update_user_profile(user_id, {"two_factor_enabled": new_val})
    return {"success": True, "two_factor_enabled": new_val}


@router.post("/skills")
async def add_skill_endpoint(
    req: Dict[str, Any],
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    skill = (req.get("skill") or req.get("name") or "").strip()
    if not skill:
        raise HTTPException(status_code=400, detail="Skill name is required.")
    skills = add_user_skill(user_id, skill)
    return {"success": True, "skills": skills, "skills_list": skills}


@router.delete("/skills/{skill_name}")
async def delete_skill_endpoint(
    skill_name: str,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    skills = delete_user_skill(user_id, skill_name)
    return {"success": True, "skills": skills, "skills_list": skills}


@router.post("/experience")
async def add_experience_endpoint(
    req: WorkExperienceItem,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    item = add_work_experience(user_id, req.model_dump())
    return {"success": True, "item": item}


@router.delete("/experience/{item_id}")
async def delete_experience_endpoint(
    item_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    ok = delete_work_experience(user_id, item_id)
    return {"success": ok}


@router.post("/education")
async def add_education_endpoint(
    req: EducationItem,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    item = add_education(user_id, req.model_dump())
    return {"success": True, "item": item}


@router.delete("/education/{item_id}")
async def delete_education_endpoint(
    item_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    ok = delete_education(user_id, item_id)
    return {"success": ok}


@router.post("/projects")
async def add_project_endpoint(
    req: ProjectItem,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    item = add_project(user_id, req.model_dump())
    return {"success": True, "item": item}


@router.delete("/projects/{item_id}")
async def delete_project_endpoint(
    item_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    ok = delete_project(user_id, item_id)
    return {"success": ok}


@router.post("/achievements")
async def add_achievement_endpoint(
    req: AchievementItem,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    item = add_user_achievement(user_id, req.model_dump())
    return {"success": True, "item": item}


@router.delete("/achievements/{item_id}")
async def delete_achievement_endpoint(
    item_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    ok = delete_user_achievement(user_id, item_id)
    return {"success": ok}


@router.get("/public/{target_user_id}")
async def get_public_profile(target_user_id: int):
    profile = get_user_profile(target_user_id)
    if not profile or profile.get("privacy_level") == "private":
        raise HTTPException(status_code=404, detail="Candidate profile not publicly available.")
    return {
        "success": True,
        "profile": {
            "name": profile.get("name"),
            "professional_title": profile.get("professional_title"),
            "resume_headline": profile.get("resume_headline"),
            "location": profile.get("location"),
            "total_experience": profile.get("total_experience"),
            "current_company": profile.get("current_company"),
            "target_role": profile.get("target_role"),
            "skills_list": profile.get("skills_list"),
            "soft_skills_list": profile.get("soft_skills_list"),
            "work_experience": profile.get("work_experience"),
            "education": profile.get("education"),
            "projects": profile.get("projects"),
            "achievements": profile.get("achievements"),
            "profile_strength": profile.get("profile_strength"),
            "interview_stats": profile.get("interview_stats"),
        },
    }

