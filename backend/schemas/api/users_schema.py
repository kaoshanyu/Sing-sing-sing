from typing import List, Optional, Dict, Any

from pydantic import BaseModel, RootModel, ConfigDict, Field

from schemas.basic_schema import (
UserBasicSchema,
UserStatsBasicSchema,
UserLevelProgressBasicSchema,
)

class GetCurrentUserResponseDataSchema(UserBasicSchema):
    """Get current user profile response data schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
class UpdateCurrentUserRequestSchema(BaseModel):
    """Update current user profile request schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    nickname: Optional[str] = Field(None, description="User nickname (max 50 chars), e.g. 音乐小白")
    avatar_url: Optional[str] = Field(None, description="Avatar URL (format: URL), e.g. /static/uploads/avatar_10001.jpg")
class UpdateCurrentUserResponseDataSchema(UserBasicSchema):
    """Update current user profile response data schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
class SaveQuestionnaireRequestSchema(BaseModel):
    """Save onboarding questionnaire answers request schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    answers: Dict[str, Any] = Field(
        ...,
        description="Questionnaire answers as key-value pairs (dynamic object: question IDs as keys, selected answers as values), e.g. {'music_experience': 'beginner', 'learning_goals': ['improve_pitch', 'learn_songs']}",
    )
class SaveVocalRangeRequestSchema(BaseModel):
    """Save vocal range test results request schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    lowest_note: str = Field(..., description="Lowest comfortable note, e.g. G3")
    highest_note: str = Field(..., description="Highest comfortable note, e.g. D5")
class GetUserStatsResponseDataSchema(UserStatsBasicSchema):
    """Get current user learning statistics response data schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
class GetLevelProgressResponseDataSchema(RootModel[List[UserLevelProgressBasicSchema]]):
    """Get level progress for all modules response data schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    def __iter__(self):
        return iter(self.root)
    def __getitem__(self, item):
        return self.root[item]