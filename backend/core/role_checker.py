from fastapi import Depends, HTTPException, status
from models.user import User
from core.dependencies import get_current_user

def require_role(allowed_roles: list):
    def dependency(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )
        return current_user
    return dependency
