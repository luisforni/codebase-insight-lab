from abc import ABC, abstractmethod
from typing import Callable, Awaitable
import uuid
import time

from models.base_model import BaseModel
from parsers.code_parser import CodeParser, ParsedFile

SendFn = Callable[[dict], Awaitable[None]]

QUESTION_KEYS: dict[str, str] = {
    "Which functions have the highest complexity and risk?": "q.functions.complexity",
    "Are there any functions that should be refactored?": "q.functions.refactor",
    "How do these functions handle edge cases?": "q.functions.edgeCases",
    "What tests should be written for this code?": "q.functions.tests",
    "What are the main entry points of this code?": "q.functions.entryPoints",
    "How can performance be improved in this file?": "q.functions.performance",
    "Are there any global state management concerns?": "q.variables.stateConcerns",
    "Are there any hardcoded secrets or credentials?": "q.variables.secrets",
    "How is data transformed throughout the code?": "q.variables.dataTransform",
    "What is the full dependency graph of this module?": "q.imports.depGraph",
    "Are there any vulnerable or outdated dependencies?": "q.imports.vulnerableDeps",
    "Can any dependencies be removed or replaced?": "q.imports.removeDeps",
    "How do the modules interact with each other?": "q.imports.moduleInteraction",
    "How would you mock external dependencies?": "q.imports.mockDeps",
    "How does this fit into the overall system design?": "q.imports.systemDesign",
    "What design patterns are used and why?": "q.structure.designPatterns",
    "What are the most critical unhandled failure scenarios?": "q.errorHandling.criticalScenarios",
    "How should the error handling be improved?": "q.errorHandling.improve",
    "Are the business validations complete and correct?": "q.businessLogic.validations",
    "What business rules could cause issues in edge cases?": "q.businessLogic.edgeCases",
    "What domain events or side effects does this trigger?": "q.businessLogic.events",
    "Are there any OWASP Top 10 vulnerabilities in this code?": "q.security.owasp",
    "Analyze the error patterns in the logs": "q.logs.errorPatterns",
    "What log statements are missing from critical paths?": "q.logs.missingLogs",
    "What's the most critical thing to fix first?": "q.integration.criticalFix",
    "What are the main risks of this implementation?": "q.planner.risks",
    "Which existing functions need to be modified?": "q.planner.functions",
    "Can you also add error handling?": "q.coder.addErrorHandling",
    "Write tests for this change": "q.coder.writeTests",
    "Review this change for issues": "q.coder.review",
    "How would you refactor this code?": "q.reviewer.refactor",
    "What are the most critical issues to fix?": "q.reviewer.criticalIssues",
    "Are there similar bugs elsewhere in this file?": "q.debugger.similarBugs",
    "Write a test that catches this bug": "q.debugger.writeTest",
    "What edge cases are most likely to fail?": "q.tester.edgeCases",
    "What are the public API surface areas?": "q.documenter.apiSurface",
    "Generate a README section for this module": "q.documenter.readme",
    "What architectural improvements would you recommend?": "q.architect.improvements",
    "What are the key concepts a developer must know?": "q.summarizer.keyConcepts",
    "Create an onboarding guide for new developers": "q.summarizer.onboarding",
    "How would you refactor this code?": "q.reviewer.refactor",
    "What are the main risks of this implementation?": "q.planner.risks",
    "What are the key concepts a developer must know?": "q.summarizer.keyConcepts",
}


class BaseAgent(ABC):
    agent_id: str
    agent_name: str

    def __init__(self, model: BaseModel):
        self.model = model
        self.parser = CodeParser()

    LANG_INSTRUCTIONS: dict[str, str] = {
        "es": "Responde siempre en español.",
        "en": "Always respond in English.",
        "de": "Antworte immer auf Deutsch.",
        "fr": "Réponds toujours en français.",
        "it": "Rispondi sempre in italiano.",
        "pt": "Responda sempre em português.",
        "zh": "始终用中文回复。",
        "ja": "常に日本語で回答してください。",
        "ru": "Всегда отвечай на русском языке.",
        "ar": "أجب دائماً باللغة العربية.",
    }

    @abstractmethod
    def build_system_prompt(self, ui_lang: str = "es") -> str: ...

    @abstractmethod
    def build_user_prompt(self, context: dict, parsed: ParsedFile) -> str: ...

    @abstractmethod
    def generate_suggested_questions(self, context: dict) -> list[dict]: ...

    DEPTH_INSTRUCTIONS: dict[str, str] = {
        "summary": (
            "RESPONSE FORMAT: Be brief. 3-5 bullet points maximum. "
            "Skip preamble and conclusion. No code examples unless the entire answer is a snippet. "
            "Prioritize the single most important finding only."
        ),
        "technical": (
            "RESPONSE FORMAT: Detailed technical analysis with code snippets where helpful. "
            "Cover implementation details, specific issues, and concrete recommendations."
        ),
        "complete": (
            "RESPONSE FORMAT: Exhaustive analysis — cover every relevant aspect. "
            "Include code examples, edge cases, performance implications, security notes, "
            "and actionable recommendations for each finding. Be thorough."
        ),
        "eli5": (
            "RESPONSE FORMAT: Explain as if to someone with NO programming experience. "
            "Use plain language, real-world analogies, avoid jargon. Keep a friendly tone. "
            "If you must use a technical term, define it immediately after."
        ),
        "senior": (
            "RESPONSE FORMAT: Speak directly to a senior engineer. Skip the basics. "
            "Focus on non-obvious trade-offs, architectural implications, and subtle risks. "
            "Use industry terminology freely. Jump straight to the nuances."
        ),
    }

    DEPTH_MAX_TOKENS: dict[str, int] = {
        "summary":   600,
        "technical": 2048,
        "complete":  4096,
        "eli5":      1200,
        "senior":    2048,
    }

    def _lang_instruction(self, ui_lang: str) -> str:
        return self.LANG_INSTRUCTIONS.get(ui_lang, self.LANG_INSTRUCTIONS["en"])

    def _depth_instruction(self, depth: str) -> str:
        return self.DEPTH_INSTRUCTIONS.get(depth, self.DEPTH_INSTRUCTIONS["technical"])

    async def run(self, context: dict, send: SendFn, max_tokens: int = 0) -> str:
        response_id = str(uuid.uuid4())
        now = int(time.time() * 1000)
        ui_lang = context.get("ui_lang", "es")
        depth = context.get("depth", "technical")
        effective_max_tokens = max_tokens or self.DEPTH_MAX_TOKENS.get(depth, 2048)

        await send({
            "type": "agent_started",
            "agentId": self.agent_id,
            "agentName": self.agent_name,
            "responseId": response_id,
            "timestamp": now,
        })

        ctx = context.get("context", {})
        language = self._detect_language(ctx.get("file_path", ""))
        content = ctx.get("full_content") or ctx.get("selected_snippet", "")
        parsed = self.parser.parse(content, language) if content else ParsedFile(language=language)

        system = self.build_system_prompt(ui_lang) + "\n\n" + self._depth_instruction(depth)
        user = self.build_user_prompt(context, parsed)
        full_response = ""

        try:
            async for chunk in self.model.stream(system, user, effective_max_tokens):
                full_response += chunk
                await send({
                    "type": "agent_chunk",
                    "agentId": self.agent_id,
                    "responseId": response_id,
                    "content": chunk,
                    "timestamp": int(time.time() * 1000),
                })
        except Exception as e:
            full_response = f"⚠️ Agent error: {e}"
            await send({
                "type": "agent_chunk",
                "agentId": self.agent_id,
                "responseId": response_id,
                "content": full_response,
                "timestamp": int(time.time() * 1000),
            })

        questions = self.generate_suggested_questions(context)
        for q in questions:
            if "text_key" not in q and q.get("text") in QUESTION_KEYS:
                q["text_key"] = QUESTION_KEYS[q["text"]]
        await send({
            "type": "agent_completed",
            "agentId": self.agent_id,
            "responseId": response_id,
            "suggestedQuestions": questions,
            "timestamp": int(time.time() * 1000),
        })

        return full_response

    def _detect_language(self, file_path: str) -> str:
        EXT_MAP = {
            "ts": "typescript", "tsx": "typescript", "js": "javascript", "jsx": "javascript",
            "py": "python", "rs": "rust", "go": "go", "java": "java", "kt": "kotlin",
            "cpp": "cpp", "c": "c", "cs": "csharp", "rb": "ruby", "php": "php",
            "swift": "swift", "scala": "scala", "sh": "shell", "sql": "sql",
        }
        ext = file_path.rsplit(".", 1)[-1].lower() if "." in file_path else ""
        return EXT_MAP.get(ext, "plaintext")

    def _truncate(self, text: str, max_chars: int = 12000) -> str:
        if len(text) <= max_chars:
            return text
        half = max_chars // 2
        return text[:half] + "\n...[truncated]...\n" + text[-half:]
