from typing import Optional

from result_response import Result, create_not_found_error, create_validation_error
from sqlalchemy import select
from sqlalchemy.orm import Session
import pendulum

from models import SingingRecordModel, SongModel, UserModel
from schemas.basic_schema import SingingFeedbackBasicSchema

class SingingRecordsService:
    """Singing record management service with pitch analysis results."""
    @staticmethod
    async def create_singing_record(
        db: Session,
        user_id: int,
        song_id: int,
        audio_url: str,
        score: int,
        stars_earned: int,
        feedback_data: dict
    ) -> Result[SingingRecordModel]:
        """
        Creates new singing record with analysis results.
        Stores all pitch analysis fields (score, stars_earned, feedback_data) from FilesService.analyze_pitch_accuracy.
        """
        try:
            user = db.execute(
                select(UserModel).where(UserModel.user_id == user_id)
            ).scalars().first()
            if not user:
                return Result.from_error(create_not_found_error("User", user_id))
            song = db.execute(
                select(SongModel).where(SongModel.song_id == song_id)
            ).scalars().first()
            if not song:
                return Result.from_error(create_not_found_error("Song", song_id))
            if not (0 <= score <= 100):
                return Result.from_error(create_validation_error("Score must be between 0 and 100", "score"))
            if not (0 <= stars_earned <= 3):
                return Result.from_error(create_validation_error("Stars earned must be between 0 and 3", "stars_earned"))
            try:
                feedback_schema = SingingFeedbackBasicSchema(**feedback_data)
            except Exception as e:
                return Result.from_error(create_validation_error(f"Invalid feedback_data format: {str(e)}", "feedback_data"))
            singing_record = SingingRecordModel(
                user_id=user_id,
                song_id=song_id,
                audio_url=audio_url,
                score=score,
                stars_earned=stars_earned,
                feedback_data=feedback_schema,
                created_at=pendulum.now()
            )
            db.add(singing_record)
            db.commit()
            db.refresh(singing_record)
            return Result.success(singing_record)
        except Exception as e:
            db.rollback()
            return Result.from_error(create_validation_error(str(e)))
    @staticmethod
    async def get_singing_record(db: Session, record_id: int) -> Result[Optional[SingingRecordModel]]:
        """
        Gets singing record by ID with score and feedback_data.
        """
        try:
            singing_record = db.execute(
                select(SingingRecordModel).where(SingingRecordModel.record_id == record_id)
            ).scalars().first()
            if not singing_record:
                return Result.from_error(create_not_found_error("Singing record", record_id))
            return Result.success(singing_record)
        except Exception as e:
            return Result.from_error(create_validation_error(str(e)))