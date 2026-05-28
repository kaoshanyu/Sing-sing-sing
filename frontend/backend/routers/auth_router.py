
from fastapi import APIRouter, Depends, Body
from result_response import ApiResponse, ApiResponseModel
from sqlalchemy.orm import Session

from database import get_db
from schemas.api.auth_schema import (
RegisterRequestSchema,
RegisterResponseDataSchema,
LoginRequestSchema,
LoginResponseDataSchema,
)
from schemas.basic_schema import UserBasicSchema, AuthTokenBasicSchema
from services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
@router.post("/login")
async def login(
    request_data: LoginRequestSchema = Body(...),
    db: Session = Depends(get_db)
) -> ApiResponseModel[LoginResponseDataSchema]:
    result = await AuthService.authenticate_user(
        db=db,
        email=request_data.email,
        password=request_data.password
    )
    if not result.is_success:
        return ApiResponse.error(result.error)
    user_model = result.data
    token_result = await AuthService.generate_access_token(
        user_id=user_model.user_id
    )
    if not token_result.is_success:
        return ApiResponse.error(token_result.error)
    access_token = token_result.data
    user_schema = UserBasicSchema(
        user_id=user_model.user_id,
        email=user_model.email,
        nickname=user_model.nickname,
        avatar_url=user_model.avatar_url,
        is_admin=user_model.is_admin,
        vocal_range_lowest=user_model.vocal_range_lowest,
        vocal_range_highest=user_model.vocal_range_highest,
        questionnaire_completed=user_model.questionnaire_completed,
        created_at=user_model.created_at,
        updated_at=user_model.updated_at
    )
    token_schema = AuthTokenBasicSchema(
        access_token=access_token,
        token_type="Bearer",
        expires_in=604800
    )
    response_data = LoginResponseDataSchema(
        user=user_schema,
        token=token_schema
    )
    return ApiResponse.success(data=response_data, detail="Login successful")

@router.post("/logout")
async def logout(
    db: Session = Depends(get_db)
) -> ApiResponseModel[None]:
    return ApiResponse.success(data=None, detail="Logout successful")

@router.post("/register")
async def register(
    request_data: RegisterRequestSchema = Body(...),
    db: Session = Depends(get_db)
) -> ApiResponseModel[RegisterResponseDataSchema]:
    result = await AuthService.register_user(
        db=db,
        email=request_data.email,
        password=request_data.password
    )
    if not result.is_success:
        return ApiResponse.error(result.error)
    user_model = result.data
    token_result = await AuthService.generate_access_token(
        user_id=user_model.user_id
    )
    if not token_result.is_success:
        return ApiResponse.error(token_result.error)
    access_token = token_result.data
    user_schema = UserBasicSchema(
        user_id=user_model.user_id,
        email=user_model.email,
        nickname=user_model.nickname,
        avatar_url=user_model.avatar_url,
        is_admin=user_model.is_admin,
        vocal_range_lowest=user_model.vocal_range_lowest,
        vocal_range_highest=user_model.vocal_range_highest,
        questionnaire_completed=user_model.questionnaire_completed,
        created_at=user_model.created_at,
        updated_at=user_model.updated_at
    )
    token_schema = AuthTokenBasicSchema(
        access_token=access_token,
        token_type="Bearer",
        expires_in=604800
    )
    response_data = RegisterResponseDataSchema(
        user=user_schema,
        token=token_schema
    )
    return ApiResponse.success(data=response_data, detail="Registration successful")
