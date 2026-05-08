import asyncio
import uuid
import time
import json
import subprocess
from fastapi import APIRouter

from .schemas import HoverRequestSchema, CommandRequestSchema, ExplanationSchema, CoderRequestSchema, SummaryRequestSchema
from models.registry import get_model, ModelRegistry
from agents.coder_agent import CoderAgent
from agents.summarizer_agent import SummarizerAgent
from parsers.code_parser import CodeParser
from storage.database import save_explanation, get_explanations
from config import settings

router = APIRouter()
parser = CodeParser()


@router.get("/health")
async def health():
    ollama_model = get_model("ollama", settings.ollama_model)
    ollama_ok = await ollama_model.is_available()
    return {
        "status": "ok",
        "providers": ModelRegistry.providers(),
        "ollama_connected": ollama_ok,
        "ollama_model": settings.ollama_model,
    }


@router.post("/api/hover")
async def hover_explanation(req: HoverRequestSchema):
    cached = await get_explanations(req.file_path)
    for exp in cached:
        if exp["line_number"] == req.line:
            return {
                "explanation": {
                    **exp,
                    "line": exp["line_number"],
                    "timestamp": exp["created_at"],
                    "is_cached": True,
                }
            }

    ext = req.file_path.rsplit(".", 1)[-1] if "." in req.file_path else "plaintext"
    LANG_MAP = {"ts": "typescript", "tsx": "typescript", "js": "javascript", "jsx": "javascript",
                "py": "python", "rs": "rust", "go": "go", "java": "java"}
    language = LANG_MAP.get(ext, ext)

    element = parser.get_element_at_position(req.content, language, req.line, req.column)
    if element["type"] == "unknown" or not element["name"]:
        return {"explanation": None}

    model = get_model(req.llm_config.provider, req.llm_config.model_id)

    system = (
        "You are a senior software engineer. Your job is to give concise, precise explanations "
        "of code elements. Focus on WHAT it does and WHY it exists. Avoid restating the code. "
        "Max 3 sentences or a short bullet list."
    )
    user = (
        f"File: {req.file_path} (line {req.line})\n"
        f"Element type: {element['type']}\n"
        f"Name: {element['name']}\n\n"
        f"Code context:\n```{language}\n{element['snippet']}\n```\n\n"
        f"Explain this {element['type']} in 2-3 sentences."
    )

    explanation_text = await model.complete(system, user, max_tokens=512)

    exp_id = str(uuid.uuid4())
    now = int(time.time() * 1000)
    model_label = f"{req.llm_config.provider}/{req.llm_config.model_id}"

    exp_data = {
        "id": exp_id,
        "file_path": req.file_path,
        "element_type": element["type"],
        "element_name": element["name"],
        "line_number": req.line,
        "content": explanation_text,
        "agent_source": "hover",
        "model_used": model_label,
        "workspace_id": req.workspace_id,
        "created_at": now,
    }
    await save_explanation(exp_data)

    return {
        "explanation": {
            "id": exp_id,
            "elementType": element["type"],
            "elementName": element["name"],
            "line": req.line,
            "filePath": req.file_path,
            "content": explanation_text,
            "agentSource": "hover",
            "modelUsed": model_label,
            "timestamp": now,
            "isCached": False,
        }
    }


@router.post("/api/command")
async def run_command(req: CommandRequestSchema):
    try:
        result = await asyncio.to_thread(
            subprocess.run,
            req.command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30,
            cwd=req.working_dir if req.working_dir != "." else None,
        )
        output = result.stdout + result.stderr
        return {"output": output[:8000], "exitCode": result.returncode}
    except subprocess.TimeoutExpired:
        return {"output": "Command timed out (30s limit)", "exitCode": 1}
    except Exception as e:
        return {"output": str(e), "exitCode": 1}


@router.get("/api/explanations")
async def list_explanations(file: str):
    rows = await get_explanations(file)
    return {"explanations": rows}


@router.post("/api/explanations")
async def create_explanation(exp: ExplanationSchema):
    data = {
        "id": exp.id,
        "file_path": exp.file_path,
        "element_type": exp.element_type,
        "element_name": exp.element_name,
        "line_number": exp.line,
        "content": exp.content,
        "agent_source": exp.agent_source,
        "model_used": exp.model_used,
        "workspace_id": "",
        "created_at": exp.timestamp,
    }
    await save_explanation(data)
    return {"id": exp.id}


@router.post("/api/coder")
async def coder_generate(req: CoderRequestSchema):
    model = get_model(req.llm_config.provider, req.llm_config.model_id)
    agent = CoderAgent(model)
    collected: list[str] = []

    async def noop_send(msg: dict):
        if msg.get("type") == "agent_chunk":
            collected.append(msg.get("content", ""))

    msg = {
        "type": "question",
        "query": req.task,
        "uiLang": req.ui_lang,
        "context": {
            "file_path": req.file_path,
            "full_content": req.content,
            "workspace_id": req.workspace_id,
        },
        "modelConfig": {"provider": req.llm_config.provider, "modelId": req.llm_config.model_id},
    }
    await agent.run(msg, noop_send)
    raw = "".join(collected)

    edits = []
    try:
        import re
        m = re.search(r"```json\s*(\{.*?\})\s*```", raw, re.DOTALL)
        if m:
            data = json.loads(m.group(1))
            edits = data.get("edits", [])
    except Exception:
        pass

    return {"edits": edits, "raw": raw}


@router.post("/api/summary")
async def summary_generate(req: SummaryRequestSchema):
    model = get_model(req.llm_config.provider, req.llm_config.model_id)
    agent = SummarizerAgent(model)
    collected: list[str] = []

    async def noop_send(msg: dict):
        if msg.get("type") == "agent_chunk":
            collected.append(msg.get("content", ""))

    msg = {
        "type": "file",
        "uiLang": req.ui_lang,
        "context": {
            "file_path": req.file_path,
            "full_content": req.content,
            "workspace_id": req.workspace_id,
        },
        "modelConfig": {"provider": req.llm_config.provider, "modelId": req.llm_config.model_id},
    }
    await agent.run(msg, noop_send)
    return {"document": "".join(collected)}


@router.get("/api/models")
async def list_models():
    ollama = get_model("ollama", settings.ollama_model)
    ollama_available = await ollama.is_available()
    return {
        "ollama": [settings.ollama_model] if ollama_available else [],
        "cloud": ["claude-sonnet-4-6", "gpt-4o", "gemini-2.0-flash", "llama-3.3-70b-versatile"],
    }
