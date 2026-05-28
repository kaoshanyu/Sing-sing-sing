from typing import List

from fastapi import APIRouter, Depends, Body
from result_response import ApiResponse, ApiResponseModel, create_not_found_error
from sqlalchemy.orm import Session

from database import get_db
from depends.auth import get_current_user
from models import UserModel
from schemas.api.users_schema import (
GetCurrentUserResponseDataSchema,
UpdateCurrentUserRequestSchema,
UpdateCurrentUserResponseDataSchema,
SaveQuestionnaireRequestSchema,
SaveVocalRangeRequestSchema,
GetUserStatsResponseDataSchema,
GetLevelProgressResponseDataSchema,
)
from schemas.basic_schema import UserLevelProgressBasicSchema
from services.users_service import UsersService

router = APIRouter(prefix="/users", tags=["users"])
@router.get("/me/level-progress")
async def get_level_progress(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ApiResponseModel[GetLevelProgressResponseDataSchema]:
    result = await UsersService.get_level_progress(
        db=db,
        user_id=current_user.user_id
    )
    if not result.is_success:
        return ApiResponse.error(result.error)
    progress_models = result.data
    progress_list: List[UserLevelProgressBasicSchema] = [
        UserLevelProgressBasicSchema(
            progress_id=progress.progress_id,
            user_id=progress.user_id,
            module_type=progress.module_type,
            current_level=progress.current_level,
            total_stars=progress.total_stars,
            completion_percentage=progress.completion_percentage,
            updated_at=progress.updated_at
        )
        for progress in progress_models
    ]
    response_data = GetLevelProgressResponseDataSchema(root=progress_list)
    return ApiResponse.success(data=response_data, detail="Progress retrieved successfully")

@router.delete("/me/progress")
async def reset_progress(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ApiResponseModel[None]:
    result = await UsersService.reset_user_progress(
        db=db,
        user_id=current_user.user_id
    )
    if not result.is_success:
        return ApiResponse.error(result.error)
    return ApiResponse.success(data=None, detail="Progress reset successfully")

@router.post("/me/questionnaire")
async def save_questionnaire(
    request_data: SaveQuestionnaireRequestSchema = Body(...),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ApiResponseModel[None]:
    result = await UsersService.save_questionnaire_answers(
        db=db,
        user_id=current_user.user_id,
        answers=request_data.answers
    )
    if not result.is_success:
        return ApiResponse.error(result.error)
    return ApiResponse.success(data=None, detail="Questionnaire saved successfully")

@router.get("/me/stats")
async def get_user_stats(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ApiResponseModel[GetUserStatsResponseDataSchema]:
    result = await UsersService.get_user_stats(
        db=db,
        user_id=current_user.user_id
    )
    if not result.is_success:
        return ApiResponse.error(result.error)
    if result.data is None:
        return ApiResponse.error(create_not_found_error("UserStats", current_user.user_id))
    stats = result.data
    response_data = GetUserStatsResponseDataSchema(
        stats_id=stats.stats_id,
        user_id=stats.user_id,
        total_study_days=stats.total_study_days,
        total_practice_minutes=stats.total_practice_minutes,
        streak_days=stats.streak_days,
        total_stars=stats.total_stars,
        total_correct_answers=stats.total_correct_answers,
        last_practice_date=stats.last_practice_date,
        updated_at=stats.updated_at
    )
    return ApiResponse.success(data=response_data, detail="Stats retrieved successfully")

@router.post("/me/vocal-range")
async def save_vocal_range(
    request_data: SaveVocalRangeRequestSchema = Body(...),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ApiResponseModel[None]:
    result = await UsersService.save_vocal_range(
        db=db,
        user_id=current_user.user_id,
        lowest_note=request_data.lowest_note,
        highest_note=request_data.highest_note
    )
    if not result.is_success:
        return ApiResponse.error(result.error)
    return ApiResponse.success(data=None, detail="Vocal range saved successfully")

@router.get("/me")
async def get_current_user_endpoint(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ApiResponseModel[GetCurrentUserResponseDataSchema]:
    result = await UsersService.get_user_by_id(
        db=db,
        user_id=current_user.user_id
    )
    if not result.is_success:
        return ApiResponse.error(result.error)
    if result.data is None:
        return ApiResponse.error(create_not_found_error("User", current_user.user_id))
    user = result.data
    response_data = GetCurrentUserResponseDataSchema(
        user_id=user.user_id,
        email=user.email,
        nickname=user.nickname,
        avatar_url=user.avatar_url,
        is_admin=user.is_admin,
        vocal_range_lowest=user.vocal_range_lowest,
        vocal_range_highest=user.vocal_range_highest,
        questionnaire_completed=user.questionnaire_completed,
        created_at=user.created_at,
        updated_at=user.updated_at
    )
    return ApiResponse.success(data=response_data, detail="User profile retrieved")

@router.put("/me")
async def update_current_user(
    request_data: UpdateCurrentUserRequestSchema = Body(...),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ApiResponseModel[UpdateCurrentUserResponseDataSchema]:
    result = await UsersService.update_user_profile(
        db=db,
        user_id=current_user.user_id,
        request_data=request_data
    )
    if not result.is_success:
        return ApiResponse.error(result.error)
    user = result.data
    response_data = UpdateCurrentUserResponseDataSchema(
        user_id=user.user_id,
        email=user.email,
        nickname=user.nickname,
        avatar_url=user.avatar_url,
        is_admin=user.is_admin,
        vocal_range_lowest=user.vocal_range_lowest,
        vocal_range_highest=user.vocal_range_highest,
        questionnaire_completed=user.questionnaire_completed,
        created_at=user.created_at,
        updated_at=user.updated_at
    )
    return ApiResponse.success(data=response_data, detail="Profile updated successfully")
