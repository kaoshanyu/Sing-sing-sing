from typing import List, Optional

from all_enums import DifficultyEnum
from pydantic import BaseModel, ConfigDict, Field

from schemas.basic_schema import SongBasicSchema

class ListSongsQueryParamsSchema(BaseModel):
    """List songs query parameters schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    difficulty: Optional[DifficultyEnum] = Field(
        None, description="Filter by difficulty (enum: EASY|MEDIUM|HARD, e.g., EASY)"
    )
    page: Optional[int] = Field(
        None, description="Page number (min: 1, default: 1, e.g., 1)"
    )
    limit: Optional[int] = Field(
        None, description="Items per page (range: 1-100, default: 20, e.g., 20)"
    )
class ListSongsResponseDataSchema(BaseModel):
    """List songs response data schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    songs: List[SongBasicSchema] = Field(..., description="List of songs")
    total: int = Field(..., description="Total count (min: 0, e.g., 5)")
    page: int = Field(..., description="Current page (min: 1, e.g., 1)")
    limit: int = Field(..., description="Items per page (range: 1-100, e.g., 20)")
class SongPathParamsSchema(BaseModel):
    """Song path parameters schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    song_id: int = Field(..., description="Song ID (big integer, e.g., 10001)")
class GetSongResponseDataSchema(SongBasicSchema):
    """Get song response data schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
