import uuid
from .base_agent import BaseAgent
from parsers.code_parser import ParsedFile


class IntegrationAgent(BaseAgent):
    agent_id = "integration"
    agent_name = "Integration Agent"

    def __init__(self, model, previous_analyses: dict | None = None):
        super().__init__(model)
        self.previous_analyses = previous_analyses or {}

    def build_system_prompt(self, ui_lang: str = "es") -> str:
        return (
            "You are a principal engineer synthesizing multiple code analyses into a coherent picture. "
            "Your role is to combine insights from structure, functions, variables, imports, business logic, "
            "error handling, security, and logs analyses into a unified, progressive explanation. "
            "Highlight connections between different aspects. Provide an executive summary "
            "and prioritized action items."
            f" {self._lang_instruction(ui_lang)}")

    def build_user_prompt(self, context: dict, parsed: ParsedFile) -> str:
        ctx = context.get("context", {})
        file_path = ctx.get("file_path", "unknown")
        summary = self.parser.build_context_summary(parsed)

        analyses_text = ""
        for agent_id, analysis in self.previous_analyses.items():
            if analysis:
                analyses_text += f"\n### {agent_id.replace('_', ' ').title()} Analysis\n{analysis[:2000]}\n"

        return (
            f"Synthesize all analyses for: `{file_path}`\n\n"
            f"## Code Summary\n{summary}\n\n"
            f"## Previous Agent Analyses\n{analyses_text}\n\n"
            "Create a unified report:\n"
            "1. **Executive Summary**: 3-5 sentences on what this code is and its overall quality\n"
            "2. **Key Insights**: Most important findings across all analyses\n"
            "3. **Connections**: How do different parts relate to each other?\n"
            "4. **Risk Assessment**: Overall risk level (Critical/High/Medium/Low)\n"
            "5. **Priority Actions**: Top 3-5 things to address, ordered by impact\n"
            "6. **Learning Path**: For someone new to this code, what should they study first?"
        )

    def generate_suggested_questions(self, context: dict) -> list[dict]:
        return [
            {"id": str(uuid.uuid4()), "text": "What's the most critical thing to fix first?", "contextType": "full_file", "agentTargets": ["integration", "security", "error_handling"]},
            {"id": str(uuid.uuid4()), "text": "How would you refactor this code?", "contextType": "full_file", "agentTargets": ["structure", "functions"]},
            {"id": str(uuid.uuid4()), "text": "What tests should be written for this code?", "contextType": "functions", "agentTargets": ["functions", "error_handling"]},
        ]
