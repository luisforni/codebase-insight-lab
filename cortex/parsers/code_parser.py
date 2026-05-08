"""
Multi-language code parser using regex + Pygments for token classification.
Extracts: imports, functions, classes, variables, and infers element type at a cursor position.
"""
import re
from dataclasses import dataclass, field
from pygments.lexers import get_lexer_by_name, TextLexer, guess_lexer_for_filename
from pygments.token import Token


LANGUAGE_PATTERNS = {
    "python": {
        "imports":   [r"^(?:import|from)\s+(.+)$"],
        "functions": [r"^(?:async\s+)?def\s+(\w+)\s*\("],
        "classes":   [r"^class\s+(\w+)"],
        "variables": [r"^(\w+)\s*(?::[\w\[\], ]+)?\s*=\s*(?!=)"],
    },
    "typescript": {
        "imports":   [r"^import\s+.+\s+from\s+['\"](.+)['\"]", r"^(?:const|let|var)\s+\w+\s*=\s*require\(['\"](.+)['\"]\)"],
        "functions": [r"(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*[\(<]", r"(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\("],
        "classes":   [r"(?:export\s+)?(?:abstract\s+)?class\s+(\w+)"],
        "variables": [r"(?:const|let|var)\s+(\w+)\s*(?::\s*[\w<>[\]|,\s]+)?\s*="],
    },
    "javascript": {
        "imports":   [r"^import\s+.+\s+from\s+['\"](.+)['\"]", r"(?:const|let|var)\s+\w+\s*=\s*require\(['\"](.+)['\"]\)"],
        "functions": [r"(?:async\s+)?function\s+(\w+)\s*\(", r"(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\("],
        "classes":   [r"class\s+(\w+)"],
        "variables": [r"(?:const|let|var)\s+(\w+)\s*="],
    },
    "java": {
        "imports":   [r"^import\s+([\w.]+);"],
        "functions": [r"(?:public|private|protected|static|final|\s)+[\w<>[\]]+\s+(\w+)\s*\("],
        "classes":   [r"(?:public\s+)?(?:abstract\s+)?class\s+(\w+)"],
        "variables": [r"(?:private|public|protected|static|final|\s)+[\w<>[\]]+\s+(\w+)\s*[=;]"],
    },
    "go": {
        "imports":   [r'"([\w./]+)"'],
        "functions": [r"^func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\("],
        "classes":   [r"^type\s+(\w+)\s+struct"],
        "variables": [r"(?:var|const)\s+(\w+)"],
    },
    "rust": {
        "imports":   [r"use\s+([\w:]+)"],
        "functions": [r"(?:pub\s+)?(?:async\s+)?fn\s+(\w+)\s*[\(<]"],
        "classes":   [r"(?:pub\s+)?struct\s+(\w+)", r"(?:pub\s+)?enum\s+(\w+)"],
        "variables": [r"let\s+(?:mut\s+)?(\w+)"],
    },
}

_FALLBACK = {
    "imports":   [r"^(?:import|require|use|include|from|#include)\s+(.+)$"],
    "functions": [r"(?:function|def|fn|func|sub|method)\s+(\w+)"],
    "classes":   [r"(?:class|struct|type|interface|trait)\s+(\w+)"],
    "variables": [r"(?:var|let|const|val|dim)\s+(\w+)"],
}


@dataclass
class ParsedFile:
    language: str
    imports: list[str] = field(default_factory=list)
    functions: list[str] = field(default_factory=list)
    classes: list[str] = field(default_factory=list)
    variables: list[str] = field(default_factory=list)
    line_count: int = 0
    char_count: int = 0


class CodeParser:
    def parse(self, content: str, language: str) -> ParsedFile:
        patterns = LANGUAGE_PATTERNS.get(language, _FALLBACK)
        parsed = ParsedFile(language=language, line_count=len(content.splitlines()), char_count=len(content))

        for line in content.splitlines():
            stripped = line.strip()
            for pat in patterns.get("imports", []):
                m = re.search(pat, stripped)
                if m:
                    parsed.imports.append(m.group(1) if m.lastindex else stripped)
                    break
            for pat in patterns.get("functions", []):
                m = re.search(pat, stripped)
                if m and m.lastindex:
                    parsed.functions.append(m.group(1))
                    break
            for pat in patterns.get("classes", []):
                m = re.search(pat, stripped)
                if m and m.lastindex:
                    parsed.classes.append(m.group(1))
                    break
            for pat in patterns.get("variables", []):
                m = re.search(pat, stripped)
                if m and m.lastindex and m.group(1) not in (parsed.functions + parsed.classes):
                    parsed.variables.append(m.group(1))
                    break

        parsed.imports = list(dict.fromkeys(parsed.imports))
        parsed.functions = list(dict.fromkeys(parsed.functions))
        parsed.classes = list(dict.fromkeys(parsed.classes))
        parsed.variables = list(dict.fromkeys(parsed.variables))

        return parsed

    def get_element_at_position(self, content: str, language: str, line_no: int, col: int) -> dict:
        """Identify the semantic element at a given cursor position."""
        lines = content.splitlines()
        if line_no < 1 or line_no > len(lines):
            return {"type": "unknown", "name": "", "snippet": ""}

        line = lines[line_no - 1]

        try:
            lexer = get_lexer_by_name(language, stripall=True)
        except Exception:
            try:
                lexer = guess_lexer_for_filename(f"file.{language}", line)
            except Exception:
                lexer = TextLexer()

        tokens = list(lexer.get_tokens(line))

        col = min(col - 1, len(line))
        pos = 0
        word_at_cursor = ""
        for ttype, value in tokens:
            end = pos + len(value)
            if pos <= col < end:
                word_at_cursor = value.strip()
                break
            pos = end

        if not word_at_cursor:
            start = col
            while start > 0 and (line[start - 1].isalnum() or line[start - 1] in ('_', '.')):
                start -= 1
            end = col
            while end < len(line) and (line[end].isalnum() or line[end] in ('_', '.')):
                end += 1
            word_at_cursor = line[start:end].strip()

        patterns = LANGUAGE_PATTERNS.get(language, _FALLBACK)
        stripped = line.strip()
        element_type = "unknown"

        for pat in patterns.get("imports", []):
            if re.search(pat, stripped):
                element_type = "import"
                break
        if element_type == "unknown":
            for pat in patterns.get("functions", []):
                if re.search(pat, stripped):
                    element_type = "function"
                    break
        if element_type == "unknown":
            for pat in patterns.get("classes", []):
                if re.search(pat, stripped):
                    element_type = "class"
                    break
        if element_type == "unknown":
            for pat in patterns.get("variables", []):
                if re.search(pat, stripped):
                    element_type = "variable"
                    break

        context_start = max(0, line_no - 3)
        context_end = min(len(lines), line_no + 2)
        snippet = "\n".join(lines[context_start:context_end])

        return {
            "type": element_type,
            "name": word_at_cursor or "unknown",
            "snippet": snippet,
            "line": line_no,
        }

    def build_context_summary(self, parsed: ParsedFile, max_items: int = 20) -> str:
        parts = [f"Language: {parsed.language}", f"Lines: {parsed.line_count}"]
        if parsed.imports:
            parts.append(f"Imports ({len(parsed.imports)}): {', '.join(parsed.imports[:max_items])}")
        if parsed.classes:
            parts.append(f"Classes ({len(parsed.classes)}): {', '.join(parsed.classes[:max_items])}")
        if parsed.functions:
            parts.append(f"Functions ({len(parsed.functions)}): {', '.join(parsed.functions[:max_items])}")
        if parsed.variables:
            parts.append(f"Key variables ({len(parsed.variables)}): {', '.join(parsed.variables[:max_items])}")
        return "\n".join(parts)
