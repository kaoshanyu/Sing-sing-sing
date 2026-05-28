from typing import List, Optional

from all_enums import MessageRoleEnum
from pydantic import BaseModel, ConfigDict, Field

class ConversationHistoryItemSchema(BaseModel):
    """Conversation history item schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    role: MessageRoleEnum = Field(..., description="Message role (enum: USER|ASSISTANT, e.g., USER)")
    content: str = Field(..., description="Message content (max 2000 chars, e.g., 什么是音程？)")
class SendMessageResponseDataSchema(BaseModel):
    """Send message response data schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    response: str = Field(..., description="AI mentor response, e.g. 音程是指两个音之间的距离喵~")
    conversation_id: Optional[str] = Field(
        None,
        description="Conversation ID for context (nullable, format: UUID v4, e.g. 550e8400-e29b-41d4-a716-446655440000)"
    )
class SendMessageRequestSchema(BaseModel):
    """Send message request schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    message: str = Field(..., description="User message (max 2000 chars, e.g., 什么是音程？)")
    conversation_history: Optional[List[ConversationHistoryItemSchema]] = Field(
        None,
        description="Previous conversation messages (optional)"
    )