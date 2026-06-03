from fastapi import APIRouter, Depends, status, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List

from schemas.candidate_schema import (
    CandidateProfileResponse,
    CandidateProfileUpdate,
    CandidateEducationResponse,
    CandidateEducationCreate,
    CandidateSkillResponse,
    CandidateSkillCreate,
    CandidateExperienceResponse,
    CandidateExperienceCreate,
    CandidateProjectResponse,
    CandidateProjectCreate,
    CandidateDocumentResponse,
    CandidateDashboardResponse,
)
from schemas.ai_resume_schema import (
    AIImprovementRequest,
    AIImprovementResponse,
    AIAcceptResponse,
    AIRejectResponse,
    AIRunATSResponse,
)

from models.user import User
from models.candidate_improvement import CandidateAIImprovement
from models.candidate_ats import RoleJDTemplate
from models.candidate import CandidateSkill
from core.dependencies import get_db
from core.role_checker import require_role
from core.file_handler import validate_and_save_file
from services import candidate_service, resume_ai_service, candidate_ats_service

router = APIRouter()


@router.get("/dashboard", response_model=CandidateDashboardResponse)
def get_dashboard(
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    return candidate_service.get_dashboard_data(db, current_user.id)


@router.get("/profile", response_model=CandidateProfileResponse)
def get_profile(
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    return candidate_service.get_candidate_profile(db, current_user.id)


# COMPANY ONLY PROFILE PREVIEW API
@router.get("/profile-preview/{candidate_id}", response_model=CandidateProfileResponse)
def get_candidate_profile_preview_for_company(
    candidate_id: int,
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db)
):
    """
    Company-only API.

    This allows a company to view a candidate profile preview.
    It is separate from /candidate/profile because /candidate/profile
    is only for the logged-in candidate's own profile.
    """
    return candidate_service.get_candidate_profile_preview_for_company(
        db=db,
        candidate_id=candidate_id,
        company_user_id=current_user.id
    )


@router.put("/profile", response_model=CandidateProfileResponse)
def update_profile(
    data: CandidateProfileUpdate,
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    return candidate_service.update_candidate_profile(db, current_user.id, data)


# EDUCATION
@router.post(
    "/education",
    response_model=CandidateEducationResponse,
    status_code=status.HTTP_201_CREATED
)
def add_education(
    data: CandidateEducationCreate,
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    return candidate_service.add_education(db, profile.id, data)


@router.get("/education", response_model=List[CandidateEducationResponse])
def get_education(
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    return profile.education


@router.put("/education/{id}", response_model=CandidateEducationResponse)
def update_education(
    id: int,
    data: CandidateEducationCreate,
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    return candidate_service.update_education(db, profile.id, id, data)


@router.delete("/education/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_education(
    id: int,
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    candidate_service.delete_education(db, profile.id, id)


# SKILLS
@router.post(
    "/skills",
    response_model=CandidateSkillResponse,
    status_code=status.HTTP_201_CREATED
)
def add_skill(
    data: CandidateSkillCreate,
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    return candidate_service.add_skill(db, profile.id, data)


@router.get("/skills", response_model=List[CandidateSkillResponse])
def get_skills(
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    return profile.skills


@router.delete("/skills/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(
    id: int,
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    candidate_service.delete_skill(db, profile.id, id)


# EXPERIENCE
@router.post(
    "/experience",
    response_model=CandidateExperienceResponse,
    status_code=status.HTTP_201_CREATED
)
def add_experience(
    data: CandidateExperienceCreate,
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    return candidate_service.add_experience(db, profile.id, data)


@router.get("/experience", response_model=List[CandidateExperienceResponse])
def get_experience(
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    return profile.experiences


@router.put("/experience/{id}", response_model=CandidateExperienceResponse)
def update_experience(
    id: int,
    data: CandidateExperienceCreate,
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    return candidate_service.update_experience(db, profile.id, id, data)


@router.delete("/experience/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experience(
    id: int,
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    candidate_service.delete_experience(db, profile.id, id)


# PROJECTS
@router.post(
    "/projects",
    response_model=CandidateProjectResponse,
    status_code=status.HTTP_201_CREATED
)
def add_project(
    data: CandidateProjectCreate,
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    return candidate_service.add_project(db, profile.id, data)


@router.get("/projects", response_model=List[CandidateProjectResponse])
def get_projects(
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    return profile.projects


@router.put("/projects/{id}", response_model=CandidateProjectResponse)
def update_project(
    id: int,
    data: CandidateProjectCreate,
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    return candidate_service.update_project(db, profile.id, id, data)


@router.delete("/projects/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    id: int,
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    candidate_service.delete_project(db, profile.id, id)


# DOCUMENTS
@router.post(
    "/documents",
    response_model=CandidateDocumentResponse,
    status_code=status.HTTP_201_CREATED
)
def upload_document(
    document_type: str = Form(...),  # resume, portfolio
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)

    file_info = validate_and_save_file(file, category=document_type)

    return candidate_service.add_document(
        db,
        profile.id,
        document_type,
        file_info["file_path"],
        file_info["original_file_name"],
        file_info["file_size"]
    )


@router.get("/documents", response_model=List[CandidateDocumentResponse])
def get_documents(
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    return profile.documents


@router.delete("/documents/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    id: int,
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    candidate_service.delete_document(db, profile.id, id)


# ── AI Resume Improvement Helpers & Endpoints ───────────────────────────────

import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def serialize_improvement(imp: CandidateAIImprovement):
    try:
        improved_text = json.loads(imp.improved_resume_text) if imp.improved_resume_text else {}
    except Exception:
        improved_text = imp.improved_resume_text
    try:
        suggestions = json.loads(imp.ai_suggestions) if imp.ai_suggestions else {}
    except Exception:
        suggestions = imp.ai_suggestions

    return {
        "id": imp.id,
        "candidate_profile_id": imp.candidate_profile_id,
        "original_resume_text": imp.original_resume_text,
        "improved_resume_text": improved_text,
        "target_role": imp.target_role,
        "ai_suggestions": suggestions,
        "original_ats_score": imp.original_ats_score,
        "improved_ats_score": imp.improved_ats_score,
        "score_difference": imp.score_difference,
        "status": imp.status,
        "created_at": imp.created_at,
        "updated_at": imp.updated_at
    }


@router.post("/resume/improve-ai", response_model=AIImprovementResponse)
def improve_resume_ai(
    data: AIImprovementRequest,
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db),
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    # Check if resume document exists
    resume_doc = db.query(CandidateDocument).filter(
        CandidateDocument.candidate_profile_id == profile.id,
        CandidateDocument.document_type == "resume"
    ).first()
    if not resume_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a resume first to run AI improvement."
        )

    # 1. Run AI Improvement service
    result = resume_ai_service.improve_resume_workflow(db, profile.id, data.target_role)
    original_text = result["original_resume_text"]
    structured_result = result["structured_result"]

    # 2. Get baseline ATS score (find best match template or job)
    original_ats_score = 60.0  # default baseline
    template = db.query(RoleJDTemplate).filter(RoleJDTemplate.role_name.ilike(f"%{data.target_role}%")).first()
    if not template:
        template = db.query(RoleJDTemplate).first()
    
    if template:
        try:
            ats_res = candidate_ats_service.run_candidate_ats(
                db=db,
                candidate_profile_id=profile.id,
                analysis_type="role_template",
                role_template_id=template.id
            )
            original_ats_score = ats_res["overall_score"]
        except Exception as e:
            logger.warning(f"Could not run baseline ATS: {e}")

    # 3. Save as pending record
    improvement = CandidateAIImprovement(
        candidate_profile_id=profile.id,
        original_resume_text=original_text,
        improved_resume_text=json.dumps(structured_result.get("improved_resume", {})),
        target_role=data.target_role,
        ai_suggestions=json.dumps(structured_result.get("suggestions", {})),
        original_ats_score=original_ats_score,
        improved_ats_score=0.0,
        score_difference=0.0,
        status="pending",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(improvement)
    db.commit()
    db.refresh(improvement)

    return serialize_improvement(improvement)


@router.get("/resume/improved", response_model=AIImprovementResponse)
def get_improved_resume(
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    imp = db.query(CandidateAIImprovement).filter(
        CandidateAIImprovement.candidate_profile_id == profile.id
    ).order_by(CandidateAIImprovement.created_at.desc()).first()

    if not imp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No AI improved resume records found for this candidate."
        )

    return serialize_improvement(imp)


@router.post("/resume/accept-improved", response_model=AIAcceptResponse)
def accept_improved_resume(
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    imp = db.query(CandidateAIImprovement).filter(
        CandidateAIImprovement.candidate_profile_id == profile.id,
        CandidateAIImprovement.status == "pending"
    ).order_by(CandidateAIImprovement.created_at.desc()).first()

    if not imp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending AI improved resume found to accept."
        )

    try:
        improved_resume = json.loads(imp.improved_resume_text) if imp.improved_resume_text else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse improved resume structure: {e}")

    # 1. Update Candidate Profile Details
    profile.bio = improved_resume.get("summary", profile.bio)
    profile.target_job_role = imp.target_role

    # 2. Update Skills
    skills_dict = improved_resume.get("skills", {})
    if skills_dict:
        db.query(CandidateSkill).filter(CandidateSkill.candidate_profile_id == profile.id).delete()
        for category, skill_list in skills_dict.items():
            if isinstance(skill_list, list):
                for skill_name in skill_list:
                    new_skill = CandidateSkill(
                        candidate_profile_id=profile.id,
                        skill_name=skill_name,
                        skill_type=category,
                        proficiency_level="advanced"
                    )
                    db.add(new_skill)

    # 3. Update Projects
    improved_projects = improved_resume.get("projects", [])
    for idx, proj in enumerate(profile.projects):
        if idx < len(improved_projects):
            proj_data = improved_projects[idx]
            proj.description = "\n".join(proj_data.get("description", [])) if isinstance(proj_data.get("description"), list) else proj_data.get("description")
            proj.tech_stack = proj_data.get("tech_stack", proj.tech_stack)

    # 4. Update Experience
    improved_exp = improved_resume.get("experience", [])
    for idx, exp in enumerate(profile.experiences):
        if idx < len(improved_exp):
            exp_data = improved_exp[idx]
            exp.description = "\n".join(exp_data.get("wording", [])) if isinstance(exp_data.get("wording"), list) else exp_data.get("wording")

    # Mark as accepted
    imp.status = "accepted"
    db.commit()

    return {
        "message": "AI improved resume suggestions accepted and merged to candidate profile successfully.",
        "improvement_id": imp.id,
        "status": "accepted"
    }


@router.post("/resume/reject-improved", response_model=AIRejectResponse)
def reject_improved_resume(
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    imp = db.query(CandidateAIImprovement).filter(
        CandidateAIImprovement.candidate_profile_id == profile.id,
        CandidateAIImprovement.status == "pending"
    ).order_by(CandidateAIImprovement.created_at.desc()).first()

    if not imp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending AI improved resume found to reject."
        )

    imp.status = "rejected"
    db.commit()

    return {
        "message": "AI improved resume suggestions rejected.",
        "improvement_id": imp.id,
        "status": "rejected"
    }


@router.post("/resume/run-ats-after-improvement", response_model=AIRunATSResponse)
def run_ats_after_improvement(
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    imp = db.query(CandidateAIImprovement).filter(
        CandidateAIImprovement.candidate_profile_id == profile.id,
        CandidateAIImprovement.status == "accepted"
    ).order_by(CandidateAIImprovement.created_at.desc()).first()

    if not imp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please accept the AI improved resume before running ATS recheck."
        )

    # 1. Run ATS score check on the newly accepted profile details
    improved_ats_score = 65.0  # default fallback
    ats_report = None

    template = db.query(RoleJDTemplate).filter(RoleJDTemplate.role_name.ilike(f"%{imp.target_role}%")).first()
    if not template:
        template = db.query(RoleJDTemplate).first()

    if template:
        try:
            ats_res = candidate_ats_service.run_candidate_ats(
                db=db,
                candidate_profile_id=profile.id,
                analysis_type="role_template",
                role_template_id=template.id
            )
            improved_ats_score = ats_res["overall_score"]
            ats_report = ats_res
        except Exception as e:
            logger.warning(f"Could not run ATS recheck: {e}")

    # 2. Update improvement scores
    imp.improved_ats_score = improved_ats_score
    imp.score_difference = round(improved_ats_score - imp.original_ats_score, 2)
    db.commit()

    return {
        "original_ats_score": imp.original_ats_score,
        "ats_score_after_ai_improvement": improved_ats_score,
        "score_difference": imp.score_difference,
        "ats_report": ats_report
    }