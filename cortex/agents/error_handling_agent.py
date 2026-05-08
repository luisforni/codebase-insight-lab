import uuid
from .base_agent import BaseAgent
from parsers.code_parser import ParsedFile


class ErrorHandlingAgent(BaseAgent):
    agent_id = "error_handling"
    agent_name = "Error Handling Agent"

    def build_system_prompt(self, ui_lang: str = "es") -> str:
        return (
            "You are a reliability engineer specializing in error analysis. "
            "Your role is to review exception handling, error flows, edge cases, "
            "failure modes, and recovery strategies. "
            "Identify what can go wrong, what IS handled, and what is missing. "
            "Be direct about risks."
            f" {self._lang_instruction(ui_lang)}")

    def build_user_prompt(self, context: dict, parsed: ParsedFile) -> str:
        ctx = context.get("context", {})
        content = ctx.get("full_content", "")
        file_path = ctx.get("file_path", "unknown")

        return (
            f"Review error handling in: `{file_path}`\n\n"
            f"```{parsed.language}\n{self._truncate(content)}\n```\n\n"
            "Analyze:\n"
            "1. **Exception handling**: What errors/exceptions are caught and how?\n"
            "2. **Unhandled cases**: What errors could occur that aren't handled?\n"
            "3. **Error propagation**: How do errors bubble up?\n"
            "4. **Edge cases**: What edge cases exist (null values, empty arrays, race conditions)?\n"
            "5. **Recovery**: Are there retry mechanisms, fallbacks, or circuit breakers?\n"
            "6. **Risk level**: Overall error handling quality (🔴 poor / 🟡 medium / 🟢 good)"
        )

    def generate_suggested_questions(self, context: dict) -> list[dict]:
        return [
            {"id": str(uuid.uuid4()), "text": "What are the most critical unhandled failure scenarios?", "contextType": "functions", "agentTargets": ["error_handling", "security"]},
            {"id": str(uuid.uuid4()), "text": "How should the error handling be improved?", "contextType": "full_file", "agentTargets": ["error_handling"]},
        ]
