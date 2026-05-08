import uuid
from .base_agent import BaseAgent
from parsers.code_parser import ParsedFile


class TesterAgent(BaseAgent):
    agent_id = "tester"
    agent_name = "Tester Agent"

    def build_system_prompt(self, ui_lang: str = "es") -> str:
        return (
            "You are a test engineering expert. You write comprehensive, idiomatic unit tests "
            "for the given code using the appropriate testing framework for the language. "
            "You cover happy paths, edge cases, error conditions, and boundary values. "
            "Tests should be readable, isolated, and deterministic. "
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
            f"## What to test\n{query or 'Generate comprehensive tests for all functions'}\n\n"
            f"## Code Summary\n{summary}\n\n"
            f"## Code\n```{parsed.language}\n{self._truncate(content)}\n```\n\n"
            "Write tests that cover:\n"
            "1. **Happy path**: Normal expected behavior\n"
            "2. **Edge cases**: Empty inputs, nulls, boundaries\n"
            "3. **Error cases**: Expected exceptions and error handling\n"
            "4. **Mocks/stubs**: For external dependencies if needed\n\n"
            "Use the idiomatic test framework for this language (pytest for Python, Jest/Vitest for TS/JS, etc.)"
        )

    def generate_suggested_questions(self, context: dict) -> list[dict]:
        return [
            {"id": str(uuid.uuid4()), "text": "What edge cases are most likely to fail?", "contextType": "functions", "agentTargets": ["tester", "debugger"]},
            {"id": str(uuid.uuid4()), "text": "How would you mock external dependencies?", "contextType": "imports", "agentTargets": ["tester"]},
        ]
