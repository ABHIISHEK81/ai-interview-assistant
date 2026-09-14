"""Resume extraction service module.

Re-exports resume extraction, skills extraction, and ATS scoring functions.
"""

from backend.services.resume_extractor import (
    COMMON_TECH_SKILLS,
    COMMON_SOFT_SKILLS,
    ROLE_KEYWORD_MAP,
    extract_skills_heuristically,
    extract_education_heuristically,
    extract_experience_heuristically,
    calculate_ats_score,
    build_fallback_dashboard,
    normalize_dashboard_data,
    parse_analysis_dashboard,
)

__all__ = [
    "COMMON_TECH_SKILLS",
    "COMMON_SOFT_SKILLS",
    "ROLE_KEYWORD_MAP",
    "extract_skills_heuristically",
    "extract_education_heuristically",
    "extract_experience_heuristically",
    "calculate_ats_score",
    "build_fallback_dashboard",
    "normalize_dashboard_data",
    "parse_analysis_dashboard",
]
