import { useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from '../store/editorStore'
import { useAgentStore } from '../store/agentStore'
import { useFileStore } from '../store/fileStore'
import { useProjectConfig } from './useProjectConfig'
import type { SessionData } from './useProjectConfig'

const DEBOUNCE_MS = 2000

export function useSessionPersistence() {
  const { saveSession } = useProjectConfig()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveSessionRef = useRef(saveSession)
  saveSessionRef.current = saveSession

  const persistSession = useCallback(() => {
    const ws = useFileStore.getState().getActiveWorkspace()
    if (!ws) return

    const { tabs, activeTabId } = useEditorStore.getState()
    const { summaryDocument, responses } = useAgentStore.getState()
    const activeTab = tabs.find(t => t.id === activeTabId)

    const session: Partial<SessionData> = {
      openFiles: tabs.map(t => ({ path: t.filePath, language: t.language })),
      activeFilePath: activeTab?.filePath ?? null,
      summaryDocument,
      chatHistory: responses.slice(0, 50).map(r => ({
        id: r.id,
        agentId: r.agentId,
        agentName: r.agentName,
        query: r.query,
        content: r.content,
        timestamp: r.timestamp,
      })),
    }

    saveSessionRef.current(ws.handle, session).catch(console.warn)
  }, [])

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(persistSession, DEBOUNCE_MS)
  }, [persistSession])

  useEffect(() => {
    
    const unsubEditor = useEditorStore.subscribe((state, prev) => {
      if (state.tabs !== prev.tabs) scheduleSave()
    })
    const unsubAgent = useAgentStore.subscribe((state, prev) => {
      if (
        state.summaryDocument !== prev.summaryDocument ||
        state.responses !== prev.responses
      ) {
        scheduleSave()
      }
    })
    return () => {
      unsubEditor()
      unsubAgent()
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [scheduleSave])
}
