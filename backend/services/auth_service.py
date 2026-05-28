
from result_response import Result, create_validation_error, create_auth_error
from sqlalchemy import select, func
from sqlalchemy.orm import Session
import pendulum

from models import UserModel
from utils import security, validators

class AuthService:
    """Authentication service providing user registration, login, and token generation."""
    @staticmethod
    async def register_user(db: Session, email: str, password: str) -> Result[UserModel]:
        """Registers new user with email and password.
        Validates email format, checks password strength, hashes password.
        First registered user gets is_admin=True.
        """
        email_validation = validators.validate_email(email)
        if not email_validation["valid"]:
            return Result.from_error(
                create_validation_error(email_validation["error"], field="email")
            )
        normalized_email = email_validation["normalized"]
        existing_user = db.execute(
            select(UserModel).where(UserModel.email == normalized_email)
        ).scalars().first()
        if existing_user:
            return Result.from_error(
                create_validation_error("Email already registered", field="email")
            )
        password_validation = validators.validate_password_strength(password)
        if not password_validation["valid"]:
            return Result.from_error(
                create_validation_error(
                    "; ".join(password_validation["errors"]),
                    field="password"
                )
            )
        password_hash = security.hash_password(password)
        user_count = db.scalar(select(func.count(UserModel.user_id))) or 0
        is_first_user = user_count == 0
        new_user = UserModel(
            email=normalized_email,
            password_hash=password_hash,
            is_admin=is_first_user,
            is_active=True,
            questionnaire_completed=False,
            created_at=pendulum.now()
        )
        try:
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            return Result.success(new_user)
        except Exception as e:
            db.rollback()
            return Result.from_error(
                create_validation_error(f"Failed to create user: {str(e)}")
            )
    @staticmethod
    async def generate_access_token(user_id: int) -> Result[str]:
        """Generates JWT access token for authenticated user.
        Uses security.create_access_token with user_id.
        Note: This method requires user info to be fetched separately for username and role.
        """
        try:
            token = security.create_access_token(
                user_id=user_id,
                username=f"user_{user_id}",
                role="USER"
            )
            return Result.success(token)
        except Exception as e:
            return Result.from_error(
                create_validation_error(f"Failed to generate token: {str(e)}")
            )
    @staticmethod
    async def authenticate_user(db: Session, email: str, password: str) -> Result[UserModel]:
        """Authenticates user credentials.
        Queries user by email, verifies password, checks is_active=True.
        """
        email_validation = validators.validate_email(email)
        if not email_validation["valid"]:
            return Result.from_error(
                create_auth_error("Invalid email format")
            )
        normalized_email = email_validation["normalized"]
        user = db.execute(
            select(UserModel).where(UserModel.email == normalized_email)
        ).scalars().first()
        if not user:
            return Result.from_error(
                create_auth_error("Invalid email or password")
            )
        if not security.verify_password(password, user.password_hash):
            return Result.from_error(
                create_auth_error("Invalid email or password")
            )
        if not user.is_active:
            return Result.from_error(
                create_auth_error("Account is disabled")
            )
        return Result.success(user)