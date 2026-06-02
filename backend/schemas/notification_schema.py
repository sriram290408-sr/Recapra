from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    target_url: Optional[str] = None
    job_id: Optional[int] = None
    application_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    unread_count: int
