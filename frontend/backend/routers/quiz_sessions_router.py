
from fastapi import APIRouter, Depends, Body, Path
from result_response import ApiResponse, ApiResponseModel, create_not_found_error, create_permission_error, create_resource_state_error
from sqlalchemy.orm import Session

from database import get_db
from depends.auth import get_current_user
from models import UserModel
from schemas.api.quiz_sessions_schema import (
CreateSessionRequestSchema,
CreateSessionResponseDataSchema,
GetSessionResponseDataSchema,
SubmitAnswerRequestSchema,
SubmitAnswerResponseDataSchema,
CompleteSessionResponseDataSchema,
)
from services.quiz_sessions_service import QuizSessionsService

router = APIRouter(prefix="/quiz-sessions", tags=["quiz_sessions"])
@router.post("")
async def create_session(
    request_data: CreateSessionRequestSchema = Body(...),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ApiResponseModel[CreateSessionResponseDataSchema]:
    result = await QuizSessionsService.create_quiz_session(
        db=db,
        user_id=current_user.user_id,
        module_type=request_data.module_type
    )
    if not result.is_success:
        return ApiResponse.error(result.error)
    session = result.data
    response_data = CreateSessionResponseDataSchema(
        session_id=session.session_id,
        user_id=session.user_id,
        module_type=session.module_type,
        questions=session.questions,
        current_index=session.current_index,
        correct_count=session.correct_count,
        hearts_remaining=session.hearts_remaining,
        combo_count=session.combo_count,
        session_status=session.session_status,
        score=session.score,
        stars_earned=session.stars_earned,
        started_at=session.started_at,
        completed_at=session.completed_at
    )
    return ApiResponse.success(data=response_data, detail="Quiz session created")
@router.get("/{session_id}")
async def get_session(
    session_id: int = Path(..., description="Session ID"),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ApiResponseModel[GetSessionResponseDataSchema]:
    result = await QuizSessionsService.get_quiz_session(
        db=db,
        session_id=session_id
    )
    if not result.is_success:
        return ApiResponse.error(result.error)
    if result.data is None:
        return ApiResponse.error(create_not_found_error("Session", session_id))
    session = result.data
    if session.user_id != current_user.user_id:
        return ApiResponse.error(create_permission_error("access this session"))
    response_data = GetSessionResponseDataSchema(
        session_id=session.session_id,
        user_id=session.user_id,
        module_type=session.module_type,
        questions=session.questions,
        current_index=session.current_index,
        correct_count=session.correct_count,
        hearts_remaining=session.hearts_remaining,
        combo_count=session.combo_count,
        session_status=session.session_status,
        score=session.score,
        stars_earned=session.stars_earned,
        started_at=session.started_at,
        completed_at=session.completed_at
    )
    return ApiResponse.success(data=response_data, detail="Session retrieved")
@router.post("/{session_id}/answers")
async def submit_answer(
    session_id: int = Path(..., description="Session ID"),
    request_data: SubmitAnswerRequestSchema = Body(...),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ApiResponseModel[SubmitAnswerResponseDataSchema]:
    session_result = await QuizSessionsService.get_quiz_session(
        db=db,
        session_id=session_id
    )
    if not session_result.is_success:
        return ApiResponse.error(session_result.error)
    if session_result.data is None:
        return ApiResponse.error(create_not_found_error("Session", session_id))
    session = session_result.data
    if session.user_id != current_user.user_id:
        return ApiResponse.error(create_permission_error("submit answer to this session"))
    if session.session_status != "IN_PROGRESS":
        return ApiResponse.error(create_resource_state_error("Session", session.session_status))
    answer_result = await QuizSessionsService.submit_answer(
        db=db,
        session_id=session_id,
        question_id=request_data.question_id,
        answer=request_data.answer
    )
    if not answer_result.is_success:
        return ApiResponse.error(answer_result.error)
    answer_data = answer_result.data
    response_data = SubmitAnswerResponseDataSchema(
        is_correct=answer_data.get("is_correct", False),
        correct_answer=answer_data.get("correct_answer", ""),
        feedback=answer_data.get("feedback", ""),
        hearts_remaining=answer_data.get("hearts_remaining", 0),
        combo_count=answer_data.get("combo_count", 0)
    )
    return ApiResponse.success(data=response_data, detail="Answer submitted")
@router.post("/{session_id}/complete")
async def complete_session(
    session_id: int = Path(..., description="Session ID"),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ApiResponseModel[CompleteSessionResponseDataSchema]:
    session_result = await QuizSessionsService.get_quiz_session(
        db=db,
        session_id=session_id
    )
    if not session_result.is_success:
        return ApiResponse.error(session_result.error)
    if session_result.data is None:
        return ApiResponse.error(create_not_found_error("Session", session_id))
    session = session_result.data
    if session.user_id != current_user.user_id:
        return ApiResponse.error(create_permission_error("complete this session"))
    if session.session_status == "COMPLETED":
        return ApiResponse.error(create_resource_state_error("Session", "already completed"))
    complete_result = await QuizSessionsService.complete_session(
        db=db,
        session_id=session_id
    )
    if not complete_result.is_success:
        return ApiResponse.error(complete_result.error)
    completion_data = complete_result.data
    response_data = CompleteSessionResponseDataSchema(
        score=completion_data.get("score", 0),
        stars_earned=completion_data.get("stars_earned", 0),
        correct_count=completion_data.get("correct_count", 0),
        total_questions=completion_data.get("total_questions", 20),
        duration_seconds=completion_data.get("duration_seconds", 0)
    )
    return ApiResponse.success(data=response_data, detail="Session completed")