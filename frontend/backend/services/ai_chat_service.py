from typing import Optional, List, Dict, Any
import os

from all_enums import MessageRoleEnum
from result_response import Result, create_service_unavailable_error, create_internal_error
import httpx
import uuid

from schemas.api.ai_chat_schema import ConversationHistoryItemSchema

class AiChatService:
    """AI chat service for interacting with AI model plugin."""
    AI_PLUGIN_BASE_URL = "https://creo4u.com/autoagent/api/proxy/044b4dba-ec0f-4779-998c-e8a7893253cd"
    AI_API_ENDPOINT = "/compatible-mode/v1/chat/completions"
    AI_MODEL = "qwen3.5-plus"
    @staticmethod
    async def send_message_to_ai(
        ai_client: httpx.AsyncClient,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[ConversationHistoryItemSchema]] = None
    ) -> Result[Dict[str, Any]]:
        """
        Send message to AI model plugin and get response.
        Constructs messages array with system prompt, conversation history, and user message.
        Calls AI API at /compatible-mode/v1/chat/completions with model=qwen3.5-plus, enable_thinking=false.
        Extracts response content from AI API response.
        Returns dict with keys:
        - response (str): AI generated response
        - conversation_id (Optional[str]): UUID v4 format or None
        """
        try:
            messages = []
            messages.append({
                "role": "system",
                "content": system_prompt
            })
            if conversation_history:
                for history_item in conversation_history:
                    role_value = "user" if history_item.role == MessageRoleEnum.USER else "assistant"
                    messages.append({
                        "role": role_value,
                        "content": history_item.content
                    })
            messages.append({
                "role": "user",
                "content": user_message
            })
            api_url = f"{AiChatService.AI_PLUGIN_BASE_URL}{AiChatService.AI_API_ENDPOINT}"
            api_key = os.getenv("CREO4U_API_KEY")
            if not api_key:
                return Result.from_error(
                    create_internal_error("AI API key not configured")
                )
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            request_body = {
                "model": AiChatService.AI_MODEL,
                "enable_thinking": False,
                "messages": messages
            }
            response = await ai_client.post(
                api_url,
                headers=headers,
                json=request_body,
                timeout=60.0
            )
            if response.status_code != 200:
                return Result.from_error(
                    create_service_unavailable_error("AI service")
                )
            response_data = response.json()
            if not response_data.get("choices") or len(response_data["choices"]) == 0:
                return Result.from_error(
                    create_internal_error("Invalid AI API response structure")
                )
            ai_response_content = response_data["choices"][0].get("message", {}).get("content", "")
            if not ai_response_content:
                return Result.from_error(
                    create_internal_error("Empty AI response content")
                )
            conversation_id = str(uuid.uuid4())
            result_dict = {
                "response": ai_response_content,
                "conversation_id": conversation_id
            }
            return Result.success(result_dict)
        except httpx.TimeoutException:
            return Result.from_error(
                create_service_unavailable_error("AI service (timeout)")
            )
        except httpx.RequestError as e:
            return Result.from_error(
                create_service_unavailable_error(f"AI service (network error: {str(e)})")
            )
        except Exception as e:
            return Result.from_error(
                create_internal_error(f"AI chat error: {str(e)}")
            )