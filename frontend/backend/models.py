from typing import Optional, List

from all_enums import (
ModuleTypeEnum,
DifficultyEnum,
SessionStatusEnum,
)
from model_type import PydanticType, PDateTime, PDate
from sqlalchemy import BigInteger, ForeignKey, JSON
from sqlmodel import SQLModel, Field as SQLField, Column, Relationship
import pendulum

from schemas.basic_schema import (
SingingFeedbackBasicSchema,
QuizSessionQuestionItemBasicSchema,
)

class UserModel(SQLModel, table=True):
    """User account model with authentication and profile information."""
    user_id: Optional[int] = SQLField(default=None, sa_column=Column(BigInteger, primary_key=True))
    email: str = SQLField(unique=True, index=True, max_length=255)
    password_hash: str = SQLField(max_length=255)
    nickname: Optional[str] = SQLField(default=None, max_length=50)
    avatar_url: Optional[str] = SQLField(default=None, max_length=500)
    is_admin: bool = SQLField(default=False, index=True)
    is_active: bool = SQLField(default=True, index=True)
    vocal_range_lowest: Optional[str] = SQLField(default=None, max_length=10)
    vocal_range_highest: Optional[str] = SQLField(default=None, max_length=10)
    questionnaire_completed: bool = SQLField(default=False)
    created_at: pendulum.DateTime = SQLField(
        default_factory=pendulum.now,
        sa_column=Column(PDateTime, nullable=False)
    )
    updated_at: Optional[pendulum.DateTime] = SQLField(
        default=None,
        sa_column=Column(PDateTime, nullable=True)
    )
    stats: Optional["UserStatsModel"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"uselist": False}
    )
    level_progress: List["UserLevelProgressModel"] = Relationship(back_populates="user")
    question_records: List["UserQuestionRecordModel"] = Relationship(back_populates="user")
    quiz_sessions: List["QuizSessionModel"] = Relationship(back_populates="user")
    singing_records: List["SingingRecordModel"] = Relationship(back_populates="user")
class UserStatsModel(SQLModel, table=True):
    """User learning statistics model tracking overall progress."""
    stats_id: Optional[int] = SQLField(default=None, sa_column=Column(BigInteger, primary_key=True))
    user_id: int = SQLField(
        sa_column=Column(BigInteger, ForeignKey("usermodel.user_id"), unique=True, index=True, nullable=False)
    )
    total_study_days: int = SQLField(default=0, ge=0)
    total_practice_minutes: int = SQLField(default=0, ge=0)
    streak_days: int = SQLField(default=0, ge=0)
    total_stars: int = SQLField(default=0, ge=0)
    total_correct_answers: int = SQLField(default=0, ge=0)
    last_practice_date: Optional[pendulum.Date] = SQLField(
        default=None,
        sa_column=Column(PDate, nullable=True)
    )
    updated_at: Optional[pendulum.DateTime] = SQLField(
        default=None,
        sa_column=Column(PDateTime, nullable=True)
    )
    user: Optional["UserModel"] = Relationship(back_populates="stats")
class UserLevelProgressModel(SQLModel, table=True):
    """User level progress model tracking progress per training module."""
    progress_id: Optional[int] = SQLField(default=None, sa_column=Column(BigInteger, primary_key=True))
    user_id: int = SQLField(
        sa_column=Column(BigInteger, ForeignKey("usermodel.user_id"), index=True, nullable=False)
    )
    module_type: ModuleTypeEnum = SQLField(index=True)
    current_level: int = SQLField(ge=1)
    total_stars: int = SQLField(default=0, ge=0, le=15)
    completion_percentage: int = SQLField(default=0, ge=0, le=100)
    updated_at: Optional[pendulum.DateTime] = SQLField(
        default=None,
        sa_column=Column(PDateTime, nullable=True)
    )
    user: Optional["UserModel"] = Relationship(back_populates="level_progress")
class QuestionModel(SQLModel, table=True):
    """Question model for ear training exercises."""
    question_id: Optional[int] = SQLField(default=None, sa_column=Column(BigInteger, primary_key=True))
    module_type: ModuleTypeEnum = SQLField(index=True)
    question_data: dict = SQLField(sa_column=Column(JSON, nullable=False))
    """
    Question data containing notes, patterns, or options (dynamic structure by module_type).
    Key-Value Structure:
    - Structure varies by module_type
    - For PITCH_DISCRIMINATION: {"note1": int, "note2": int, "answer": str}
    - For INTERVAL_DICTATION: {"interval": str, "notes": List[int], "answer": str}
    - For RHYTHM_TRAINING: {"pattern": List[int], "answer": str}
    - For MELODY_DICTATION: {"melody": List[int], "answer": str}
    Example:
        {"note1": 60, "note2": 64, "answer": "higher"}
    """
    difficulty: DifficultyEnum = SQLField(index=True)
    created_at: pendulum.DateTime = SQLField(
        default_factory=pendulum.now,
        sa_column=Column(PDateTime, nullable=False)
    )
    user_records: List["UserQuestionRecordModel"] = Relationship(back_populates="question")
class UserQuestionRecordModel(SQLModel, table=True):
    """User question record model tracking answer history."""
    record_id: Optional[int] = SQLField(default=None, sa_column=Column(BigInteger, primary_key=True))
    user_id: int = SQLField(
        sa_column=Column(BigInteger, ForeignKey("usermodel.user_id"), index=True, nullable=False)
    )
    question_id: int = SQLField(
        sa_column=Column(BigInteger, ForeignKey("questionmodel.question_id"), index=True, nullable=False)
    )
    is_correct: bool = SQLField(index=True)
    attempt_count: int = SQLField(ge=1)
    last_attempt_at: pendulum.DateTime = SQLField(
        sa_column=Column(PDateTime, nullable=False)
    )
    user: Optional["UserModel"] = Relationship(back_populates="question_records")
    question: Optional["QuestionModel"] = Relationship(back_populates="user_records")
class QuizSessionModel(SQLModel, table=True):
    """Quiz session model for training sessions with 20 questions."""
    session_id: Optional[int] = SQLField(default=None, sa_column=Column(BigInteger, primary_key=True))
    user_id: int = SQLField(
        sa_column=Column(BigInteger, ForeignKey("usermodel.user_id"), index=True, nullable=False)
    )
    module_type: ModuleTypeEnum = SQLField(index=True)
    questions: List[QuizSessionQuestionItemBasicSchema] = SQLField(
        sa_column=Column(PydanticType(List[QuizSessionQuestionItemBasicSchema]), nullable=False)
    )
    current_index: int = SQLField(ge=0, le=19)
    correct_count: int = SQLField(default=0, ge=0, le=20)
    hearts_remaining: int = SQLField(default=5, ge=0, le=5)
    combo_count: int = SQLField(default=0, ge=0)
    session_status: SessionStatusEnum = SQLField(default=SessionStatusEnum.IN_PROGRESS, index=True)
    score: Optional[int] = SQLField(default=None, ge=0, le=100)
    stars_earned: Optional[int] = SQLField(default=None, ge=0, le=3)
    started_at: pendulum.DateTime = SQLField(
        default_factory=pendulum.now,
        sa_column=Column(PDateTime, nullable=False)
    )
    completed_at: Optional[pendulum.DateTime] = SQLField(
        default=None,
        sa_column=Column(PDateTime, nullable=True)
    )
    user: Optional["UserModel"] = Relationship(back_populates="quiz_sessions")
class SongModel(SQLModel, table=True):
    """Song model for singing practice exercises."""
    song_id: Optional[int] = SQLField(default=None, sa_column=Column(BigInteger, primary_key=True))
    title: str = SQLField(max_length=100, index=True)
    lyrics: str = SQLField(max_length=2000)
    reference_melody: List[int] = SQLField(sa_column=Column(JSON, nullable=False))
    """
    Reference melody as MIDI note numbers.
    Array Structure:
    - Each element is an integer representing a MIDI note number (range: 21-108)
    - 60 represents middle C
    Example:
        [60, 62, 64, 65, 67]
    """
    difficulty: DifficultyEnum = SQLField(index=True)
    created_at: pendulum.DateTime = SQLField(
        default_factory=pendulum.now,
        sa_column=Column(PDateTime, nullable=False)
    )
    singing_records: List["SingingRecordModel"] = Relationship(back_populates="song")
class SingingRecordModel(SQLModel, table=True):
    """Singing record model with pitch analysis and scoring."""
    record_id: Optional[int] = SQLField(default=None, sa_column=Column(BigInteger, primary_key=True))
    user_id: int = SQLField(
        sa_column=Column(BigInteger, ForeignKey("usermodel.user_id"), index=True, nullable=False)
    )
    song_id: int = SQLField(
        sa_column=Column(BigInteger, ForeignKey("songmodel.song_id"), index=True, nullable=False)
    )
    audio_url: str = SQLField(max_length=500)
    score: int = SQLField(ge=0, le=100)
    stars_earned: int = SQLField(ge=0, le=3)
    feedback_data: SingingFeedbackBasicSchema = SQLField(
        sa_column=Column(PydanticType(SingingFeedbackBasicSchema), nullable=False)
    )
    created_at: pendulum.DateTime = SQLField(
        default_factory=pendulum.now,
        sa_column=Column(PDateTime, nullable=False)
    )
    user: Optional["UserModel"] = Relationship(back_populates="singing_records")
    song: Optional["SongModel"] = Relationship(back_populates="singing_records")