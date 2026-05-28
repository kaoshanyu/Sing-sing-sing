
from fastapi import APIRouter, Depends, Body
from result_response import ApiResponse, ApiResponseModel
from sqlalchemy.orm import Session
import httpx

from database import get_db
from depends.ai_client import get_ai_client, AI_SYSTEM_PROMPT
from depends.auth import get_current_user
from models import UserModel
from schemas.api.ai_chat_schema import (
SendMessageRequestSchema,
SendMessageResponseDataSchema,
)
from services.ai_chat_service import AiChatService

router = APIRouter(prefix="/ai-chat", tags=["ai_chat"])
@router.post("")
async def send_message(
    request_data: SendMessageRequestSchema = Body(...),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
    ai_client: httpx.AsyncClient = Depends(get_ai_client)
) -> ApiResponseModel[SendMessageResponseDataSchema]:
    result = await AiChatService.send_message_to_ai(
        ai_client=ai_client,
        system_prompt=AI_SYSTEM_PROMPT,
        user_message=request_data.message,
        conversation_history=request_data.conversation_history
    )
    if not result.is_success:
        return ApiResponse.error(result.error)
    ai_data = result.data
    response_data = SendMessageResponseDataSchema(
        response=ai_data.get("response", ""),
        conversation_id=ai_data.get("conversation_id")
    )
    return ApiResponse.success(data=response_data, detail="Response generated")