from typing import AsyncIterator
import anthropic
from .base_model import BaseModel
from config import settings


class AnthropicModel(BaseModel):
    provider = "anthropic"

    def __init__(self, model_id: str = "claude-sonnet-4-6"):
        self.model_id = model_id
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def stream(self, system: str, user: str, max_tokens: int = 4096) -> AsyncIterator[str]:
        async with self._client.messages.stream(
            model=self.model_id,
            system=system,
            messages=[{"role": "user", "content": user}],
            max_tokens=max_tokens,
        ) as stream:
            async for text in stream.text_stream:
                yield text

    async def complete(self, system: str, user: str, max_tokens: int = 4096) -> str:
        msg = await self._client.messages.create(
            model=self.model_id,
            system=system,
            messages=[{"role": "user", "content": user}],
            max_tokens=max_tokens,
        )
        return msg.content[0].text if msg.content else ""

    async def is_available(self) -> bool:
        return bool(settings.anthropic_api_key)
