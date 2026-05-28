from typing import List, Optional, Dict, Any

from result_response import Result, create_not_found_error, create_validation_error
from sqlalchemy import select, delete
from sqlalchemy.orm import Session
import pendulum

from models import UserModel, UserStatsModel, UserLevelProgressModel
from schemas.api.users_schema import UpdateCurrentUserRequestSchema

class UsersService:
    """User profile and statistics management service."""
    @staticmethod
    async def get_user_by_id(db: Session, user_id: int) -> Result[Optional[UserModel]]:
        """Gets user by ID with full profile information."""
        try:
            user = db.execute(
                select(UserModel).where(UserModel.user_id == user_id)
            ).scalars().first()
            return Result.success(user)
        except Exception as e:
            db.rollback()
            return Result.from_error(create_validation_error(str(e)))
    @staticmethod
    async def update_user_profile(
        db: Session,
        user_id: int,
        request_data: UpdateCurrentUserRequestSchema
    ) -> Result[UserModel]:
        """Updates user profile with validated request data (nickname and/or avatar_url)."""
        try:
            user = db.execute(
                select(UserModel).where(UserModel.user_id == user_id)
            ).scalars().first()
            if not user:
                return Result.from_error(create_not_found_error("User", user_id))
            if request_data.nickname is not None:
                user.nickname = request_data.nickname
            if request_data.avatar_url is not None:
                user.avatar_url = request_data.avatar_url
            user.updated_at = pendulum.now()
            db.commit()
            db.refresh(user)
            return Result.success(user)
        except Exception as e:
            db.rollback()
            return Result.from_error(create_validation_error(str(e)))
    @staticmethod
    async def save_questionnaire_answers(
        db: Session,
        user_id: int,
        answers: Dict[str, Any]
    ) -> Result[bool]:
        """Saves questionnaire answers and marks questionnaire_completed=True."""
        try:
            user = db.execute(
                select(UserModel).where(UserModel.user_id == user_id)
            ).scalars().first()
            if not user:
                return Result.from_error(create_not_found_error("User", user_id))
            user.questionnaire_completed = True
            user.updated_at = pendulum.now()
            db.commit()
            db.refresh(user)
            return Result.success(True)
        except Exception as e:
            db.rollback()
            return Result.from_error(create_validation_error(str(e)))
    @staticmethod
    async def save_vocal_range(
        db: Session,
        user_id: int,
        lowest_note: str,
        highest_note: str
    ) -> Result[bool]:
        """Saves vocal range test results to user profile (vocal_range_lowest, vocal_range_highest)."""
        try:
            user = db.execute(
                select(UserModel).where(UserModel.user_id == user_id)
            ).scalars().first()
            if not user:
                return Result.from_error(create_not_found_error("User", user_id))
            user.vocal_range_lowest = lowest_note
            user.vocal_range_highest = highest_note
            user.updated_at = pendulum.now()
            db.commit()
            db.refresh(user)
            return Result.success(True)
        except Exception as e:
            db.rollback()
            return Result.from_error(create_validation_error(str(e)))
    @staticmethod
    async def get_user_stats(db: Session, user_id: int) -> Result[Optional[UserStatsModel]]:
        """Gets user statistics by user_id."""
        try:
            stats = db.execute(
                select(UserStatsModel).where(UserStatsModel.user_id == user_id)
            ).scalars().first()
            return Result.success(stats)
        except Exception as e:
            db.rollback()
            return Result.from_error(create_validation_error(str(e)))
    @staticmethod
    async def get_level_progress(db: Session, user_id: int) -> Result[List[UserLevelProgressModel]]:
        """Gets all level progress records for user across all modules, ordered by module_type."""
        try:
            progress_records = db.execute(
                select(UserLevelProgressModel)
                .where(UserLevelProgressModel.user_id == user_id)
                .order_by(UserLevelProgressModel.module_type.asc())
            ).scalars().all()
            return Result.success(list(progress_records))
        except Exception as e:
            db.rollback()
            return Result.from_error(create_validation_error(str(e)))
    @staticmethod
    async def reset_user_progress(db: Session, user_id: int) -> Result[bool]:
        """Resets all user learning progress including UserStatsModel and UserLevelProgressModel records."""
        try:
            user = db.execute(
                select(UserModel).where(UserModel.user_id == user_id)
            ).scalars().first()
            if not user:
                return Result.from_error(create_not_found_error("User", user_id))
            db.execute(
                delete(UserLevelProgressModel).where(UserLevelProgressModel.user_id == user_id)
            )
            db.execute(
                delete(UserStatsModel).where(UserStatsModel.user_id == user_id)
            )
            db.commit()
            return Result.success(True)
        except Exception as e:
            db.rollback()
            return Result.from_error(create_validation_error(str(e)))