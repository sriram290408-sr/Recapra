from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from schemas.auth_schema import UserRegister, UserLogin, Token, UserResponse
from services import auth_service
from core.dependencies import get_db, get_current_user
from models.user import User

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    return auth_service.register_user(db, data)

@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    return auth_service.login_user(db, data)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
