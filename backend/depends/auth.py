from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import exceptions as jwt_exceptions
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import UserModel
from utils.security import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)
async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> UserModel:
    """Validate JWT token and return the authenticated user."""
    try:
        token_data = verify_token(token)
        user_id = token_data["user_id"]
        stmt = select(UserModel).where(UserModel.user_id == user_id)
        user = db.execute(stmt).scalars().first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except jwt_exceptions.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt_exceptions.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
async def get_optional_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme_optional),
) -> Optional[UserModel]:
    """Return authenticated user if token is provided, otherwise return None."""
    if not token:
        return None
    try:
        token_data = verify_token(token)
        user_id = token_data["user_id"]
        stmt = select(UserModel).where(UserModel.user_id == user_id)
        user = db.execute(stmt).scalars().first()
        return user
    except (jwt_exceptions.ExpiredSignatureError, jwt_exceptions.PyJWTError):
        return None