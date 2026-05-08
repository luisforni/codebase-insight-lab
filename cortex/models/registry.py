from .base_model import BaseModel
from .ollama_model import OllamaModel
from .anthropic_model import AnthropicModel
from .openai_model import OpenAIModel
from .gemini_model import GeminiModel
from .groq_model import GroqModel


class ModelRegistry:
    _builders = {
        "ollama":    lambda mid: OllamaModel(mid),
        "anthropic": lambda mid: AnthropicModel(mid),
        "openai":    lambda mid: OpenAIModel(mid),
        "gemini":    lambda mid: GeminiModel(mid),
        "groq":      lambda mid: GroqModel(mid),
    }

    @classmethod
    def get(cls, provider: str, model_id: str) -> BaseModel:
        builder = cls._builders.get(provider)
        if not builder:
            return OllamaModel(model_id)
        return builder(model_id)

    @classmethod
    def providers(cls) -> list[str]:
        return list(cls._builders.keys())


def get_model(provider: str, model_id: str) -> BaseModel:
    return ModelRegistry.get(provider, model_id)
