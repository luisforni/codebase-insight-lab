import uuid
from .base_agent import BaseAgent
from parsers.code_parser import ParsedFile


class ImportsAgent(BaseAgent):
    agent_id = "imports"
    agent_name = "Imports Agent"

    def build_system_prompt(self, ui_lang: str = "es") -> str:
        return (
            "You are a dependency and ecosystem analyst. "
            "Your role is to analyze all imports, external dependencies, and library usage. "
            "Explain what each major library does, why it's likely used, potential version issues, "
            "and the overall dependency footprint. Flag any unusual or potentially risky dependencies."
            f" {self._lang_instruction(ui_lang)}")

    def build_user_prompt(self, context: dict, parsed: ParsedFile) -> str:
        ctx = context.get("context", {})
        content = ctx.get("full_content", "")
        file_path = ctx.get("file_path", "unknown")
        imports = "\n".join(f"- {i}" for i in parsed.imports[:50]) if parsed.imports else "- none detected"

        return (
            f"Analyze imports and dependencies in: `{file_path}`\n\n"
            f"**Detected imports**:\n{imports}\n\n"
            f"```{parsed.language}\n{self._truncate(content, 6000)}\n```\n\n"
            "Provide:\n"
            "1. **External libraries**: What 3rd-party libs are used and their purpose?\n"
            "2. **Internal dependencies**: What internal modules are imported?\n"
            "3. **Usage patterns**: Are imports used correctly (tree-shaking, lazy loading, etc.)?\n"
            "4. **Risks**: Any deprecated, unmaintained, or security-concerning dependencies?\n"
            "5. **Dependency graph**: How do these deps relate to each other?"
        )

    def generate_suggested_questions(self, context: dict) -> list[dict]:
        return [
            {"id": str(uuid.uuid4()), "text": "Are there any vulnerable or outdated dependencies?", "contextType": "imports", "agentTargets": ["imports", "security"]},
            {"id": str(uuid.uuid4()), "text": "Can any dependencies be removed or replaced?", "contextType": "imports", "agentTargets": ["imports"]},
            {"id": str(uuid.uuid4()), "text": "What is the full dependency graph of this module?", "contextType": "imports", "agentTargets": ["imports", "structure"]},
        ]
