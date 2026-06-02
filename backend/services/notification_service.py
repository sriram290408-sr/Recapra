from sqlalchemy.orm import Session
from models.notification import Notification

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "info",
    target_url: str = None,
    job_id: int = None,
    application_id: int = None
) -> Notification:
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        target_url=target_url,
        job_id=job_id,
        application_id=application_id
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

def get_user_notifications(db: Session, user_id: int):
    items = db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()
    unread_count = db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == False).count()
    return {"items": items, "unread_count": unread_count}

def mark_as_read(db: Session, user_id: int, notification_id: int) -> bool:
    notif = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
    if notif:
        notif.is_read = True
        db.commit()
        return True
    return False

def mark_all_as_read(db: Session, user_id: int) -> bool:
    db.query(Notification).filter(Notification.user_id == user_id).update({"is_read": True})
    db.commit()
    return True
