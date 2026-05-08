import uuid
from .base_agent import BaseAgent
from parsers.code_parser import ParsedFile


class ReviewerAgent(BaseAgent):
    agent_id = "reviewer"
    agent_name = "Reviewer Agent"

    def build_system_prompt(self, ui_lang: str = "es") -> str:
        return (
            "You are a senior code reviewer. You review proposed code changes for correctness, "
            "maintainability, performance, and adherence to best practices. "
            "You identify bugs, anti-patterns, missing edge cases, and naming issues. "
            "You give actionable feedback with specific line references. "
            f"{self._lang_instruction(ui_lang)}"
        )

    def build_user_prompt(self, context: dict, parsed: ParsedFile) -> str:
        ctx = context.get("context", {})
        content = ctx.get("full_content") or ctx.get("selected_snippet", "")
        file_path = ctx.get("file_path", "unknown")
        summary = self.parser.build_context_summary(parsed)

        return (
            f"Review the following code from `{file_path}`:\n\n"
            f"## Code Summary\n{summary}\n\n"
            f"## Code\n```{parsed.language}\n{self._truncate(content)}\n```\n\n"
            "Review for:\n"
            "1. **Bugs**: Logic errors, null/undefined issues, off-by-one errors\n"
            "2. **Best Practices**: SOLID principles, DRY, naming conventions\n"
            "3. **Performance**: N+1 queries, unnecessary re-renders, memory leaks\n"
            "4. **Security**: Input validation, injection risks, sensitive data exposure\n"
            "5. **Suggestions**: What would you improve and why?"
        )

    def generate_suggested_questions(self, context: dict) -> list[dict]:
        return [
            {"id": str(uuid.uuid4()), "text": "What are the most critical issues to fix?", "contextType": "full_file", "agentTargets": ["reviewer", "error_handling"]},
            {"id": str(uuid.uuid4()), "text": "How would you refactor this code?", "contextType": "full_file", "agentTargets": ["reviewer", "coder"]},
        ]
