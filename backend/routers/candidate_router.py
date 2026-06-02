from fastapi import APIRouter, Depends, status, UploadFile, File, Form
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

from models.user import User
from core.dependencies import get_db
from core.role_checker import require_role
from core.file_handler import validate_and_save_file
from services import candidate_service

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