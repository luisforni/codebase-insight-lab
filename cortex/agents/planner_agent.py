import uuid
from .base_agent import BaseAgent
from parsers.code_parser import ParsedFile


class PlannerAgent(BaseAgent):
    agent_id = "planner"
    agent_name = "Planner Agent"

    def build_system_prompt(self, ui_lang: str = "es") -> str:
        return (
            "You are a senior technical lead specialized in task decomposition and planning. "
            "When given a coding task, you break it into clear, ordered, actionable steps. "
            "You identify risks, dependencies, affected files, and estimate effort. "
            "Your output is a structured implementation plan that a developer can follow. "
            f"{self._lang_instruction(ui_lang)}"
        )

    def build_user_prompt(self, context: dict, parsed: ParsedFile) -> str:
        ctx = context.get("context", {})
        content = ctx.get("full_content") or ctx.get("selected_snippet", "")
        file_path = ctx.get("file_path", "unknown")
        task = context.get("query", "")
        summary = self.parser.build_context_summary(parsed)

        return (
            f"File: `{file_path}`\n\n"
            f"## Task\n{task}\n\n"
            f"## Code Summary\n{summary}\n\n"
            f"## Current Code\n```{parsed.language}\n{self._truncate(content)}\n```\n\n"
            "Create a step-by-step implementation plan:\n"
            "1. **Affected files**: Which files need changes?\n"
            "2. **Steps**: Numbered list of changes to make\n"
            "3. **Risks**: What could go wrong?\n"
            "4. **Tests**: What should be tested?"
        )

    def generate_suggested_questions(self, context: dict) -> list[dict]:
        return [
            {"id": str(uuid.uuid4()), "text": "What are the main risks of this implementation?", "contextType": "full_file", "agentTargets": ["planner", "reviewer"]},
            {"id": str(uuid.uuid4()), "text": "Which existing functions need to be modified?", "contextType": "functions", "agentTargets": ["planner", "functions"]},
        ]
