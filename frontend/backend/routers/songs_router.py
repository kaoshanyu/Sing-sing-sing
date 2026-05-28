from typing import Optional

from all_enums import DifficultyEnum
from fastapi import APIRouter, Depends, Query, Path
from result_response import ApiResponse, ApiResponseModel, create_not_found_error
from sqlalchemy.orm import Session

from database import get_db
from depends.auth import get_current_user
from schemas.api.songs_schema import (
ListSongsResponseDataSchema,
GetSongResponseDataSchema,
)
from schemas.basic_schema import SongBasicSchema
from services.songs_service import SongsService

router = APIRouter(prefix="/songs", tags=["songs"])
@router.get("")
async def list_songs(
    difficulty: Optional[DifficultyEnum] = Query(None, description="Filter by difficulty"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> ApiResponseModel[ListSongsResponseDataSchema]:
    result = await SongsService.list_songs(
        db=db,
        page=page,
        limit=limit,
        difficulty=difficulty
    )
    if not result.is_success:
        return ApiResponse.error(result.error)
    song_models, total_count = result.data
    songs_list = [
        SongBasicSchema(
            song_id=song.song_id,
            title=song.title,
            lyrics=song.lyrics,
            reference_melody=song.reference_melody,
            difficulty=song.difficulty,
            created_at=song.created_at
        )
        for song in song_models
    ]
    response_data = ListSongsResponseDataSchema(
        songs=songs_list,
        total=total_count,
        page=page,
        limit=limit
    )
    return ApiResponse.success(data=response_data, detail="Songs retrieved")
@router.get("/{song_id}")
async def get_song(
    song_id: int = Path(..., description="Song ID"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> ApiResponseModel[GetSongResponseDataSchema]:
    result = await SongsService.get_song_by_id(
        db=db,
        song_id=song_id
    )
    if not result.is_success:
        return ApiResponse.error(result.error)
    if result.data is None:
        return ApiResponse.error(create_not_found_error("Song", song_id))
    song = result.data
    response_data = GetSongResponseDataSchema(
        song_id=song.song_id,
        title=song.title,
        lyrics=song.lyrics,
        reference_melody=song.reference_melody,
        difficulty=song.difficulty,
        created_at=song.created_at
    )
    return ApiResponse.success(data=response_data, detail="Song retrieved")