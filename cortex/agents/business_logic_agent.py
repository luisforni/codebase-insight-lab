import uuid
from .base_agent import BaseAgent
from parsers.code_parser import ParsedFile


class BusinessLogicAgent(BaseAgent):
    agent_id = "business_logic"
    agent_name = "Business Logic Agent"

    def build_system_prompt(self, ui_lang: str = "es") -> str:
        return (
            "You are a business analyst with deep technical expertise. "
            "Your role is to identify and interpret business rules, domain logic, workflows, "
            "validation rules, and business-specific patterns embedded in the code. "
            "Translate technical implementation into business meaning. "
            "Identify what PROBLEM this code is solving for end users or the business."
            f" {self._lang_instruction(ui_lang)}")

    def build_user_prompt(self, context: dict, parsed: ParsedFile) -> str:
        ctx = context.get("context", {})
        content = ctx.get("full_content", "")
        file_path = ctx.get("file_path", "unknown")
        summary = self.parser.build_context_summary(parsed)

        return (
            f"Identify business logic in: `{file_path}`\n\n"
            f"## Context\n{summary}\n\n"
            f"```{parsed.language}\n{self._truncate(content)}\n```\n\n"
            "Explain:\n"
            "1. **Business domain**: What domain is this code part of (e-commerce, fintech, healthcare, etc.)?\n"
            "2. **Business rules**: What rules/constraints does this code enforce?\n"
            "3. **Workflows**: What business process does this code implement?\n"
            "4. **Validations**: What business validations are present?\n"
            "5. **Value proposition**: What problem does this solve for users/business?"
        )

    def generate_suggested_questions(self, context: dict) -> list[dict]:
        return [
            {"id": str(uuid.uuid4()), "text": "What business rules could cause issues in edge cases?", "contextType": "full_file", "agentTargets": ["business_logic", "error_handling"]},
            {"id": str(uuid.uuid4()), "text": "Are the business validations complete and correct?", "contextType": "functions", "agentTargets": ["business_logic", "security"]},
            {"id": str(uuid.uuid4()), "text": "What domain events or side effects does this trigger?", "contextType": "full_file", "agentTargets": ["business_logic", "logs"]},
        ]
