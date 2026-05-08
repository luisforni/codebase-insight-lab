import uuid
from .base_agent import BaseAgent
from parsers.code_parser import ParsedFile


class FunctionsAgent(BaseAgent):
    agent_id = "functions"
    agent_name = "Functions Agent"

    def build_system_prompt(self, ui_lang: str = "es") -> str:
        return (
            "You are a code analyst specialized in function and method analysis. "
            "Your role is to dissect individual functions: their purpose, parameters, "
            "return values, side effects, and control flow. "
            "Be precise and technical. Use code snippets where helpful. "
            "Identify the most important functions and explain them in detail."
            f" {self._lang_instruction(ui_lang)}")

    def build_user_prompt(self, context: dict, parsed: ParsedFile) -> str:
        ctx = context.get("context", {})
        content = ctx.get("selected_snippet") or ctx.get("full_content", "")
        file_path = ctx.get("file_path", "unknown")
        fn_list = ", ".join(parsed.functions[:30]) if parsed.functions else "none detected"

        return (
            f"Analyze all functions/methods in: `{file_path}`\n\n"
            f"**Detected functions**: {fn_list}\n\n"
            f"```{parsed.language}\n{self._truncate(content)}\n```\n\n"
            "For the top 5 most important functions, explain:\n"
            "- **Purpose**: What does this function do?\n"
            "- **Parameters**: What does it accept and why?\n"
            "- **Returns**: What does it return?\n"
            "- **Side effects**: Does it modify state, I/O, etc.?\n"
            "- **Complexity**: Is it simple, medium, or complex? Any concerns?"
        )

    def generate_suggested_questions(self, context: dict) -> list[dict]:
        return [
            {"id": str(uuid.uuid4()), "text": "Which functions have the highest complexity and risk?", "contextType": "functions", "agentTargets": ["functions", "error_handling"]},
            {"id": str(uuid.uuid4()), "text": "Are there any functions that should be refactored?", "contextType": "functions", "agentTargets": ["functions", "security"]},
            {"id": str(uuid.uuid4()), "text": "How do these functions handle edge cases?", "contextType": "functions", "agentTargets": ["functions", "error_handling"]},
        ]
