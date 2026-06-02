from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from schemas.auth_schema import UserRegister, UserLogin
from models.user import User
from models.candidate import CandidateProfile
from models.company import CompanyProfile
from core.security import get_password_hash, verify_password, create_access_token
from services.notification_service import create_notification

def register_user(db: Session, data: UserRegister) -> User:
    # Check email exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered."
        )
        
    if data.role not in ["candidate", "company", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user role selected."
        )
        
    hashed_password = get_password_hash(data.password)
    user = User(
        name=data.name,
        email=data.email,
        hashed_password=hashed_password,
        role=data.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Automatically initialize candidate or company profiles
    if data.role == "candidate":
        profile = CandidateProfile(
            user_id=user.id,
            full_name=data.name,
            profile_completion_pct=10  # Name added counts for 10%
        )
        db.add(profile)
        db.commit()
        create_notification(
            db, user.id, 
            "Welcome to Recapra!", 
            "Your candidate profile has been created. Start by filling in your details to achieve 100% completion.",
            "info"
        )
    elif data.role == "company":
        profile = CompanyProfile(
            user_id=user.id,
            company_name=data.name,
            verification_status="pending",
            is_verified=False
        )
        db.add(profile)
        db.commit()
        create_notification(
            db, user.id, 
            "Company Profile Created", 
            "Please complete your profile and submit your verification details to begin posting jobs.",
            "verification"
        )
        
    return user

def login_user(db: Session, data: UserLogin) -> dict:
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated."
        )
        
    # Generate token
    token_data = {
        "sub": user.email,
        "email": user.email,
        "role": user.role,
        "user_id": user.id
    }
    access_token = create_access_token(data=token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
