import uuid
from .base_agent import BaseAgent
from parsers.code_parser import ParsedFile


class SecurityAgent(BaseAgent):
    agent_id = "security"
    agent_name = "Security Agent"

    def build_system_prompt(self, ui_lang: str = "es") -> str:
        return (
            "You are a senior security engineer and application security specialist. "
            "Your role is to identify security vulnerabilities, performance bottlenecks, "
            "and code quality issues. Reference OWASP Top 10 where applicable. "
            "Be specific about severity (CRITICAL/HIGH/MEDIUM/LOW) and provide remediation advice. "
            f"{self._lang_instruction(ui_lang)}"
        )

    def build_user_prompt(self, context: dict, parsed: ParsedFile) -> str:
        ctx = context.get("context", {})
        content = ctx.get("full_content", "")
        file_path = ctx.get("file_path", "unknown")
        summary = self.parser.build_context_summary(parsed)

        return (
            f"Security & performance review for: `{file_path}`\n\n"
            f"## Context\n{summary}\n\n"
            f"```{parsed.language}\n{self._truncate(content)}\n```\n\n"
            "Review for:\n"
            "**Security**:\n"
            "- SQL injection, XSS, CSRF, path traversal\n"
            "- Hardcoded credentials or secrets\n"
            "- Insecure deserialization\n"
            "- Authentication/authorization flaws\n"
            "- Dependency vulnerabilities\n\n"
            "**Performance**:\n"
            "- N+1 queries, inefficient loops\n"
            "- Memory leaks, unnecessary allocations\n"
            "- Missing caching opportunities\n\n"
            "Rate each finding with severity: CRITICAL / HIGH / MEDIUM / LOW / INFO"
        )

    def generate_suggested_questions(self, context: dict) -> list[dict]:
        return [
            {"id": str(uuid.uuid4()), "text": "Are there any OWASP Top 10 vulnerabilities in this code?", "contextType": "full_file", "agentTargets": ["security"]},
            {"id": str(uuid.uuid4()), "text": "How can performance be improved in this file?", "contextType": "functions", "agentTargets": ["security", "functions"]},
            {"id": str(uuid.uuid4()), "text": "Are there any hardcoded secrets or credentials?", "contextType": "variables", "agentTargets": ["security", "variables"]},
        ]
