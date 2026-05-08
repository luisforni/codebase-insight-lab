from typing import AsyncIterator
from openai import AsyncOpenAI
from .base_model import BaseModel
from config import settings


class LMStudioModel(BaseModel):
    provider = "lmstudio"

    def __init__(self, model_id: str | None = None):
        self.model_id = model_id or settings.lmstudio_model
        self._client = AsyncOpenAI(
            base_url=settings.lmstudio_base_url,
            api_key="lm-studio",
        )

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
            stream=False,
        )
        return response.choices[0].message.content or ""

    async def is_available(self) -> bool:
        try:
            models = await self._client.models.list()
            return len(models.data) > 0
        except Exception:
            return False
