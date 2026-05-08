import { WSEvent, AgentId, CodeEdit } from '../types'
import { useAgentStore } from '../store/agentStore'
import { useEditorStore } from '../store/editorStore'

function parseCodeEdits(content: string, filePath: string, fileName: string): void {
  try {
    const match = content.match(/```json\s*([\s\S]*?)\s*```/)
    if (!match) return
    const parsed = JSON.parse(match[1]) as { edits?: Array<{ description: string; original_content: string; modified_content: string }> }
    const edits = parsed.edits ?? []
    const { addCodeEdit } = useAgentStore.getState()
    for (const edit of edits) {
      const id = Math.random().toString(36).slice(2, 10)
      addCodeEdit({
        id,
        filePath,
        fileName,
        description: edit.description ?? '',
        originalContent: edit.original_content ?? '',
        modifiedContent: edit.modified_content ?? '',
        diff: '',
        status: 'pending',
        timestamp: Date.now(),
        agentId: 'coder',
      } satisfies CodeEdit)
    }
  } catch {
    
  }
}

function buildWsUrl(): string {
  const envUrl = import.meta.env.VITE_CORTEX_WS_URL as string | undefined
  if (envUrl) return `${envUrl}/ws/analysis`
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.host}/ws/analysis`
}

function handleEvent(event: WSEvent) {
  const { setAgentStatus, addResponse, appendToResponse, finalizeResponse, setAnalyzing } =
    useAgentStore.getState()
  const { addExplanation } = useEditorStore.getState()

  switch (event.type) {
    case 'analysis_started':
      setAnalyzing(true)
      break

    case 'agent_started':
      if (event.agentId) {
        setAgentStatus(event.agentId as AgentId, 'running')
        addResponse({
          id: event.responseId!,
          agentId: event.agentId as AgentId,
          agentName: event.agentName ?? event.agentId,
          query: '',
          content: '',
          timestamp: event.timestamp,
          isStreaming: true,
          suggestedQuestions: [],
          contextUsed: { filePath: '', workspaceId: '' },
        })
      }
      break

    case 'agent_chunk':
      if (event.responseId && event.content) {
        appendToResponse(event.responseId, event.content)
      }
      break

    case 'agent_completed':
      if (event.agentId) {
        setAgentStatus(event.agentId as AgentId, 'completed')
        if (event.responseId) {
          finalizeResponse(event.responseId, event.suggestedQuestions ?? [])
          if (event.agentId === 'coder') {
            const response = useAgentStore.getState().responses.find(r => r.id === event.responseId)
            const activeTab = useEditorStore.getState().getActiveTab()
            if (response && activeTab) {
              parseCodeEdits(response.content, activeTab.filePath, activeTab.fileName)
            }
          }
        }
      }
      break

    case 'analysis_completed':
      setAnalyzing(false)
      break

    case 'hover_explanation':
      if (event.explanation) {
        addExplanation(event.explanation.filePath, event.explanation)
      }
      break

    case 'error':
      setAnalyzing(false)
      console.error('WS error from server:', event.error)
      break
  }
}

class WSManager {
  private ws: WebSocket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private url: string | null = null

  connect() {
    if (!this.url) this.url = buildWsUrl()
    if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING
    ) return

    try {
      const socket = new WebSocket(this.url)
      this.ws = socket

      socket.onopen = () => useAgentStore.getState().setWsConnected(true)

      socket.onmessage = (msg) => {
        try {
          handleEvent(JSON.parse(msg.data) as WSEvent)
        } catch {
          console.warn('Invalid WS message', msg.data)
        }
      }

      socket.onclose = () => {
        useAgentStore.getState().setWsConnected(false)
        this.reconnectTimer = setTimeout(() => this.connect(), 3000)
      }

      socket.onerror = () => socket.close()
    } catch {
      this.reconnectTimer = setTimeout(() => this.connect(), 3000)
    }
  }

  send(data: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
  }
}

export const wsManager = new WSManager()
