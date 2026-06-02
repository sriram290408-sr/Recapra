from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from models.candidate import (
    CandidateProfile,
    CandidateEducation,
    CandidateSkill,
    CandidateExperience,
    CandidateDocument,
    CandidateProject,
)
from models.application import JobApplication
from models.company import CompanyProfile
from models.job import Job
from schemas.candidate_schema import (
    CandidateProfileUpdate,
    CandidateEducationCreate,
    CandidateSkillCreate,
    CandidateExperienceCreate,
    CandidateProjectCreate,
)
from core.file_handler import delete_file


def get_candidate_profile(db: Session, user_id: int) -> CandidateProfile:
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found."
        )
    return profile


def get_candidate_profile_preview_for_company(
    db: Session,
    candidate_id: int,
    company_user_id: int
) -> CandidateProfile:
    company_profile = db.query(CompanyProfile).filter(
        CompanyProfile.user_id == company_user_id
    ).first()

    if not company_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company profile not found."
        )

    application = (
        db.query(JobApplication)
        .join(Job, JobApplication.job_id == Job.id)
        .filter(
            JobApplication.candidate_id == candidate_id,
            Job.company_id == company_profile.id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to view this candidate profile."
        )

    profile = (
        db.query(CandidateProfile)
        .options(
            joinedload(CandidateProfile.education),
            joinedload(CandidateProfile.skills),
            joinedload(CandidateProfile.experiences),
            joinedload(CandidateProfile.documents),
            joinedload(CandidateProfile.projects),
        )
        .filter(CandidateProfile.id == candidate_id)
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found."
        )

    return profile


def recalculate_profile_completion(db: Session, profile: CandidateProfile) -> int:
    pct = 0
    if profile.full_name:
        pct += 10
    if profile.bio:
        pct += 10
    if profile.phone:
        pct += 10
    if profile.location:
        pct += 10
    if profile.career_status:
        pct += 10
    if profile.target_job_role:
        pct += 10
    
    # Check collections
    if db.query(CandidateEducation).filter(CandidateEducation.candidate_profile_id == profile.id).count() > 0:
        pct += 10
    if db.query(CandidateSkill).filter(CandidateSkill.candidate_profile_id == profile.id).count() > 0:
        pct += 10
    if db.query(CandidateExperience).filter(CandidateExperience.candidate_profile_id == profile.id).count() > 0:
        pct += 10
    
    # Check resume upload
    has_resume = db.query(CandidateDocument).filter(
        CandidateDocument.candidate_profile_id == profile.id,
        CandidateDocument.document_type == "resume"
    ).count() > 0
    if has_resume:
        pct += 10
        
    profile.profile_completion_pct = pct
    db.commit()
    db.refresh(profile)
    return pct


def update_candidate_profile(db: Session, user_id: int, data: CandidateProfileUpdate) -> CandidateProfile:
    profile = get_candidate_profile(db, user_id)
    update_data = data.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(profile, key, value)
        
    db.commit()
    db.refresh(profile)
    recalculate_profile_completion(db, profile)
    return profile


def add_education(db: Session, profile_id: int, data: CandidateEducationCreate) -> CandidateEducation:
    # Validation: percentage must be between 0 and 100
    if data.marks_percentage < 0 or data.marks_percentage > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Marks percentage must be between 0 and 100."
        )
        
    edu = CandidateEducation(
        candidate_profile_id=profile_id,
        institution=data.institution,
        degree=data.degree,
        field_of_study=data.field_of_study,
        start_date=data.start_date,
        end_date=data.end_date,
        year_of_passing=data.year_of_passing,
        marks_percentage=data.marks_percentage
    )
    db.add(edu)
    db.commit()
    db.refresh(edu)
    
    profile = db.query(CandidateProfile).filter(CandidateProfile.id == profile_id).first()
    if profile:
        recalculate_profile_completion(db, profile)
        
    return edu


def update_education(db: Session, profile_id: int, edu_id: int, data: CandidateEducationCreate) -> CandidateEducation:
    if data.marks_percentage < 0 or data.marks_percentage > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Marks percentage must be between 0 and 100."
        )
        
    edu = db.query(CandidateEducation).filter(
        CandidateEducation.id == edu_id,
        CandidateEducation.candidate_profile_id == profile_id
    ).first()
    
    if not edu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Education record not found."
        )
        
    edu.institution = data.institution
    edu.degree = data.degree
    edu.field_of_study = data.field_of_study
    edu.start_date = data.start_date
    edu.end_date = data.end_date
    edu.year_of_passing = data.year_of_passing
    edu.marks_percentage = data.marks_percentage
    
    db.commit()
    db.refresh(edu)
    return edu


def delete_education(db: Session, profile_id: int, edu_id: int):
    edu = db.query(CandidateEducation).filter(
        CandidateEducation.id == edu_id,
        CandidateEducation.candidate_profile_id == profile_id
    ).first()
    
    if not edu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Education record not found."
        )
        
    db.delete(edu)
    db.commit()
    
    profile = db.query(CandidateProfile).filter(CandidateProfile.id == profile_id).first()
    if profile:
        recalculate_profile_completion(db, profile)


def add_skill(db: Session, profile_id: int, data: CandidateSkillCreate) -> CandidateSkill:
    # Avoid duplicate skills for the same profile
    existing = db.query(CandidateSkill).filter(
        CandidateSkill.candidate_profile_id == profile_id,
        CandidateSkill.skill_name.ilike(data.skill_name)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This skill is already listed on your profile."
        )
        
    skill = CandidateSkill(
        candidate_profile_id=profile_id,
        skill_name=data.skill_name,
        skill_type=data.skill_type,
        proficiency_level=data.proficiency_level
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    
    profile = db.query(CandidateProfile).filter(CandidateProfile.id == profile_id).first()
    if profile:
        recalculate_profile_completion(db, profile)
        
    return skill


def delete_skill(db: Session, profile_id: int, skill_id: int):
    skill = db.query(CandidateSkill).filter(
        CandidateSkill.id == skill_id,
        CandidateSkill.candidate_profile_id == profile_id
    ).first()
    
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found."
        )
        
    db.delete(skill)
    db.commit()
    
    profile = db.query(CandidateProfile).filter(CandidateProfile.id == profile_id).first()
    if profile:
        recalculate_profile_completion(db, profile)


def add_experience(db: Session, profile_id: int, data: CandidateExperienceCreate) -> CandidateExperience:
    exp = CandidateExperience(
        candidate_profile_id=profile_id,
        employment_type=data.employment_type,
        company_name=data.company_name if data.employment_type == "experienced" else None,
        job_title=data.job_title if data.employment_type == "experienced" else None,
        start_date=data.start_date if data.employment_type == "experienced" else None,
        end_date=data.end_date if data.employment_type == "experienced" else None,
        years_of_experience=data.years_of_experience if data.employment_type == "experienced" else None,
        description=data.description,
        career_gap_reason=data.career_gap_reason
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    
    profile = db.query(CandidateProfile).filter(CandidateProfile.id == profile_id).first()
    if profile:
        recalculate_profile_completion(db, profile)
        
    return exp


def update_experience(db: Session, profile_id: int, exp_id: int, data: CandidateExperienceCreate) -> CandidateExperience:
    exp = db.query(CandidateExperience).filter(
        CandidateExperience.id == exp_id,
        CandidateExperience.candidate_profile_id == profile_id
    ).first()
    
    if not exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience record not found."
        )
        
    exp.employment_type = data.employment_type
    exp.company_name = data.company_name if data.employment_type == "experienced" else None
    exp.job_title = data.job_title if data.employment_type == "experienced" else None
    exp.start_date = data.start_date if data.employment_type == "experienced" else None
    exp.end_date = data.end_date if data.employment_type == "experienced" else None
    exp.years_of_experience = data.years_of_experience if data.employment_type == "experienced" else None
    exp.description = data.description
    exp.career_gap_reason = data.career_gap_reason
    
    db.commit()
    db.refresh(exp)
    return exp


def delete_experience(db: Session, profile_id: int, exp_id: int):
    exp = db.query(CandidateExperience).filter(
        CandidateExperience.id == exp_id,
        CandidateExperience.candidate_profile_id == profile_id
    ).first()
    
    if not exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience record not found."
        )
        
    db.delete(exp)
    db.commit()
    
    profile = db.query(CandidateProfile).filter(CandidateProfile.id == profile_id).first()
    if profile:
        recalculate_profile_completion(db, profile)


def add_document(db: Session, profile_id: int, doc_type: str, file_path: str, original_file_name: str, file_size: int) -> CandidateDocument:
    # First, if there's already a document of the same type, delete the old file
    old_doc = db.query(CandidateDocument).filter(
        CandidateDocument.candidate_profile_id == profile_id,
        CandidateDocument.document_type == doc_type
    ).first()
    
    if old_doc:
        delete_file(old_doc.file_path)
        db.delete(old_doc)
        db.commit()
        
    doc = CandidateDocument(
        candidate_profile_id=profile_id,
        document_type=doc_type,
        file_path=file_path,
        original_file_name=original_file_name,
        file_size=file_size
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    profile = db.query(CandidateProfile).filter(CandidateProfile.id == profile_id).first()
    if profile:
        recalculate_profile_completion(db, profile)
        
    return doc


def delete_document(db: Session, profile_id: int, doc_id: int):
    doc = db.query(CandidateDocument).filter(
        CandidateDocument.id == doc_id,
        CandidateDocument.candidate_profile_id == profile_id
    ).first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )
        
    delete_file(doc.file_path)
    db.delete(doc)
    db.commit()
    
    profile = db.query(CandidateProfile).filter(CandidateProfile.id == profile_id).first()
    if profile:
        recalculate_profile_completion(db, profile)


def add_project(db: Session, profile_id: int, data: CandidateProjectCreate) -> CandidateProject:
    proj = CandidateProject(
        candidate_profile_id=profile_id,
        title=data.title,
        description=data.description,
        tech_stack=data.tech_stack,
        project_link=data.project_link,
        github_link=data.github_link,
        live_demo_link=data.live_demo_link
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj


def update_project(db: Session, profile_id: int, proj_id: int, data: CandidateProjectCreate) -> CandidateProject:
    proj = db.query(CandidateProject).filter(
        CandidateProject.id == proj_id,
        CandidateProject.candidate_profile_id == profile_id
    ).first()
    
    if not proj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project record not found."
        )
        
    proj.title = data.title
    proj.description = data.description
    proj.tech_stack = data.tech_stack
    proj.project_link = data.project_link
    proj.github_link = data.github_link
    proj.live_demo_link = data.live_demo_link
    
    db.commit()
    db.refresh(proj)
    return proj


def delete_project(db: Session, profile_id: int, proj_id: int):
    proj = db.query(CandidateProject).filter(
        CandidateProject.id == proj_id,
        CandidateProject.candidate_profile_id == profile_id
    ).first()
    
    if not proj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project record not found."
        )
        
    db.delete(proj)
    db.commit()


def get_dashboard_data(db: Session, user_id: int) -> dict:
    profile = get_candidate_profile(db, user_id)
    
    resume_uploaded = db.query(CandidateDocument).filter(
        CandidateDocument.candidate_profile_id == profile.id,
        CandidateDocument.document_type == "resume"
    ).count() > 0
    
    portfolio_added = profile.portfolio_url is not None or db.query(CandidateDocument).filter(
        CandidateDocument.candidate_profile_id == profile.id,
        CandidateDocument.document_type == "portfolio"
    ).count() > 0
    
    projects_count = db.query(CandidateProject).filter(CandidateProject.candidate_profile_id == profile.id).count()
    applied_jobs_count = db.query(JobApplication).filter(JobApplication.candidate_id == profile.id).count()
    
    # Current status is based on latest application status
    latest_app = db.query(JobApplication).filter(
        JobApplication.candidate_id == profile.id
    ).order_by(JobApplication.updated_at.desc()).first()
    
    current_status = latest_app.status if latest_app else "no_applications"
    
    # Determine the next suggested step
    if profile.profile_completion_pct < 50:
        next_step = "Complete your basic profile details (education, skills) to increase visibility."
    elif not resume_uploaded:
        next_step = "Upload your resume in the 'Resume & Portfolio' section."
    elif projects_count == 0:
        next_step = "Add at least one key project to showcase your technical skills."
    elif applied_jobs_count == 0:
        next_step = "Browse active jobs and apply to your first role!"
    else:
        next_step = "Keep track of your pending job applications in the Applications tab."
        
    return {
        "profile_completion_pct": profile.profile_completion_pct,
        "resume_uploaded": resume_uploaded,
        "portfolio_added": portfolio_added,
        "projects_count": projects_count,
        "applied_jobs_count": applied_jobs_count,
        "current_status": current_status,
        "next_step": next_step
    }