from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from schemas.notification_schema import NotificationListResponse
from models.user import User
from core.dependencies import get_db, get_current_user
from services import notification_service

router = APIRouter()

@router.get("", response_model=NotificationListResponse)
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return notification_service.get_user_notifications(db, current_user.id)

@router.put("/{id}/read", status_code=status.HTTP_200_OK)
def mark_read(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = notification_service.mark_as_read(db, current_user.id, id)
    return {"success": success}

@router.put("/read-all", status_code=status.HTTP_200_OK)
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = notification_service.mark_all_as_read(db, current_user.id)
    return {"success": success}
