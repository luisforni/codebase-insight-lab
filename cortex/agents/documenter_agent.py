import uuid
from .base_agent import BaseAgent
from parsers.code_parser import ParsedFile


class DocumenterAgent(BaseAgent):
    agent_id = "documenter"
    agent_name = "Documenter Agent"

    def build_system_prompt(self, ui_lang: str = "es") -> str:
        return (
            "You are a technical writer and documentation expert. "
            "You write clear, accurate, and concise documentation for code. "
            "You produce inline docstrings, JSDoc/TSDoc comments, README sections, "
            "and API reference documentation in the appropriate format for the language. "
            f"{self._lang_instruction(ui_lang)}"
        )

    def build_user_prompt(self, context: dict, parsed: ParsedFile) -> str:
        ctx = context.get("context", {})
        content = ctx.get("full_content") or ctx.get("selected_snippet", "")
        file_path = ctx.get("file_path", "unknown")
        query = context.get("query", "")
        summary = self.parser.build_context_summary(parsed)

        return (
            f"Document the code in `{file_path}`:\n\n"
            f"## Focus\n{query or 'Document all public functions, classes, and key variables'}\n\n"
            f"## Code Summary\n{summary}\n\n"
            f"## Code\n```{parsed.language}\n{self._truncate(content)}\n```\n\n"
            "Provide:\n"
            "1. **File Overview**: Module-level docstring/comment\n"
            "2. **Function Docs**: For each function — purpose, parameters, return value, exceptions\n"
            "3. **Class Docs**: Purpose, attributes, usage example\n"
            "4. **Usage Example**: How to use the main functionality"
        )

    def generate_suggested_questions(self, context: dict) -> list[dict]:
        return [
            {"id": str(uuid.uuid4()), "text": "Generate a README section for this module", "contextType": "full_file", "agentTargets": ["documenter", "summarizer"]},
            {"id": str(uuid.uuid4()), "text": "What are the public API surface areas?", "contextType": "functions", "agentTargets": ["documenter", "structure"]},
        ]
