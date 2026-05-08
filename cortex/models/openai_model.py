from typing import AsyncIterator
from openai import AsyncOpenAI
from .base_model import BaseModel
from config import settings


class OpenAIModel(BaseModel):
    provider = "openai"

    def __init__(self, model_id: str = "gpt-4o"):
        self.model_id = model_id
        self._client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def stream(self, system: str, user: str, max_tokens: int = 4096) -> AsyncIterator[str]:
        stream = await self._client.chat.completions.create(
            model=self.model_id,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_tokens=max_tokens,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    async def complete(self, system: str, user: str, max_tokens: int = 4096) -> str:
        response = await self._client.chat.completions.create(
            model=self.model_id,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""

    async def is_available(self) -> bool:
        return bool(settings.openai_api_key)
