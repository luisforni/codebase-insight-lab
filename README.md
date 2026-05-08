# Codebase Insight Lab

Multi-agent code analysis tool with a VSCode-inspired interface. Open any folder, let 9 specialized AI agents analyze it, and get progressive, layered explanations of your codebase.

## Architecture

```
codebase-insight-lab/
├── studio/     # Frontend — React + TypeScript + Vite + Monaco Editor
└── cortex/     # Backend  — FastAPI + Python + 9 AI Agents
```

## Quick Start

### 1. Backend (cortex)

```bash
cd cortex
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac

pip install -r requirements.txt
cp ../.env.example ../.env      # configure your API keys
python main.py
```

Cortex runs on `http://localhost:8000`.

### 2. Frontend (studio)

```bash
cd studio
npm install
npm run dev
```

Studio runs on `http://localhost:5173`.

### 3. LM Studio (local model)

1. Download LM Studio from https://lmstudio.ai
2. Load `Qwen2.5-Coder-32B-GGUF` (or any code model)
3. Start the local server (default: `http://localhost:1234`)

## Features

- **VSCode-like UI** — dark theme, file tree, Monaco editor, tabs, status bar
- **Multi-workspace** — open multiple folders simultaneously (sidebar sections)
- **9 AI Agents**:
  - `Structure` — architecture, design patterns, entry points
  - `Functions` — parameters, return values, control flow
  - `Variables` — state management, data flow, types
  - `Imports` — dependencies, library usage, risks
  - `Business Logic` — domain rules, workflows, validation
  - `Error Handling` — exceptions, edge cases, failure modes
  - `Security` — OWASP vulnerabilities, performance issues
  - `Log Analyst` — log analysis, runtime behavior
  - `Integration` — synthesizes all agents into a unified report
- **Hover Explainer** — hover over any code element → instant AI explanation cached to SQLite
- **Accordion Panel** — responses expand/collapse, one active at a time
- **Suggested Questions** — context-aware follow-up questions per agent
- **Terminal** — run commands and feed output to the Log Analyst agent
- **Multi-model** — switch between LM Studio (local) and cloud APIs (Anthropic, OpenAI, Gemini, Groq)

## Configuration (.env)

```env
# Local LM Studio
LMSTUDIO_BASE_URL=http://localhost:1234/v1
LMSTUDIO_MODEL=qwen2.5-coder-32b-instruct

# Cloud APIs (optional)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
GROQ_API_KEY=gsk_...
```

## Agent Orchestration

```
File Analysis:
  Phase 1 (parallel): Structure + Functions + Variables + Imports
  Phase 2 (parallel): BusinessLogic + ErrorHandling + Security + Logs
  Phase 3 (sequential): Integration (synthesizes all)

Question/Selection: Routes to targeted agents based on context type
Command Output: Routes directly to Log Analyst
```
