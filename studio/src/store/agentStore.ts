import { create } from 'zustand'
import {
  Agent, AgentId, AgentResponse, AgentStatus, ModelConfig,
  AVAILABLE_MODELS, AnalysisRequest, CodeEdit, DepthMode,
} from '../types'

const AGENT_DEFINITIONS: Omit<Agent, 'status'>[] = [
  
  { id: 'structure',      name: 'Structure',      description: 'Maps architecture, modules, entry points and design patterns', icon: '🏗️', color: '#4ec9b0' },
  { id: 'functions',      name: 'Functions',      description: 'Analyzes functions, parameters, return values and logic flow', icon: '⚡', color: '#dcdcaa' },
  { id: 'variables',      name: 'Variables',      description: 'Tracks declarations, scopes, types and data transformations', icon: '📦', color: '#9cdcfe' },
  { id: 'imports',        name: 'Imports',        description: 'Analyzes imports, external deps and library usage patterns', icon: '📥', color: '#c586c0' },
  { id: 'business_logic', name: 'Business Logic', description: 'Identifies business rules, workflows and domain patterns', icon: '🎯', color: '#f28b54' },
  { id: 'error_handling', name: 'Error Handling', description: 'Reviews exceptions, error flows and edge cases', icon: '🛡️', color: '#f44747' },
  { id: 'security',       name: 'Security',       description: 'Identifies vulnerabilities and performance bottlenecks', icon: '🔐', color: '#ff8c00' },
  { id: 'logs',           name: 'Log Analyst',    description: 'Analyzes application logs for runtime behavior', icon: '📋', color: '#6796e6' },
  { id: 'integration',    name: 'Integration',    description: 'Coordinates all agents into cohesive progressive explanations', icon: '🔗', color: '#b5cea8' },
  
  { id: 'planner',        name: 'Planner',        description: 'Breaks tasks into actionable steps and defines approach', icon: '📐', color: '#569cd6' },
  { id: 'coder',          name: 'Coder',          description: 'Generates, refactors and patches code with structured diffs', icon: '✏️', color: '#4ec9b0' },
  { id: 'reviewer',       name: 'Reviewer',       description: 'Reviews proposed changes for correctness and best practices', icon: '👁️', color: '#dcdcaa' },
  { id: 'debugger',       name: 'Debugger',       description: 'Diagnoses errors, traces root causes and proposes fixes', icon: '🐛', color: '#f44747' },
  { id: 'tester',         name: 'Tester',         description: 'Generates unit tests and verifies edge cases', icon: '✅', color: '#b5cea8' },
  
  { id: 'documenter',     name: 'Documenter',     description: 'Writes inline docs, README sections and API references', icon: '📝', color: '#9cdcfe' },
  { id: 'architect',      name: 'Architect',      description: 'Creates architecture diagrams, ADRs and design docs', icon: '🗺️', color: '#c586c0' },
  { id: 'summarizer',     name: 'Summarizer',     description: 'Produces concise summaries and executive-level overviews', icon: '📄', color: '#f28b54' },
]

interface AgentStore {
  agents: Record<AgentId, Agent>
  responses: AgentResponse[]
  activeResponseId: string | null
  selectedModel: ModelConfig
  depthMode: DepthMode
  isAnalyzing: boolean
  pendingRequest: AnalysisRequest | null
  wsConnected: boolean
  codeEdits: CodeEdit[]
  summaryDocument: string

  init: () => void
  setAgentStatus: (agentId: AgentId, status: AgentStatus) => void
  addResponse: (response: AgentResponse) => void
  appendToResponse: (responseId: string, chunk: string) => void
  finalizeResponse: (responseId: string, suggestedQuestions: AgentResponse['suggestedQuestions']) => void
  setActiveResponse: (id: string | null) => void
  setSelectedModel: (model: ModelConfig) => void
  setDepthMode: (mode: DepthMode) => void
  setAnalyzing: (value: boolean) => void
  setPendingRequest: (req: AnalysisRequest | null) => void
  setWsConnected: (v: boolean) => void
  removeResponse: (id: string) => void
  clearResponses: () => void
  setResponses: (responses: AgentResponse[]) => void
  addCodeEdit: (edit: CodeEdit) => void
  acceptCodeEdit: (editId: string) => void
  rejectCodeEdit: (editId: string) => void
  acceptAllCodeEdits: () => void
  rejectAllCodeEdits: () => void
  clearCodeEdits: () => void
  setSummaryDocument: (doc: string) => void
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: {} as Record<AgentId, Agent>,
  responses: [],
  activeResponseId: null,
  selectedModel: AVAILABLE_MODELS[0],
  depthMode: 'technical',
  isAnalyzing: false,
  pendingRequest: null,
  wsConnected: false,
  codeEdits: [],
  summaryDocument: '',

  init: () => set({
    agents: Object.fromEntries(
      AGENT_DEFINITIONS.map(a => [a.id, { ...a, status: 'idle' }])
    ) as Record<AgentId, Agent>,
  }),

  setAgentStatus: (agentId, status) => set(s => ({
    agents: {
      ...s.agents,
      [agentId]: { ...s.agents[agentId], status },
    },
  })),

  addResponse: (response) => set(s => ({
    responses: [response, ...s.responses],
    activeResponseId: response.id,
  })),

  appendToResponse: (responseId, chunk) => set(s => ({
    responses: s.responses.map(r =>
      r.id === responseId ? { ...r, content: r.content + chunk } : r
    ),
  })),

  finalizeResponse: (responseId, suggestedQuestions) => set(s => ({
    responses: s.responses.map(r =>
      r.id === responseId
        ? { ...r, isStreaming: false, suggestedQuestions }
        : r
    ),
  })),

  setActiveResponse: (id) => set({ activeResponseId: id }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setDepthMode: (mode) => set({ depthMode: mode }),
  setAnalyzing: (value) => set({ isAnalyzing: value }),
  setPendingRequest: (req) => set({ pendingRequest: req }),
  setWsConnected: (v) => set({ wsConnected: v }),
  removeResponse: (id) => set(s => {
    const responses = s.responses.filter(r => r.id !== id)
    const activeResponseId = s.activeResponseId === id ? (responses[0]?.id ?? null) : s.activeResponseId
    return { responses, activeResponseId }
  }),
  clearResponses: () => set({ responses: [], activeResponseId: null }),
  setResponses: (responses) => set({ responses, activeResponseId: responses[0]?.id ?? null }),

  addCodeEdit: (edit) => set(s => ({ codeEdits: [...s.codeEdits, edit] })),

  acceptCodeEdit: (editId) => set(s => ({
    codeEdits: s.codeEdits.map(e => e.id === editId ? { ...e, status: 'accepted' } : e),
  })),

  rejectCodeEdit: (editId) => set(s => ({
    codeEdits: s.codeEdits.map(e => e.id === editId ? { ...e, status: 'rejected' } : e),
  })),

  acceptAllCodeEdits: () => set(s => ({
    codeEdits: s.codeEdits.map(e => e.status === 'pending' ? { ...e, status: 'accepted' } : e),
  })),

  rejectAllCodeEdits: () => set(s => ({
    codeEdits: s.codeEdits.map(e => e.status === 'pending' ? { ...e, status: 'rejected' } : e),
  })),

  clearCodeEdits: () => set({ codeEdits: [] }),

  setSummaryDocument: (doc) => set({ summaryDocument: doc }),
}))
