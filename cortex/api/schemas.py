from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel
from typing import Literal

from config import settings

_camel = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ModelConfigSchema(BaseModel):
    model_config = _camel

    provider: Literal["ollama", "anthropic", "openai", "gemini", "groq"] = "ollama"
    model_id: str = settings.ollama_model
    max_tokens: int = 4096
    temperature: float = 0.3


class AnalysisContextSchema(BaseModel):
    model_config = _camel

    file_path: str
    workspace_id: str = ""
    full_content: str | None = None
    selected_snippet: str | None = None
    functions: list[str] = Field(default_factory=list)
    classes: list[str] = Field(default_factory=list)
    variables: list[str] = Field(default_factory=list)
    imports: list[str] = Field(default_factory=list)
    logs: list[str] = Field(default_factory=list)
    project_structure: str | None = None


class AnalysisRequestSchema(BaseModel):
    model_config = _camel

    type: Literal["file", "selection", "hover", "question", "command_output"]
    context: AnalysisContextSchema
    query: str | None = None
    target_agents: list[str] | None = None
    llm_config: ModelConfigSchema = Field(
        default_factory=ModelConfigSchema,
        alias="modelConfig",
    )


class HoverRequestSchema(BaseModel):
    model_config = _camel

    file_path: str
    content: str
    line: int
    column: int
    workspace_id: str = ""
    llm_config: ModelConfigSchema = Field(
        default_factory=ModelConfigSchema,
        alias="modelConfig",
    )


class CommandRequestSchema(BaseModel):
    model_config = _camel

    command: str
    working_dir: str = "."


class ExplanationSchema(BaseModel):
    model_config = _camel

    id: str
    element_type: str
    element_name: str
    line: int
    file_path: str
    content: str
    agent_source: str
    model_used: str
    timestamp: int
    is_cached: bool = False


class CoderRequestSchema(BaseModel):
    model_config = _camel

    task: str
    file_path: str
    content: str
    workspace_id: str = ""
    ui_lang: str = "es"
    llm_config: ModelConfigSchema = Field(
        default_factory=ModelConfigSchema,
        alias="modelConfig",
    )


class SummaryRequestSchema(BaseModel):
    model_config = _camel

    file_path: str
    content: str
    workspace_id: str = ""
    ui_lang: str = "es"
    llm_config: ModelConfigSchema = Field(
        default_factory=ModelConfigSchema,
        alias="modelConfig",
    )
