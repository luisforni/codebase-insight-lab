"""
Orchestrator: supervisor pattern that routes requests to the appropriate agents.

Routing logic:
- file (full analysis): sequential run -> integration synthesis
- question / selection: targeted agents from request
- command_output: logs agent only
- coder: planner -> coder -> reviewer
- summary: summarizer agent
"""
import time
from typing import Callable, Awaitable

from config import settings
from models.registry import get_model
from .structure_agent import StructureAgent
from .functions_agent import FunctionsAgent
from .variables_agent import VariablesAgent
from .imports_agent import ImportsAgent
from .business_logic_agent import BusinessLogicAgent
from .error_handling_agent import ErrorHandlingAgent
from .security_agent import SecurityAgent
from .logs_agent import LogsAgent
from .integration_agent import IntegrationAgent
from .planner_agent import PlannerAgent
from .coder_agent import CoderAgent
from .reviewer_agent import ReviewerAgent
from .debugger_agent import DebuggerAgent
from .tester_agent import TesterAgent
from .documenter_agent import DocumenterAgent
from .architect_agent import ArchitectAgent
from .summarizer_agent import SummarizerAgent

SendFn = Callable[[dict], Awaitable[None]]

AGENT_CLASSES = {
    "structure":      StructureAgent,
    "functions":      FunctionsAgent,
    "variables":      VariablesAgent,
    "imports":        ImportsAgent,
    "business_logic": BusinessLogicAgent,
    "error_handling": ErrorHandlingAgent,
    "security":       SecurityAgent,
    "logs":           LogsAgent,
    "planner":        PlannerAgent,
    "coder":          CoderAgent,
    "reviewer":       ReviewerAgent,
    "debugger":       DebuggerAgent,
    "tester":         TesterAgent,
    "documenter":     DocumenterAgent,
    "architect":      ArchitectAgent,
    "summarizer":     SummarizerAgent,
}


class Orchestrator:
    def _build_model(self, msg: dict):
        mc = msg.get("model_config") or msg.get("llm_config") or {}
        provider = mc.get("provider", "ollama")
        model_id = mc.get("model_id") or settings.ollama_model
        return get_model(provider, model_id)

    async def run(self, msg: dict, send: SendFn):
        await send({"type": "analysis_started", "timestamp": int(time.time() * 1000)})

        req_type = msg.get("type", "file")
        target_agents: list[str] | None = msg.get("target_agents")
        pipeline = msg.get("pipeline")

        model = self._build_model(msg)

        try:
            if req_type == "command_output":
                agent = LogsAgent(model)
                await agent.run(msg, send)
            elif pipeline == "coder":
                await self._run_coder_pipeline(msg, model, send)
            elif pipeline == "summary":
                await SummarizerAgent(model).run(msg, send)
            elif req_type in ("question", "selection") and target_agents:
                for aid in target_agents:
                    if aid in AGENT_CLASSES:
                        await AGENT_CLASSES[aid](model).run(msg, send)
            else:
                await self._run_full_analysis(msg, model, send)
        except Exception as e:
            await send({"type": "error", "error": str(e), "timestamp": int(time.time() * 1000)})

        await send({"type": "analysis_completed", "timestamp": int(time.time() * 1000)})

    async def _run_full_analysis(self, msg: dict, model, send: SendFn):
        analyses: dict[str, str] = {}

        sequential_agents = [
            ("structure",      StructureAgent(model)),
            ("functions",      FunctionsAgent(model)),
            ("variables",      VariablesAgent(model)),
            ("imports",        ImportsAgent(model)),
            ("business_logic", BusinessLogicAgent(model)),
            ("error_handling", ErrorHandlingAgent(model)),
            ("security",       SecurityAgent(model)),
            ("logs",           LogsAgent(model)),
        ]
        for key, agent in sequential_agents:
            try:
                result = await agent.run(msg, send)
                analyses[key] = result if isinstance(result, str) else ""
            except Exception as e:
                await send({"type": "error", "error": f"Agent {key}: {e}", "timestamp": int(time.time() * 1000)})
                analyses[key] = ""

        integration = IntegrationAgent(model, previous_analyses=analyses)
        await integration.run(msg, send)

    async def _run_coder_pipeline(self, msg: dict, model, send: SendFn):
        planner_result = await PlannerAgent(model).run(msg, send)
        enriched = {**msg, "query": f"{msg.get('query', '')}\n\nPlan:\n{planner_result}"}
        coder_result = await CoderAgent(model).run(enriched, send)
        review_ctx = {**msg, "query": f"Review these proposed changes:\n{coder_result}"}
        await ReviewerAgent(model).run(review_ctx, send)
