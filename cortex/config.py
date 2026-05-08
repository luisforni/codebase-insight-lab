from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:4173"]

    ollama_base_url: str = "http://ollama:11434"
    ollama_model: str = "qwen25-7b-instruct"

    anthropic_api_key: str = ""
    openai_api_key: str = ""
    google_api_key: str = ""
    groq_api_key: str = ""

    db_path: str = "cortex/data/insight.db"
    explanations_path: str = "cortex/data/explanations"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    def ensure_dirs(self):
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        Path(self.explanations_path).mkdir(parents=True, exist_ok=True)


settings = Settings()
