import uuid
from .base_agent import BaseAgent
from parsers.code_parser import ParsedFile


class StructureAgent(BaseAgent):
    agent_id = "structure"
    agent_name = "Structure Agent"

    def build_system_prompt(self, ui_lang: str = "es") -> str:
        return (
            "You are a senior software architect specialized in codebase analysis. "
            "Your role is to map and explain the overall architecture, module relationships, "
            "design patterns, entry points, and how different parts connect. "
            "Be concise but thorough. Use bullet points and headers for clarity. "
            "Focus on the 'big picture' — what is this code's purpose and how is it organized?"
            f" {self._lang_instruction(ui_lang)}")

    def build_user_prompt(self, context: dict, parsed: ParsedFile) -> str:
        ctx = context.get("context", {})
        content = ctx.get("full_content") or ctx.get("selected_snippet", "")
        file_path = ctx.get("file_path", "unknown")
        summary = self.parser.build_context_summary(parsed)

        return (
            f"Analyze the structure of this file: `{file_path}`\n\n"
            f"## Code Summary\n{summary}\n\n"
            f"## Full Code\n```{parsed.language}\n{self._truncate(content)}\n```\n\n"
            "Provide:\n"
            "1. **Purpose**: What does this file/module do?\n"
            "2. **Architecture**: How is it organized (layers, patterns, modules)?\n"
            "3. **Entry Points**: Where does execution start?\n"
            "4. **Key Dependencies**: What does this depend on?\n"
            "5. **Design Patterns**: What patterns are used (singleton, factory, observer, etc.)?"
        )

    def generate_suggested_questions(self, context: dict) -> list[dict]:
        return [
            {"id": str(uuid.uuid4()), "text": "What design patterns are used and why?", "contextType": "full_file", "agentTargets": ["structure", "business_logic"]},
            {"id": str(uuid.uuid4()), "text": "How do the modules interact with each other?", "contextType": "imports", "agentTargets": ["structure", "imports"]},
            {"id": str(uuid.uuid4()), "text": "What are the main entry points of this code?", "contextType": "functions", "agentTargets": ["structure", "functions"]},
        ]
