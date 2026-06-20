from typing import Any

from fastapi import APIRouter, Body, Path, Query

from result_response import ApiResponse, ApiResponseModel, create_not_found_error
from services import rhythm_service


router = APIRouter(tags=["rhythm"])


@router.get("/units")
async def list_units() -> ApiResponseModel:
    return ApiResponse.success(data=rhythm_service.list_units())


@router.get("/units/{unit_id}")
async def get_unit(unit_id: int = Path(...)) -> ApiResponseModel:
    unit = rhythm_service.get_unit(unit_id)
    if unit is None:
        return ApiResponse.error(create_not_found_error("Unit", unit_id))
    return ApiResponse.success(data=unit)


@router.get("/levels")
async def list_levels(unit_id: int = Query(...)) -> ApiResponseModel:
    return ApiResponse.success(data=rhythm_service.list_levels(unit_id))


@router.get("/levels/{level_id}")
async def get_level(level_id: int = Path(...)) -> ApiResponseModel:
    level = rhythm_service.get_level(level_id)
    if level is None:
        return ApiResponse.error(create_not_found_error("Level", level_id))
    return ApiResponse.success(data=level)


@router.post("/levels/{level_id}/generate")
async def generate_question(level_id: int = Path(...)) -> ApiResponseModel:
    question = rhythm_service.generate_question(level_id)
    if question is None:
        return ApiResponse.error(create_not_found_error("Level", level_id))
    return ApiResponse.success(data=question)


@router.post("/questions/{question_id}/submit")
async def submit_answer(
    question_id: int = Path(...),
    answer: dict[str, Any] = Body(default_factory=dict),
) -> ApiResponseModel:
    result = rhythm_service.submit_answer(question_id, answer)
    if result is None:
        return ApiResponse.error(create_not_found_error("Question", question_id))
    return ApiResponse.success(data=result)


@router.get("/instruments")
async def list_instruments() -> ApiResponseModel:
    return ApiResponse.success(data=rhythm_service.list_instruments())


@router.get("/audio-tracks")
async def list_audio_tracks() -> ApiResponseModel:
    return ApiResponse.success(data=rhythm_service.list_audio_tracks())
