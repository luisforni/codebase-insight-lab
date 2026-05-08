import uuid
from .base_agent import BaseAgent
from parsers.code_parser import ParsedFile


class LogsAgent(BaseAgent):
    agent_id = "logs"
    agent_name = "Log Analyst Agent"

    def build_system_prompt(self, ui_lang: str = "es") -> str:
        return (
            "You are a site reliability engineer (SRE) specialized in log analysis. "
            "Your role is to interpret application logs, identify patterns, errors, "
            "anomalies, and runtime behavior. When given command output, explain what happened "
            "and what it means. Identify trends, warnings, and actionable insights. "
            f"{self._lang_instruction(ui_lang)}"
        )

    def build_user_prompt(self, context: dict, parsed: ParsedFile) -> str:
        ctx = context.get("context", {})
        query = context.get("query", "")
        logs = ctx.get("logs", [])
        file_path = ctx.get("file_path", "unknown")
        content = ctx.get("full_content", "")

        if query and len(query) > 100:
            return (
                f"Analyze this command output/logs from: `{file_path}`\n\n"
                f"```\n{self._truncate(query, 6000)}\n```\n\n"
                "Provide:\n"
                "1. **Summary**: What happened in plain English?\n"
                "2. **Errors/Warnings**: List any errors or warnings found\n"
                "3. **Root cause**: If there are errors, what likely caused them?\n"
                "4. **Next steps**: What should the developer do next?\n"
                "5. **Metrics**: Any performance metrics visible in the output?"
            )

        log_section = "\n".join(logs[:50]) if logs else "No logs provided"
        return (
            f"Analyze logging behavior in: `{file_path}`\n\n"
            f"**Log statements found**:\n{log_section}\n\n"
            f"```{parsed.language}\n{self._truncate(content, 6000)}\n```\n\n"
            "Explain:\n"
            "1. **Logging strategy**: What events are logged and at what levels?\n"
            "2. **Missing logs**: What important events should be logged but aren't?\n"
            "3. **Log quality**: Are log messages descriptive enough for debugging?\n"
            "4. **Observability**: Can you diagnose issues from these logs alone?"
        )

    def generate_suggested_questions(self, context: dict) -> list[dict]:
        return [
            {"id": str(uuid.uuid4()), "text": "What log statements are missing from critical paths?", "contextType": "full_file", "agentTargets": ["logs"]},
            {"id": str(uuid.uuid4()), "text": "Analyze the error patterns in the logs", "contextType": "logs", "agentTargets": ["logs", "error_handling"]},
        ]
