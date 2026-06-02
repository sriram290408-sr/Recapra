"""
candidate_ats_service.py — Candidate-side ATS Analysis Service

Scoring weights (total = 100):
  Skills Match       = 35
  Experience Match   = 15
  Project Relevance  = 15
  Resume Keywords    = 15
  Portfolio          = 10
  Education          = 10

Python scoring is the source of truth.
Hugging Face is optional and only used for report text generation.
"""

import json
import logging
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from config import HF_API_TOKEN, HF_MODEL_ID, HF_TIMEOUT_SECONDS, HF_API_URL, HF_FALLBACK_MODELS
from models.candidate import (
    CandidateProfile,
    CandidateDocument,
    CandidateEducation,
    CandidateExperience,
    CandidateProject,
    CandidateSkill,
)
from models.candidate_ats import CandidateATSResult, RoleJDTemplate
from models.job import Job

logger = logging.getLogger(__name__)

# ── Weights ──────────────────────────────────────────────────────────────────
WEIGHT_SKILLS = 35
WEIGHT_EXPERIENCE = 15
WEIGHT_PROJECTS = 15
WEIGHT_KEYWORDS = 15
WEIGHT_PORTFOLIO = 10
WEIGHT_EDUCATION = 10

# ── Keyword extraction (mirror of ats_service helpers) ───────────────────────
STOPWORDS = {
    "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but",
    "by", "can", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for",
    "from", "had", "has", "have", "having", "he", "her", "here", "him", "his", "how", "i", "if",
    "in", "into", "is", "it", "its", "itself", "me", "more", "most", "my", "no", "nor", "not",
    "of", "off", "on", "once", "only", "or", "other", "our", "out", "over", "own", "same", "she",
    "should", "so", "some", "such", "than", "that", "the", "their", "them", "then", "there",
    "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "was",
    "we", "were", "what", "when", "where", "which", "while", "who", "with", "would", "you",
    "your", "years", "experience", "using", "work", "team", "development", "developer",
    "working", "building", "project", "skills", "knowledge", "required", "preferred",
}

COMMON_SHORT_TECHS = {
    "aws", "sql", "git", "go", "c", "c++", "c#", "js", "ts", "css", "api", "php",
    "xml", "npm", "ios", "nlp", "gcp", "ssh", "ssl", "ui", "ux", "r",
}


def _extract_keywords(text: str) -> List[str]:
    if not text:
        return []
    text = text.lower()
    raw = re.findall(r"[a-z0-9+#.\-]+", text)
    result = []
    for token in raw:
        t = token.strip(".,- ")
        if token == ".net":
            t = ".net"
        if not t or t.isdigit() or t in STOPWORDS:
            continue
        if t in COMMON_SHORT_TECHS or len(t) >= 3:
            result.append(t)
    return list(set(result))


def _parse_skills_list(field: Any) -> List[str]:
    if not field:
        return []
    if isinstance(field, list):
        return list(set(s.strip().lower() for s in field if s and s.strip()))
    if isinstance(field, str):
        try:
            parsed = json.loads(field)
            if isinstance(parsed, list):
                return list(set(s.strip().lower() for s in parsed if s and s.strip()))
        except Exception:
            pass
        return list(set(s.strip().lower() for s in field.split(",") if s.strip()))
    return []


def _safe_json_dumps(value: Any) -> str:
    if isinstance(value, (list, dict)):
        return json.dumps(value)
    if isinstance(value, str):
        return value
    return json.dumps(value) if value else "[]"


# ── Match level from score ────────────────────────────────────────────────────
def _match_level(score: float) -> str:
    if score >= 90:
        return "Excellent"
    if score >= 75:
        return "Strong"
    if score >= 60:
        return "Good"
    if score >= 40:
        return "Needs Review"
    return "Weak"


def _confidence_level(score: float) -> str:
    if score >= 75:
        return "High"
    if score >= 50:
        return "Medium"
    return "Low"


# ── Core Python Scoring ───────────────────────────────────────────────────────
def _score_candidate(
    candidate_skills: List[str],
    candidate_experience_years: float,
    candidate_projects: List[Dict],
    candidate_has_portfolio: bool,
    candidate_education: List[Dict],
    candidate_resume_text: str,
    jd_required_skills: List[str],
    jd_preferred_skills: List[str],
    jd_description: str,
    jd_experience_req: str,
    jd_education_req: str,
) -> Dict:
    """Pure Python scoring — no external calls. Returns raw scores and match lists."""

    jd_all_skills = list(set(jd_required_skills + jd_preferred_skills))

    # ── 1. Skills Match (35 pts) ──────────────────────────────────────────────
    matched_skills = []
    missing_skills = []
    for skill in jd_all_skills:
        skill_lower = skill.strip().lower()
        if any(skill_lower in cs.lower() or cs.lower() in skill_lower for cs in candidate_skills):
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)

    required_matched = sum(
        1 for rs in jd_required_skills
        if any(rs.strip().lower() in cs.lower() or cs.lower() in rs.strip().lower()
               for cs in candidate_skills)
    )
    required_total = max(len(jd_required_skills), 1)
    preferred_matched = len(matched_skills) - required_matched
    preferred_total = max(len(jd_preferred_skills), 1)

    skills_pct = (required_matched / required_total) * 0.7 + (preferred_matched / preferred_total) * 0.3
    skills_score = round(skills_pct * WEIGHT_SKILLS, 2)

    # ── 2. Experience Match (15 pts) ──────────────────────────────────────────
    exp_score = 0.0
    if jd_experience_req:
        req_lower = jd_experience_req.lower()
        nums = re.findall(r"\d+\.?\d*", req_lower)
        required_years = float(nums[0]) if nums else 0.0
        if candidate_experience_years >= required_years:
            exp_score = float(WEIGHT_EXPERIENCE)
        elif required_years > 0:
            exp_score = round((candidate_experience_years / required_years) * WEIGHT_EXPERIENCE, 2)
    else:
        # No experience requirement stated — give full credit if candidate has any
        exp_score = float(WEIGHT_EXPERIENCE) if candidate_experience_years > 0 else round(WEIGHT_EXPERIENCE * 0.5, 2)

    # ── 3. Project Relevance (15 pts) ─────────────────────────────────────────
    proj_score = 0.0
    if candidate_projects:
        project_text = " ".join(
            f"{p.get('title', '')} {p.get('description', '')} {p.get('tech_stack', '')}"
            for p in candidate_projects
        ).lower()
        jd_kw = _extract_keywords(jd_description)
        proj_kw = _extract_keywords(project_text)
        if jd_kw:
            matched_proj = sum(1 for kw in jd_kw if kw in proj_kw)
            proj_score = round(min((matched_proj / len(jd_kw)) * WEIGHT_PROJECTS * 1.5, WEIGHT_PROJECTS), 2)
        else:
            proj_score = round(WEIGHT_PROJECTS * 0.5, 2)
    else:
        proj_score = 0.0

    # ── 4. Resume Keyword Match (15 pts) ──────────────────────────────────────
    kw_score = 0.0
    matched_keywords = []
    missing_keywords = []
    jd_keywords = _extract_keywords(jd_description + " " + " ".join(jd_required_skills))
    resume_keywords = _extract_keywords(candidate_resume_text)
    if jd_keywords:
        for kw in jd_keywords:
            if kw in resume_keywords:
                matched_keywords.append(kw)
            else:
                missing_keywords.append(kw)
        kw_score = round((len(matched_keywords) / len(jd_keywords)) * WEIGHT_KEYWORDS, 2)

    # ── 5. Portfolio Match (10 pts) ───────────────────────────────────────────
    port_score = float(WEIGHT_PORTFOLIO) if candidate_has_portfolio else 0.0

    # ── 6. Education Match (10 pts) ───────────────────────────────────────────
    edu_score = 0.0
    if candidate_education:
        if jd_education_req:
            edu_keywords = _extract_keywords(jd_education_req)
            for edu in candidate_education:
                edu_text = f"{edu.get('degree', '')} {edu.get('field_of_study', '')} {edu.get('institution', '')}".lower()
                edu_match = sum(1 for ek in edu_keywords if ek in edu_text)
                if edu_keywords and edu_match / len(edu_keywords) > 0.3:
                    edu_score = float(WEIGHT_EDUCATION)
                    break
            if edu_score == 0.0:
                edu_score = round(WEIGHT_EDUCATION * 0.5, 2)
        else:
            edu_score = round(WEIGHT_EDUCATION * 0.8, 2)
    else:
        edu_score = 0.0

    # ── Total ─────────────────────────────────────────────────────────────────
    overall = round(skills_score + exp_score + proj_score + kw_score + port_score + edu_score, 2)
    overall = min(overall, 100.0)

    return {
        "overall_score": overall,
        "skills_score": skills_score,
        "experience_score": exp_score,
        "project_score": proj_score,
        "resume_keyword_score": kw_score,
        "portfolio_score": port_score,
        "education_score": edu_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "matched_keywords": list(set(matched_keywords))[:30],
        "missing_keywords": list(set(missing_keywords))[:30],
    }


# ── Hugging Face Report Generation ───────────────────────────────────────────
def _build_hf_prompt(candidate_name: str, target_role: str, scores: Dict, context: Dict) -> str:
    return f"""You are a professional ATS career coach analyzing a candidate's resume match.

Candidate: {candidate_name}
Target Role: {target_role}
Overall ATS Score: {scores['overall_score']}/100
Skills Score: {scores['skills_score']}/35
Experience Score: {scores['experience_score']}/15
Project Score: {scores['project_score']}/15
Resume Keyword Score: {scores['resume_keyword_score']}/15
Portfolio Score: {scores['portfolio_score']}/10
Education Score: {scores['education_score']}/10

Matched Skills: {', '.join(scores['matched_skills'][:10])}
Missing Skills: {', '.join(scores['missing_skills'][:10])}

Write a professional ATS analysis report in JSON with these fields:
summary, feedback_summary, trend_analysis, what_is_good (array), what_is_missing (array), improvement_needed (array), recommendation, resume_analysis, portfolio_analysis

Return ONLY valid JSON. No extra text."""


def _try_hf_report(prompt: str, candidate_name: str, target_role: str, scores: Dict) -> Optional[Dict]:
    """Try Hugging Face for report text. Returns None if unavailable or fails."""
    if not HF_API_TOKEN:
        return None

    models_to_try = [HF_MODEL_ID] + (HF_FALLBACK_MODELS or [])

    for model in models_to_try:
        if not model:
            continue
        url = f"https://router.huggingface.co/hf-inference/models/{model}"
        payload = {
            "inputs": prompt,
            "parameters": {"max_new_tokens": 800, "temperature": 0.4, "return_full_text": False},
        }
        headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
        try:
            with httpx.Client(timeout=HF_TIMEOUT_SECONDS) as client:
                resp = client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                generated = ""
                if isinstance(data, list) and data:
                    generated = data[0].get("generated_text", "")
                elif isinstance(data, dict):
                    generated = data.get("generated_text", "")

                # Extract JSON block from generated text
                json_match = re.search(r"\{.*\}", generated, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group())
                    return parsed
        except Exception as e:
            logger.warning(f"HF model {model} failed: {e}")
            continue
    return None


def _build_inhouse_report(candidate_name: str, target_role: str, scores: Dict) -> Dict:
    """Generate structured in-house report when Hugging Face is unavailable."""
    overall = scores["overall_score"]
    level = _match_level(overall)
    matched = scores["matched_skills"][:5]
    missing = scores["missing_skills"][:5]

    return {
        "summary": (
            f"{candidate_name} scored {overall:.0f}% against the {target_role} role requirements. "
            f"This places them at a {level} match level based on Recapra's in-house ATS engine."
        ),
        "feedback_summary": (
            f"The candidate demonstrates solid alignment in "
            f"{', '.join(matched[:3]) if matched else 'core areas'}. "
            f"To strengthen their profile, focus on bridging gaps in "
            f"{', '.join(missing[:3]) if missing else 'the listed required skills'}."
        ),
        "trend_analysis": (
            f"Based on profile data, this candidate shows {'strong' if overall >= 70 else 'moderate'} "
            f"potential for the {target_role} role. Continuous skill building in missing areas "
            f"will increase match confidence over time."
        ),
        "what_is_good": [
            f"Demonstrates {skill} skills" for skill in matched[:4]
        ] or ["Meets baseline profile requirements."],
        "what_is_missing": [
            f"{skill} skill not evidenced in profile" for skill in missing[:4]
        ] or ["No critical skill gaps identified."],
        "improvement_needed": [
            f"Strengthen or certify {skill} to increase match score" for skill in missing[:4]
        ] or ["Continue updating skills and projects regularly."],
        "recommendation": (
            f"{'Recommend for shortlisting' if overall >= 70 else 'Suggest profile improvement'} "
            f"before applying to {target_role} positions."
        ),
        "resume_analysis": (
            "Resume is on file and was used for keyword matching. "
            "Ensure resume is tailored with role-specific keywords for higher ATS scores."
        ),
        "portfolio_analysis": (
            "Portfolio document is present and adds to profile completeness."
            if scores["portfolio_score"] > 0
            else "No portfolio document uploaded. Adding one can improve the match score by up to 10 points."
        ),
    }


# ── Public API Functions ──────────────────────────────────────────────────────
def get_role_templates(db: Session) -> List[Dict]:
    """Return all available role JD templates."""
    templates = db.query(RoleJDTemplate).order_by(RoleJDTemplate.role_name).all()
    return [
        {
            "id": t.id,
            "role_name": t.role_name,
            "experience_requirement": t.experience_requirement,
            "education_requirement": t.education_requirement,
        }
        for t in templates
    ]


def get_active_company_jobs(db: Session) -> List[Dict]:
    """Return active company jobs available for candidate analysis."""
    jobs = (
        db.query(Job)
        .filter(Job.status == "active")
        .order_by(Job.created_at.desc())
        .limit(100)
        .all()
    )
    return [
        {
            "id": j.id,
            "title": j.title,
            "location": j.location,
            "work_mode": j.work_mode,
            "job_type": j.job_type,
            "experience_required": j.experience_required,
        }
        for j in jobs
    ]


def run_candidate_ats(
    db: Session,
    candidate_profile_id: int,
    analysis_type: str,
    role_template_id: Optional[int] = None,
    job_id: Optional[int] = None,
) -> Dict:
    """
    Run ATS analysis for a candidate profile.
    analysis_type: "role_template" | "company_job"
    """
    # 1. Fetch candidate profile data
    profile = db.query(CandidateProfile).filter(CandidateProfile.id == candidate_profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found.")

    # 2. Fetch resume (required)
    resume_doc = db.query(CandidateDocument).filter(
        CandidateDocument.candidate_profile_id == candidate_profile_id,
        CandidateDocument.document_type == "resume",
    ).first()
    if not resume_doc:
        raise HTTPException(status_code=400, detail="Please upload a resume before running ATS analysis.")

    # 3. Fetch portfolio (optional)
    portfolio_doc = db.query(CandidateDocument).filter(
        CandidateDocument.candidate_profile_id == candidate_profile_id,
        CandidateDocument.document_type == "portfolio",
    ).first()
    has_portfolio = portfolio_doc is not None

    # 4. Fetch candidate skills
    skills = db.query(CandidateSkill).filter(
        CandidateSkill.candidate_profile_id == candidate_profile_id
    ).all()
    candidate_skills = [s.skill_name for s in skills]

    # 5. Fetch experience
    experiences = db.query(CandidateExperience).filter(
        CandidateExperience.candidate_profile_id == candidate_profile_id
    ).all()
    total_years = sum(
        float(e.years_of_experience or 0)
        for e in experiences
        if e.employment_type == "experienced"
    )
    exp_dicts = [
        {"job_title": e.job_title, "company_name": e.company_name, "years": e.years_of_experience, "description": e.description}
        for e in experiences
    ]

    # 6. Fetch education
    educations = db.query(CandidateEducation).filter(
        CandidateEducation.candidate_profile_id == candidate_profile_id
    ).all()
    edu_dicts = [
        {"degree": e.degree, "field_of_study": e.field_of_study, "institution": e.institution}
        for e in educations
    ]

    # 7. Fetch projects
    projects = db.query(CandidateProject).filter(
        CandidateProject.candidate_profile_id == candidate_profile_id
    ).all()
    proj_dicts = [
        {"title": p.title, "description": p.description, "tech_stack": p.tech_stack}
        for p in projects
    ]

    # 8. Build resume text for keyword matching (filename + skills + experience descriptions)
    resume_text = " ".join(candidate_skills)
    for e in experiences:
        resume_text += f" {e.job_title or ''} {e.description or ''}"
    for p in projects:
        resume_text += f" {p.title or ''} {p.tech_stack or ''} {p.description or ''}"
    resume_text += f" {resume_doc.original_file_name}"

    # 9. Fetch JD source
    target_role = ""
    jd_required_skills: List[str] = []
    jd_preferred_skills: List[str] = []
    jd_description = ""
    jd_experience_req = ""
    jd_education_req = ""

    if analysis_type == "role_template":
        if not role_template_id:
            raise HTTPException(status_code=400, detail="role_template_id is required for role_template analysis.")
        template = db.query(RoleJDTemplate).filter(RoleJDTemplate.id == role_template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Role JD template not found.")
        target_role = template.role_name
        jd_required_skills = _parse_skills_list(template.required_skills)
        jd_preferred_skills = _parse_skills_list(template.preferred_skills)
        jd_description = template.job_description or ""
        jd_experience_req = template.experience_requirement or ""
        jd_education_req = template.education_requirement or ""

    elif analysis_type == "company_job":
        if not job_id:
            raise HTTPException(status_code=400, detail="job_id is required for company_job analysis.")
        job = db.query(Job).filter(Job.id == job_id, Job.status == "active").first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found or no longer active.")
        target_role = job.title
        req_skills_raw = job.required_skills or ""
        jd_required_skills = _parse_skills_list(
            [s.strip() for s in req_skills_raw.split(",") if s.strip()]
        )
        jd_description = (job.description or "") + " " + (job.requirements or "")
        jd_experience_req = job.experience_required or ""
        jd_education_req = job.education_required or ""

    else:
        raise HTTPException(status_code=400, detail="analysis_type must be 'role_template' or 'company_job'.")

    # 10. Run Python scoring
    scores = _score_candidate(
        candidate_skills=candidate_skills,
        candidate_experience_years=total_years,
        candidate_projects=proj_dicts,
        candidate_has_portfolio=has_portfolio,
        candidate_education=edu_dicts,
        candidate_resume_text=resume_text,
        jd_required_skills=jd_required_skills,
        jd_preferred_skills=jd_preferred_skills,
        jd_description=jd_description,
        jd_experience_req=jd_experience_req,
        jd_education_req=jd_education_req,
    )

    level = _match_level(scores["overall_score"])
    confidence = _confidence_level(scores["overall_score"])

    # 11. Try Hugging Face for report text; fallback to in-house
    candidate_name = profile.full_name or "Candidate"
    hf_report = None
    generated_by = "in_house"

    try:
        if HF_API_TOKEN:
            prompt = _build_hf_prompt(candidate_name, target_role, scores, {})
            hf_report = _try_hf_report(prompt, candidate_name, target_role, scores)
            if hf_report:
                generated_by = "hf_ai"
    except Exception as e:
        logger.warning(f"HF report generation failed for candidate {candidate_profile_id}: {e}")

    report_text = hf_report or _build_inhouse_report(candidate_name, target_role, scores)

    # 12. Upsert candidate ATS result (one record per source per candidate)
    existing = db.query(CandidateATSResult).filter(
        CandidateATSResult.candidate_profile_id == candidate_profile_id,
        CandidateATSResult.source_type == analysis_type,
        CandidateATSResult.role_template_id == role_template_id if analysis_type == "role_template" else True,
        CandidateATSResult.job_id == job_id if analysis_type == "company_job" else True,
    ).first()

    now = datetime.utcnow()

    if existing:
        existing.overall_score = scores["overall_score"]
        existing.match_level = level
        existing.confidence_level = confidence
        existing.skills_score = scores["skills_score"]
        existing.experience_score = scores["experience_score"]
        existing.project_score = scores["project_score"]
        existing.resume_keyword_score = scores["resume_keyword_score"]
        existing.portfolio_score = scores["portfolio_score"]
        existing.education_score = scores["education_score"]
        existing.matched_skills = _safe_json_dumps(scores["matched_skills"])
        existing.missing_skills = _safe_json_dumps(scores["missing_skills"])
        existing.matched_keywords = _safe_json_dumps(scores["matched_keywords"])
        existing.missing_keywords = _safe_json_dumps(scores["missing_keywords"])
        existing.summary = report_text.get("summary", "")
        existing.feedback_summary = report_text.get("feedback_summary", "")
        existing.trend_analysis = report_text.get("trend_analysis", "")
        existing.what_is_good = _safe_json_dumps(report_text.get("what_is_good", []))
        existing.what_is_missing = _safe_json_dumps(report_text.get("what_is_missing", []))
        existing.improvement_needed = _safe_json_dumps(report_text.get("improvement_needed", []))
        existing.recommendation = report_text.get("recommendation", "")
        existing.resume_analysis = report_text.get("resume_analysis", "")
        existing.portfolio_analysis = report_text.get("portfolio_analysis", "")
        existing.resume_document_id = resume_doc.id
        existing.portfolio_document_id = portfolio_doc.id if portfolio_doc else None
        existing.generated_by = generated_by
        existing.run_count = (existing.run_count or 0) + 1
        existing.last_run_at = now
        existing.updated_at = now
        result_record = existing
    else:
        result_record = CandidateATSResult(
            candidate_profile_id=candidate_profile_id,
            source_type=analysis_type,
            role_template_id=role_template_id if analysis_type == "role_template" else None,
            job_id=job_id if analysis_type == "company_job" else None,
            target_role=target_role,
            overall_score=scores["overall_score"],
            match_level=level,
            confidence_level=confidence,
            skills_score=scores["skills_score"],
            experience_score=scores["experience_score"],
            project_score=scores["project_score"],
            resume_keyword_score=scores["resume_keyword_score"],
            portfolio_score=scores["portfolio_score"],
            education_score=scores["education_score"],
            matched_skills=_safe_json_dumps(scores["matched_skills"]),
            missing_skills=_safe_json_dumps(scores["missing_skills"]),
            matched_keywords=_safe_json_dumps(scores["matched_keywords"]),
            missing_keywords=_safe_json_dumps(scores["missing_keywords"]),
            summary=report_text.get("summary", ""),
            feedback_summary=report_text.get("feedback_summary", ""),
            trend_analysis=report_text.get("trend_analysis", ""),
            what_is_good=_safe_json_dumps(report_text.get("what_is_good", [])),
            what_is_missing=_safe_json_dumps(report_text.get("what_is_missing", [])),
            improvement_needed=_safe_json_dumps(report_text.get("improvement_needed", [])),
            recommendation=report_text.get("recommendation", ""),
            resume_analysis=report_text.get("resume_analysis", ""),
            portfolio_analysis=report_text.get("portfolio_analysis", ""),
            resume_document_id=resume_doc.id,
            portfolio_document_id=portfolio_doc.id if portfolio_doc else None,
            generated_by=generated_by,
            run_count=1,
            last_run_at=now,
        )
        db.add(result_record)

    db.commit()
    db.refresh(result_record)

    return _serialize_result(result_record)


def get_candidate_reports(db: Session, candidate_profile_id: int) -> List[Dict]:
    """Return all ATS reports for a candidate, most recent first."""
    results = (
        db.query(CandidateATSResult)
        .filter(CandidateATSResult.candidate_profile_id == candidate_profile_id)
        .order_by(CandidateATSResult.last_run_at.desc())
        .all()
    )
    return [_serialize_result(r) for r in results]


def get_candidate_report(db: Session, candidate_profile_id: int, report_id: int) -> Dict:
    """Return a single ATS report."""
    result = db.query(CandidateATSResult).filter(
        CandidateATSResult.id == report_id,
        CandidateATSResult.candidate_profile_id == candidate_profile_id,
    ).first()
    if not result:
        raise HTTPException(status_code=404, detail="Report not found.")
    return _serialize_result(result)


def _serialize_result(r: CandidateATSResult) -> Dict:
    """Convert ORM object to response dict with safe JSON parsing."""
    def _safe_parse(val):
        if not val:
            return []
        if isinstance(val, (list, dict)):
            return val
        try:
            return json.loads(val)
        except Exception:
            return [val] if isinstance(val, str) else []

    return {
        "id": r.id,
        "candidate_profile_id": r.candidate_profile_id,
        "source_type": r.source_type,
        "role_template_id": r.role_template_id,
        "job_id": r.job_id,
        "target_role": r.target_role,
        "overall_score": r.overall_score,
        "match_level": r.match_level,
        "confidence_level": r.confidence_level,
        "skills_score": r.skills_score,
        "experience_score": r.experience_score,
        "project_score": r.project_score,
        "resume_keyword_score": r.resume_keyword_score,
        "portfolio_score": r.portfolio_score,
        "education_score": r.education_score,
        "matched_skills": _safe_parse(r.matched_skills),
        "missing_skills": _safe_parse(r.missing_skills),
        "matched_keywords": _safe_parse(r.matched_keywords),
        "missing_keywords": _safe_parse(r.missing_keywords),
        "summary": r.summary,
        "feedback_summary": r.feedback_summary,
        "trend_analysis": r.trend_analysis,
        "what_is_good": _safe_parse(r.what_is_good),
        "what_is_missing": _safe_parse(r.what_is_missing),
        "improvement_needed": _safe_parse(r.improvement_needed),
        "recommendation": r.recommendation,
        "resume_analysis": r.resume_analysis,
        "portfolio_analysis": r.portfolio_analysis,
        "generated_by": r.generated_by,
        "run_count": r.run_count,
        "last_run_at": r.last_run_at.isoformat() if r.last_run_at else None,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }
