from typing import AsyncGenerator
import os

import httpx

AI_PLUGIN_BASE_URL = "https://creo4u.com/autoagent/api/proxy/044b4dba-ec0f-4779-998c-e8a7893253cd"
AI_API_KEY = os.getenv("CREO4U_API_KEY", "")
AI_SYSTEM_PROMPT = "你是一只可爱的音乐老师小猫咪，专门帮助五音不全的学员学习音乐。你擅长解答乐理问题、给出练习建议、鼓励学员坚持练习。回答要温暖、简洁、有趣，偶尔可以用\"喵~\"结尾。"
async def get_ai_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """Provide configured async HTTP client for AI API calls."""
    async with httpx.AsyncClient(
        base_url=AI_PLUGIN_BASE_URL,
        headers={
            "Authorization": f"Bearer {AI_API_KEY}",
            "Content-Type": "application/json",
        },
        timeout=60.0,
    ) as client:
        yield client