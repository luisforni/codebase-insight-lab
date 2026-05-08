import uuid
from .base_agent import BaseAgent
from parsers.code_parser import ParsedFile


class ArchitectAgent(BaseAgent):
    agent_id = "architect"
    agent_name = "Architect Agent"

    def build_system_prompt(self, ui_lang: str = "es") -> str:
        return (
            "You are a senior software architect with deep expertise in system design. "
            "You produce architectural documentation: component diagrams (text-based), "
            "Architecture Decision Records (ADRs), design docs, and improvement proposals. "
            "You identify architectural patterns, coupling, cohesion, and scalability concerns. "
            f"{self._lang_instruction(ui_lang)}"
        )

    def build_user_prompt(self, context: dict, parsed: ParsedFile) -> str:
        ctx = context.get("context", {})
        content = ctx.get("full_content") or ctx.get("selected_snippet", "")
        file_path = ctx.get("file_path", "unknown")
        query = context.get("query", "")
        summary = self.parser.build_context_summary(parsed)

        return (
            f"Architectural analysis of `{file_path}`:\n\n"
            f"## Focus\n{query or 'Analyze overall architecture and provide improvement recommendations'}\n\n"
            f"## Code Summary\n{summary}\n\n"
            f"## Code\n```{parsed.language}\n{self._truncate(content)}\n```\n\n"
            "Provide:\n"
            "1. **Component Diagram**: ASCII/text representation of modules and relationships\n"
            "2. **Architectural Patterns**: What patterns are applied (MVC, CQRS, hexagonal, etc.)?\n"
            "3. **Coupling & Cohesion**: Analysis of dependencies and separation of concerns\n"
            "4. **ADR**: Key architectural decisions and their rationale\n"
            "5. **Recommendations**: How to improve the architecture"
        )

    def generate_suggested_questions(self, context: dict) -> list[dict]:
        return [
            {"id": str(uuid.uuid4()), "text": "What architectural improvements would you recommend?", "contextType": "full_file", "agentTargets": ["architect", "structure"]},
            {"id": str(uuid.uuid4()), "text": "How does this fit into the overall system design?", "contextType": "imports", "agentTargets": ["architect", "integration"]},
        ]
