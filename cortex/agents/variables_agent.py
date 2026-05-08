import uuid
from .base_agent import BaseAgent
from parsers.code_parser import ParsedFile


class VariablesAgent(BaseAgent):
    agent_id = "variables"
    agent_name = "Variables Agent"

    def build_system_prompt(self, ui_lang: str = "es") -> str:
        return (
            "You are a code analyst specialized in data and state analysis. "
            "Your role is to trace variable declarations, scopes, type definitions, "
            "data transformations, and state management patterns. "
            "Identify global vs local state, mutable vs immutable data, and data flow."
            f" {self._lang_instruction(ui_lang)}")

    def build_user_prompt(self, context: dict, parsed: ParsedFile) -> str:
        ctx = context.get("context", {})
        content = ctx.get("full_content", "")
        file_path = ctx.get("file_path", "unknown")
        var_list = ", ".join(parsed.variables[:30]) if parsed.variables else "none detected"

        return (
            f"Analyze variables and data state in: `{file_path}`\n\n"
            f"**Detected variables/constants**: {var_list}\n\n"
            f"```{parsed.language}\n{self._truncate(content)}\n```\n\n"
            "Explain:\n"
            "1. **Key variables**: What are the most important variables and their purpose?\n"
            "2. **Data flow**: How does data flow through the code?\n"
            "3. **State management**: Is there global/shared state? How is it managed?\n"
            "4. **Types**: What types/interfaces are defined?\n"
            "5. **Potential issues**: Any variables that look risky (globals, mutations, etc.)?"
        )

    def generate_suggested_questions(self, context: dict) -> list[dict]:
        return [
            {"id": str(uuid.uuid4()), "text": "Are there any global state management concerns?", "contextType": "variables", "agentTargets": ["variables", "security"]},
            {"id": str(uuid.uuid4()), "text": "How is data transformed throughout the code?", "contextType": "variables", "agentTargets": ["variables", "functions"]},
        ]
