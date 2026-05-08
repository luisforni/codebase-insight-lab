import uuid
from .base_agent import BaseAgent
from parsers.code_parser import ParsedFile


class DebuggerAgent(BaseAgent):
    agent_id = "debugger"
    agent_name = "Debugger Agent"

    def build_system_prompt(self, ui_lang: str = "es") -> str:
        return (
            "You are an expert debugger. Given code and an error description or symptom, "
            "you trace the root cause, explain what went wrong, and propose a fix. "
            "You think through execution flow step by step. "
            "You explain WHY the bug happens and HOW the fix prevents it. "
            f"{self._lang_instruction(ui_lang)}"
        )

    def build_user_prompt(self, context: dict, parsed: ParsedFile) -> str:
        ctx = context.get("context", {})
        content = ctx.get("full_content") or ctx.get("selected_snippet", "")
        file_path = ctx.get("file_path", "unknown")
        query = context.get("query", "")
        summary = self.parser.build_context_summary(parsed)

        return (
            f"File: `{file_path}`\n\n"
            f"## Problem / Error\n{query or 'No specific error provided — review for potential bugs'}\n\n"
            f"## Code Summary\n{summary}\n\n"
            f"## Code\n```{parsed.language}\n{self._truncate(content)}\n```\n\n"
            "Debug this code:\n"
            "1. **Root Cause**: What exactly is wrong?\n"
            "2. **Execution Flow**: How does the bug manifest?\n"
            "3. **Fix**: What change resolves it?\n"
            "4. **Prevention**: How to avoid similar bugs?"
        )

    def generate_suggested_questions(self, context: dict) -> list[dict]:
        return [
            {"id": str(uuid.uuid4()), "text": "Are there similar bugs elsewhere in this file?", "contextType": "full_file", "agentTargets": ["debugger", "error_handling"]},
            {"id": str(uuid.uuid4()), "text": "Write a test that catches this bug", "contextType": "functions", "agentTargets": ["tester"]},
        ]
