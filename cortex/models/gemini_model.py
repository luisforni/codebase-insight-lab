from typing import AsyncIterator
import google.generativeai as genai
from .base_model import BaseModel
from config import settings


class GeminiModel(BaseModel):
    provider = "gemini"

    def __init__(self, model_id: str = "gemini-2.0-flash"):
        self.model_id = model_id
        genai.configure(api_key=settings.google_api_key)
        self._model = genai.GenerativeModel(model_id)

    async def stream(self, system: str, user: str, max_tokens: int = 4096) -> AsyncIterator[str]:
        prompt = f"{system}\n\n{user}"
        response = await self._model.generate_content_async(
            prompt,
            generation_config=genai.GenerationConfig(max_output_tokens=max_tokens),
            stream=True,
        )
        async for chunk in response:
            if chunk.text:
                yield chunk.text

    async def complete(self, system: str, user: str, max_tokens: int = 4096) -> str:
        prompt = f"{system}\n\n{user}"
        response = await self._model.generate_content_async(
            prompt,
            generation_config=genai.GenerationConfig(max_output_tokens=max_tokens),
        )
        return response.text or ""

    async def is_available(self) -> bool:
        return bool(settings.google_api_key)
