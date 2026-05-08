import uuid
import json
from .base_agent import BaseAgent
from parsers.code_parser import ParsedFile


class CoderAgent(BaseAgent):
    agent_id = "coder"
    agent_name = "Coder Agent"

    def build_system_prompt(self, ui_lang: str = "es") -> str:
        return (
            "You are an expert software engineer. Given a coding task and existing code, "
            "you produce precise, minimal, production-quality code changes. "
            "You output changes as a structured JSON diff with fields: "
            "description (what the change does), original_content (the exact text being replaced), "
            "modified_content (the new code). Be surgical — only change what's needed. "
            "Always return valid JSON wrapped in a ```json code block. "
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
            "Return a JSON object with an 'edits' array. Each edit has:\n"
            "- description: what this change does\n"
            "- original_content: the exact text being replaced (must exist verbatim in the file)\n"
            "- modified_content: the new replacement text\n\n"
            "Example:\n"
            "```json\n"
            '{"edits": [{"description": "Add null check", "original_content": "return x.value", "modified_content": "return x?.value ?? null"}]}\n'
            "```"
        )

    def generate_suggested_questions(self, context: dict) -> list[dict]:
        return [
            {"id": str(uuid.uuid4()), "text": "Can you also add error handling?", "contextType": "full_file", "agentTargets": ["coder", "error_handling"]},
            {"id": str(uuid.uuid4()), "text": "Write tests for this change", "contextType": "functions", "agentTargets": ["tester"]},
            {"id": str(uuid.uuid4()), "text": "Review this change for issues", "contextType": "full_file", "agentTargets": ["reviewer"]},
        ]
