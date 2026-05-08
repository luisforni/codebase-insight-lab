import uuid
from .base_agent import BaseAgent
from parsers.code_parser import ParsedFile


class SummarizerAgent(BaseAgent):
    agent_id = "summarizer"
    agent_name = "Summarizer Agent"

    def build_system_prompt(self, ui_lang: str = "es") -> str:
        return (
            "You are an expert at producing clear, executive-level technical summaries. "
            "You synthesize complex code into concise, well-structured documents. "
            "You produce repository analysis documents with sections for overview, "
            "key components, technology stack, data flow, and developer onboarding. "
            f"{self._lang_instruction(ui_lang)}"
        )

    def build_user_prompt(self, context: dict, parsed: ParsedFile) -> str:
        ctx = context.get("context", {})
        content = ctx.get("full_content") or ctx.get("selected_snippet", "")
        file_path = ctx.get("file_path", "unknown")
        query = context.get("query", "")
        summary = self.parser.build_context_summary(parsed)

        return (
            f"Generate a comprehensive summary document for `{file_path}`:\n\n"
            f"## Focus\n{query or 'Complete technical summary suitable for onboarding and documentation'}\n\n"
            f"## Code Summary\n{summary}\n\n"
            f"## Code\n```{parsed.language}\n{self._truncate(content)}\n```\n\n"
            "Produce a Markdown document with:\n"
            "# Overview\n"
            "Brief description of what this module does and its role in the system.\n\n"
            "# Key Components\n"
            "Main classes, functions, and their responsibilities.\n\n"
            "# Data Flow\n"
            "How data moves through the code.\n\n"
            "# Dependencies\n"
            "External libraries and internal modules used.\n\n"
            "# Developer Notes\n"
            "Important details for someone working with this code."
        )

    def generate_suggested_questions(self, context: dict) -> list[dict]:
        return [
            {"id": str(uuid.uuid4()), "text": "Create an onboarding guide for new developers", "contextType": "full_file", "agentTargets": ["summarizer", "documenter"]},
            {"id": str(uuid.uuid4()), "text": "What are the key concepts a developer must know?", "contextType": "full_file", "agentTargets": ["summarizer", "structure"]},
        ]
