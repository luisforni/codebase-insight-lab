from abc import ABC, abstractmethod
from typing import AsyncIterator


class BaseModel(ABC):
    provider: str
    model_id: str

    @abstractmethod
    async def stream(self, system: str, user: str, max_tokens: int = 4096) -> AsyncIterator[str]:
        """Yield text chunks as the model generates them."""
        ...

    @abstractmethod
    async def complete(self, system: str, user: str, max_tokens: int = 4096) -> str:
        """Return the full completion as a single string."""
        ...

    @abstractmethod
    async def is_available(self) -> bool:
        """Check if this provider/model is reachable."""
        ...
