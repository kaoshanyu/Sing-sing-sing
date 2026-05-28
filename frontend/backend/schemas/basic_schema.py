from typing import List, Optional, Dict, Any

from all_enums import (
ModuleTypeEnum,
DifficultyEnum,
SessionStatusEnum,
AccuracyLevelEnum,
)
from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator
import pendulum

DateTime = pendulum.DateTime
Date = pendulum.Date
class SyllableFeedbackItemBasicSchema(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    syllable_index: int = Field(..., description="Syllable index, e.g. 0")
    expected_note: int = Field(..., description="Expected MIDI note, e.g. 60")
    detected_note: float = Field(..., description="Detected MIDI note, e.g. 60.5")
    deviation_cents: float = Field(..., description="Deviation in cents, e.g. 25.5")
    accuracy_level: AccuracyLevelEnum = Field(
        ..., description="Accuracy level, e.g. 'ACCURATE', 'SLIGHTLY_OFF', 'OFF'"
    )
class SingingFeedbackBasicSchema(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    syllables: List[SyllableFeedbackItemBasicSchema] = Field(
        default_factory=list, description="Per-syllable feedback list"
    )
    overall_pitch_accuracy: float = Field(
        ..., description="Overall pitch accuracy percentage (range: 0-100), e.g. 85.5"
    )
class QuizSessionQuestionItemBasicSchema(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    question_id: int = Field(..., description="Question ID, e.g. 10001")
    question_data: Dict[str, Any] = Field(..., description="Question data (dynamic structure by module_type)")
    difficulty: DifficultyEnum = Field(..., description="Difficulty level, e.g. 'EASY', 'MEDIUM', 'HARD'")
    is_from_wrong_book: bool = Field(
        ..., description="Is from wrong question book (true: from wrong book, false: new question)"
    )
class UserBasicSchema(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    user_id: int = Field(..., description="User ID (big integer, auto-increment, non-negative), e.g. 10001")
    email: str = Field(..., description="Email address (format: email, max 255 chars, unique), e.g. user@example.com")
    nickname: Optional[str] = Field(None, description="User nickname (max 50 chars), e.g. 音乐小白")
    avatar_url: Optional[str] = Field(
        None, description="Avatar URL (format: URL, max 500 chars), e.g. /static/uploads/avatar_10001.jpg"
    )
    is_admin: bool = Field(..., description="Is administrator (true: admin, false: regular user)")
    vocal_range_lowest: Optional[str] = Field(None, description="Lowest vocal note, e.g. G3")
    vocal_range_highest: Optional[str] = Field(None, description="Highest vocal note, e.g. D5")
    questionnaire_completed: bool = Field(
        ..., description="Has completed onboarding questionnaire (true: completed, false: not completed)"
    )
    created_at: DateTime = Field(..., description="Creation time (format: YYYY-MM-DDTHH:mm:ss), e.g. 2024-01-15T09:00:00")
    updated_at: Optional[DateTime] = Field(
        None, description="Update time (format: YYYY-MM-DDTHH:mm:ss), e.g. 2024-01-16T10:30:00"
    )
    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def parse_datetime(cls, value):
        if value is None:
            return None
        if isinstance(value, pendulum.DateTime):
            return value
        if isinstance(value, str):
            return pendulum.parse(value)
        return value
    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, dt: Optional[pendulum.DateTime]) -> Optional[str]:
        if dt is None:
            return None
        return dt.to_iso8601_string()
    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()
class UserStatsBasicSchema(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    stats_id: int = Field(..., description="Stats ID (big integer, auto-increment, non-negative), e.g. 10001")
    user_id: int = Field(..., description="User ID (references user.user_id), e.g. 10001")
    total_study_days: int = Field(..., description="Total study days (min: 0), e.g. 15")
    total_practice_minutes: int = Field(..., description="Total practice minutes (min: 0), e.g. 360")
    streak_days: int = Field(..., description="Consecutive practice days (min: 0), e.g. 7")
    total_stars: int = Field(..., description="Total stars earned (min: 0), e.g. 45")
    total_correct_answers: int = Field(..., description="Total correct answers (min: 0), e.g. 200")
    last_practice_date: Optional[Date] = Field(
        None, description="Last practice date (format: YYYY-MM-DD), e.g. 2024-01-15"
    )
    updated_at: Optional[DateTime] = Field(
        None, description="Update time (format: YYYY-MM-DDTHH:mm:ss), e.g. 2024-01-16T10:30:00"
    )
    @field_validator("last_practice_date", mode="before")
    @classmethod
    def parse_date(cls, value):
        if value is None:
            return None
        if isinstance(value, pendulum.Date) and not isinstance(value, pendulum.DateTime):
            return value
        if isinstance(value, pendulum.DateTime):
            return value.date()
        if isinstance(value, str):
            parsed = pendulum.parse(value)
            if isinstance(parsed, pendulum.DateTime):
                return parsed.date()
            return parsed
        if hasattr(value, "year") and hasattr(value, "month") and hasattr(value, "day"):
            return pendulum.date(value.year, value.month, value.day)
        return value
    @field_validator("updated_at", mode="before")
    @classmethod
    def parse_datetime(cls, value):
        if value is None:
            return None
        if isinstance(value, pendulum.DateTime):
            return value
        if isinstance(value, str):
            return pendulum.parse(value)
        return value
    @field_serializer("last_practice_date")
    def serialize_date(self, date_val: Optional[pendulum.Date]) -> Optional[str]:
        if date_val is None:
            return None
        return date_val.to_date_string()
    @field_serializer("updated_at")
    def serialize_datetime(self, dt: Optional[pendulum.DateTime]) -> Optional[str]:
        if dt is None:
            return None
        return dt.to_iso8601_string()
    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()
class UserLevelProgressBasicSchema(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    progress_id: int = Field(..., description="Progress ID (big integer, auto-increment, non-negative), e.g. 10001")
    user_id: int = Field(..., description="User ID (references user.user_id), e.g. 10001")
    module_type: ModuleTypeEnum = Field(
        ...,
        description="Module type, e.g. 'PITCH_DISCRIMINATION', 'INTERVAL_DICTATION', 'RHYTHM_TRAINING', 'MELODY_DICTATION', 'SINGING_PRACTICE'",
    )
    current_level: int = Field(..., description="Current level (min: 1), e.g. 3")
    total_stars: int = Field(..., description="Total stars in this module (min: 0, max: 15), e.g. 9")
    completion_percentage: int = Field(..., description="Completion percentage (range: 0-100), e.g. 60")
    updated_at: Optional[DateTime] = Field(
        None, description="Update time (format: YYYY-MM-DDTHH:mm:ss), e.g. 2024-01-16T10:30:00"
    )
    @field_validator("updated_at", mode="before")
    @classmethod
    def parse_datetime(cls, value):
        if value is None:
            return None
        if isinstance(value, pendulum.DateTime):
            return value
        if isinstance(value, str):
            return pendulum.parse(value)
        return value
    @field_serializer("updated_at")
    def serialize_datetime(self, dt: Optional[pendulum.DateTime]) -> Optional[str]:
        if dt is None:
            return None
        return dt.to_iso8601_string()
    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()
class QuestionBasicSchema(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    question_id: int = Field(..., description="Question ID (big integer, auto-increment, non-negative), e.g. 10001")
    module_type: ModuleTypeEnum = Field(
        ...,
        description="Module type, e.g. 'PITCH_DISCRIMINATION', 'INTERVAL_DICTATION', 'RHYTHM_TRAINING', 'MELODY_DICTATION'",
    )
    question_data: Dict[str, Any] = Field(
        ..., description="Question data containing notes, patterns, or options (dynamic structure by module_type), e.g. {'note1': 60, 'note2': 64, 'answer': 'higher'}"
    )
    difficulty: DifficultyEnum = Field(..., description="Difficulty level, e.g. 'EASY', 'MEDIUM', 'HARD'")
    created_at: DateTime = Field(
        ..., description="Creation time (format: YYYY-MM-DDTHH:mm:ss), e.g. 2024-01-15T09:00:00"
    )
    @field_validator("created_at", mode="before")
    @classmethod
    def parse_datetime(cls, value):
        if value is None:
            return None
        if isinstance(value, pendulum.DateTime):
            return value
        if isinstance(value, str):
            return pendulum.parse(value)
        return value
    @field_serializer("created_at")
    def serialize_datetime(self, dt: Optional[pendulum.DateTime]) -> Optional[str]:
        if dt is None:
            return None
        return dt.to_iso8601_string()
    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()
class UserQuestionRecordBasicSchema(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    record_id: int = Field(..., description="Record ID (big integer, auto-increment, non-negative), e.g. 10001")
    user_id: int = Field(..., description="User ID (references user.user_id), e.g. 10001")
    question_id: int = Field(..., description="Question ID (references question.question_id), e.g. 10001")
    is_correct: bool = Field(..., description="Was answer correct (true: correct, false: wrong)")
    attempt_count: int = Field(..., description="Number of attempts (min: 1), e.g. 3")
    last_attempt_at: DateTime = Field(
        ..., description="Last attempt time (format: YYYY-MM-DDTHH:mm:ss), e.g. 2024-01-15T14:30:00"
    )
    @field_validator("last_attempt_at", mode="before")
    @classmethod
    def parse_datetime(cls, value):
        if value is None:
            return None
        if isinstance(value, pendulum.DateTime):
            return value
        if isinstance(value, str):
            return pendulum.parse(value)
        return value
    @field_serializer("last_attempt_at")
    def serialize_datetime(self, dt: Optional[pendulum.DateTime]) -> Optional[str]:
        if dt is None:
            return None
        return dt.to_iso8601_string()
    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()
class QuizSessionBasicSchema(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    session_id: int = Field(..., description="Session ID (big integer, auto-increment, non-negative), e.g. 10001")
    user_id: int = Field(..., description="User ID (references user.user_id), e.g. 10001")
    module_type: ModuleTypeEnum = Field(
        ...,
        description="Module type, e.g. 'PITCH_DISCRIMINATION', 'INTERVAL_DICTATION', 'RHYTHM_TRAINING', 'MELODY_DICTATION'",
    )
    questions: List[QuizSessionQuestionItemBasicSchema] = Field(
        default_factory=list, description="List of questions in this session"
    )
    current_index: int = Field(..., description="Current question index (min: 0, max: 19), e.g. 5")
    correct_count: int = Field(..., description="Number of correct answers (min: 0, max: 20), e.g. 15")
    hearts_remaining: int = Field(..., description="Remaining hearts/lives (min: 0, max: 5), e.g. 3")
    combo_count: int = Field(..., description="Current combo streak (min: 0), e.g. 5")
    session_status: SessionStatusEnum = Field(
        ..., description="Session status, e.g. 'IN_PROGRESS', 'COMPLETED', 'FAILED'"
    )
    score: Optional[int] = Field(None, description="Final score (range: 0-100), e.g. 85, null if not completed")
    stars_earned: Optional[int] = Field(
        None, description="Stars earned (range: 0-3), e.g. 2, null if not completed"
    )
    started_at: DateTime = Field(
        ..., description="Session start time (format: YYYY-MM-DDTHH:mm:ss), e.g. 2024-01-15T14:30:00"
    )
    completed_at: Optional[DateTime] = Field(
        None, description="Session completion time (format: YYYY-MM-DDTHH:mm:ss), e.g. 2024-01-15T14:45:00"
    )
    @field_validator("started_at", "completed_at", mode="before")
    @classmethod
    def parse_datetime(cls, value):
        if value is None:
            return None
        if isinstance(value, pendulum.DateTime):
            return value
        if isinstance(value, str):
            return pendulum.parse(value)
        return value
    @field_serializer("started_at", "completed_at")
    def serialize_datetime(self, dt: Optional[pendulum.DateTime]) -> Optional[str]:
        if dt is None:
            return None
        return dt.to_iso8601_string()
    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()
class SongBasicSchema(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    song_id: int = Field(..., description="Song ID (big integer, auto-increment, non-negative), e.g. 10001")
    title: str = Field(..., description="Song title (max 100 chars), e.g. 小星星")
    lyrics: str = Field(..., description="Song lyrics (max 2000 chars), e.g. 一闪一闪亮晶晶，满天都是小星星")
    reference_melody: List[int] = Field(
        default_factory=list,
        description="Reference melody as MIDI note numbers (range: 21-108), e.g. 60 for middle C",
    )
    difficulty: DifficultyEnum = Field(..., description="Difficulty level, e.g. 'EASY', 'MEDIUM', 'HARD'")
    created_at: DateTime = Field(
        ..., description="Creation time (format: YYYY-MM-DDTHH:mm:ss), e.g. 2024-01-15T09:00:00"
    )
    @field_validator("created_at", mode="before")
    @classmethod
    def parse_datetime(cls, value):
        if value is None:
            return None
        if isinstance(value, pendulum.DateTime):
            return value
        if isinstance(value, str):
            return pendulum.parse(value)
        return value
    @field_serializer("created_at")
    def serialize_datetime(self, dt: Optional[pendulum.DateTime]) -> Optional[str]:
        if dt is None:
            return None
        return dt.to_iso8601_string()
    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()
class SingingRecordBasicSchema(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    record_id: int = Field(..., description="Record ID (big integer, auto-increment, non-negative), e.g. 10001")
    user_id: int = Field(..., description="User ID (references user.user_id), e.g. 10001")
    song_id: int = Field(..., description="Song ID (references song.song_id), e.g. 10001")
    audio_url: str = Field(
        ...,
        description="Recording audio URL (format: URL), e.g. /static/uploads/singing_10001_1705312200.wav",
    )
    score: int = Field(..., description="Singing score (range: 0-100), e.g. 85")
    stars_earned: int = Field(..., description="Stars earned (range: 0-3), e.g. 2")
    feedback_data: SingingFeedbackBasicSchema = Field(..., description="Per-syllable feedback data")
    created_at: DateTime = Field(
        ..., description="Creation time (format: YYYY-MM-DDTHH:mm:ss), e.g. 2024-01-15T14:30:00"
    )
    @field_validator("created_at", mode="before")
    @classmethod
    def parse_datetime(cls, value):
        if value is None:
            return None
        if isinstance(value, pendulum.DateTime):
            return value
        if isinstance(value, str):
            return pendulum.parse(value)
        return value
    @field_serializer("created_at")
    def serialize_datetime(self, dt: Optional[pendulum.DateTime]) -> Optional[str]:
        if dt is None:
            return None
        return dt.to_iso8601_string()
    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()
class AuthTokenBasicSchema(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    access_token: str = Field(
        ..., description="JWT access token (format: JWT), e.g. eyJhbGciOiJIUzI1NiIs..."
    )
    token_type: str = Field(..., description="Token type (value: Bearer), e.g. Bearer")
    expires_in: int = Field(..., description="Token validity (unit: seconds), e.g. 604800")
    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()