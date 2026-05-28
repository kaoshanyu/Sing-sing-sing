
from all_enums import ModuleTypeEnum
from pydantic import BaseModel, ConfigDict, Field

from schemas.basic_schema import QuizSessionBasicSchema

class CreateSessionRequestSchema(BaseModel):
    """Create quiz session request schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    module_type: ModuleTypeEnum = Field(
        ...,
        description="Module type (enum: PITCH_DISCRIMINATION|INTERVAL_DICTATION|RHYTHM_TRAINING|MELODY_DICTATION), e.g. PITCH_DISCRIMINATION",
    )
class CreateSessionResponseDataSchema(QuizSessionBasicSchema):
    """Create quiz session response data schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
class GetSessionPathParamsSchema(BaseModel):
    """Get quiz session path parameters schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    session_id: int = Field(..., description="Session ID (big integer), e.g. 10001")
class GetSessionResponseDataSchema(QuizSessionBasicSchema):
    """Get quiz session response data schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
class SubmitAnswerPathParamsSchema(BaseModel):
    """Submit answer path parameters schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    session_id: int = Field(..., description="Session ID (big integer), e.g. 10001")
class SubmitAnswerRequestSchema(BaseModel):
    """Submit answer request schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    question_id: int = Field(..., description="Question ID (big integer), e.g. 10001")
    answer: str = Field(..., description="User's answer, e.g. higher")
class SubmitAnswerResponseDataSchema(BaseModel):
    """Submit answer response data schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    is_correct: bool = Field(..., description="Was answer correct (true: correct, false: wrong)")
    correct_answer: str = Field(..., description="The correct answer, e.g. higher")
    feedback: str = Field(..., description="Feedback message, e.g. 答对了！")
    hearts_remaining: int = Field(..., description="Remaining hearts (min: 0, max: 5), e.g. 4")
    combo_count: int = Field(..., description="Current combo streak (min: 0), e.g. 3")
class CompleteSessionPathParamsSchema(BaseModel):
    """Complete session path parameters schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    session_id: int = Field(..., description="Session ID (big integer), e.g. 10001")
class CompleteSessionResponseDataSchema(BaseModel):
    """Complete session response data schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    score: int = Field(..., description="Final score (range: 0-100), e.g. 85")
    stars_earned: int = Field(..., description="Stars earned (range: 0-3), e.g. 2")
    correct_count: int = Field(..., description="Number of correct answers (min: 0, max: 20), e.g. 17")
    total_questions: int = Field(..., description="Total questions (value: 20), e.g. 20")
    duration_seconds: int = Field(..., description="Session duration (unit: seconds), e.g. 300")