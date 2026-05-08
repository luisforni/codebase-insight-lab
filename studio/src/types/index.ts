

export interface FileNode {
  id: string
  name: string
  path: string
  type: 'file' | 'directory'
  language?: string
  children?: FileNode[]
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle
  isExpanded?: boolean
  isLoading?: boolean
}

export interface Workspace {
  id: string
  name: string
  rootPath: string
  handle: FileSystemDirectoryHandle
  tree: FileNode[]
  addedAt: number
}



export interface EditorTab {
  id: string
  filePath: string
  fileName: string
  language: string
  content: string
  isDirty: boolean
  workspaceId: string
}

export interface CursorPosition {
  line: number
  column: number
}



export interface CodeElement {
  type: 'function' | 'class' | 'variable' | 'import' | 'method' | 'parameter' | 'unknown'
  name: string
  line: number
  column: number
  filePath: string
  snippet: string
}

export interface Explanation {
  id: string
  elementType: CodeElement['type']
  elementName: string
  line: number
  filePath: string
  content: string
  agentSource: string
  modelUsed: string
  timestamp: number
  isCached: boolean
}



export type DepthMode = 'summary' | 'technical' | 'complete' | 'eli5' | 'senior'



export type CodeEditStatus = 'pending' | 'accepted' | 'rejected'

export interface CodeEdit {
  id: string
  filePath: string
  fileName: string
  description: string
  originalContent: string
  modifiedContent: string
  diff: string
  status: CodeEditStatus
  timestamp: number
  agentId: AgentId
}



export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  agentId?: AgentId
  timestamp: number
}

export interface ConversationThread {
  id: string
  title: string
  workspaceId: string
  filePath?: string
  messages: ConversationMessage[]
  createdAt: number
  updatedAt: number
}



export type AgentId =
  | 'structure'
  | 'functions'
  | 'variables'
  | 'imports'
  | 'business_logic'
  | 'error_handling'
  | 'security'
  | 'logs'
  | 'integration'
  | 'planner'
  | 'coder'
  | 'reviewer'
  | 'documenter'
  | 'debugger'
  | 'architect'
  | 'tester'
  | 'summarizer'

export type AgentStatus = 'idle' | 'running' | 'completed' | 'error'

export interface Agent {
  id: AgentId
  name: string
  description: string
  icon: string
  status: AgentStatus
  color: string
}

export interface AgentResponse {
  id: string
  agentId: AgentId
  agentName: string
  query: string
  content: string
  timestamp: number
  isStreaming: boolean
  suggestedQuestions: SuggestedQuestion[]
  contextUsed: AnalysisContext
}

export interface SuggestedQuestion {
  id: string
  text: string
  textKey?: string
  contextType: 'functions' | 'classes' | 'variables' | 'imports' | 'logs' | 'full_file'
  agentTargets: AgentId[]
}



export interface AnalysisContext {
  filePath: string
  workspaceId: string
  fullContent?: string
  selectedSnippet?: string
  functions?: string[]
  classes?: string[]
  variables?: string[]
  imports?: string[]
  logs?: string[]
  projectStructure?: string
}

export interface AnalysisRequest {
  type: 'file' | 'selection' | 'hover' | 'question' | 'command_output'
  context: AnalysisContext
  query?: string
  targetAgents?: AgentId[]
  modelConfig?: ModelConfig
}



export type ModelProvider = 'ollama' | 'anthropic' | 'openai' | 'gemini' | 'groq'

export interface ModelConfig {
  provider: ModelProvider
  modelId: string
  displayName: string
  isLocal: boolean
  maxTokens?: number
  temperature?: number
}



export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    provider: 'ollama',
    modelId: 'qwen25-7b-instruct',
    displayName: 'Qwen2.5 7B Instruct (Ollama)',
    isLocal: true,
    maxTokens: 32768,
  },
  {
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-6',
    displayName: 'Claude Sonnet 4.6',
    isLocal: false,
    maxTokens: 8192,
  },
  {
    provider: 'anthropic',
    modelId: 'claude-haiku-4-5-20251001',
    displayName: 'Claude Haiku 4.5',
    isLocal: false,
    maxTokens: 4096,
  },
  {
    provider: 'openai',
    modelId: 'gpt-4o',
    displayName: 'GPT-4o',
    isLocal: false,
    maxTokens: 8192,
  },
  {
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    isLocal: false,
    maxTokens: 4096,
  },
  {
    provider: 'gemini',
    modelId: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    isLocal: false,
    maxTokens: 8192,
  },
  {
    provider: 'groq',
    modelId: 'llama-3.3-70b-versatile',
    displayName: 'Llama 3.3 70B (Groq)',
    isLocal: false,
    maxTokens: 8192,
  },
  {
    provider: 'groq',
    modelId: 'meta-llama/llama-4-scout-17b-16e-instruct',
    displayName: 'Llama 4 Scout (Groq)',
    isLocal: false,
    maxTokens: 8192,
  },
  {
    provider: 'groq',
    modelId: 'qwen/qwen3-32b',
    displayName: 'Qwen3 32B (Groq)',
    isLocal: false,
    maxTokens: 8192,
  },
]



export type WSEventType =
  | 'analysis_started'
  | 'agent_started'
  | 'agent_chunk'
  | 'agent_completed'
  | 'analysis_completed'
  | 'hover_explanation'
  | 'error'

export interface WSEvent {
  type: WSEventType
  agentId?: AgentId
  agentName?: string
  content?: string
  responseId?: string
  explanation?: Explanation
  error?: string
  suggestedQuestions?: SuggestedQuestion[]
  timestamp: number
}



export interface CommandEntry {
  id: string
  command: string
  output: string
  exitCode: number | null
  timestamp: number
  isRunning: boolean
}

export interface TerminalTab {
  id: string
  name: string
  entries: CommandEntry[]
  isActive: boolean
}



export interface SavedProject {
  id: string
  name: string
  rootPath: string
  workspaceHandleKey: string
  openFilePaths: string[]
  activeFilePath?: string
  conversationIds: string[]
  savedAt: number
  lastOpenedAt: number
}

export interface SessionState {
  activeProjectId?: string
  projects: SavedProject[]
  language: string
}
