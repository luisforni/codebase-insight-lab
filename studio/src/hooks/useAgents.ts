import { useCallback } from 'react'
import { AnalysisRequest, SuggestedQuestion } from '../types'
import { useAgentStore } from '../store/agentStore'
import { useEditorStore } from '../store/editorStore'
import { useSessionStore } from '../store/sessionStore'
import { useWebSocket } from './useWebSocket'
import { api } from '../services/api'

export function useAgents() {
  const { send } = useWebSocket()
  const { selectedModel, setPendingRequest } = useAgentStore(s => ({ selectedModel: s.selectedModel, setPendingRequest: s.setPendingRequest }))
  const { getActiveTab } = useEditorStore()

  const analyzeFile = useCallback(async (filePath: string, content: string, workspaceId: string, query?: string) => {
    const { depthMode } = useAgentStore.getState()
    const { language } = useSessionStore.getState()
    const request: AnalysisRequest = {
      type: query ? 'question' : 'file',
      context: { filePath, workspaceId, fullContent: content },
      query,
      modelConfig: selectedModel,
    }
    setPendingRequest(request)
    send({ action: 'analyze', depth: depthMode, uiLang: language, ...request })
  }, [send, selectedModel, setPendingRequest])

  const analyzeSelection = useCallback((selection: string, workspaceId: string) => {
    const tab = getActiveTab()
    if (!tab) return
    const request: AnalysisRequest = {
      type: 'selection',
      context: {
        filePath: tab.filePath,
        workspaceId,
        fullContent: tab.content,
        selectedSnippet: selection,
      },
      modelConfig: selectedModel,
    }
    send({ action: 'analyze', ...request })
  }, [send, selectedModel, getActiveTab])

  const askQuestion = useCallback((question: SuggestedQuestion, workspaceId: string) => {
    const tab = getActiveTab()
    if (!tab) return
    const request: AnalysisRequest = {
      type: 'question',
      query: question.text,
      context: {
        filePath: tab.filePath,
        workspaceId,
        fullContent: tab.content,
      },
      targetAgents: question.agentTargets,
      modelConfig: selectedModel,
    }
    send({ action: 'analyze', ...request })
  }, [send, selectedModel, getActiveTab])

  const requestHoverExplanation = useCallback(async (
    filePath: string,
    content: string,
    line: number,
    column: number,
    workspaceId: string
  ) => {
    try {
      const result = await api.getHoverExplanation({
        filePath, content, line, column, workspaceId,
        modelConfig: selectedModel,
      })
      return result
    } catch {
      return null
    }
  }, [selectedModel])

  const runCommand = useCallback((command: string, workspaceId: string) => {
    const tab = getActiveTab()
    const request: AnalysisRequest = {
      type: 'command_output',
      query: command,
      context: {
        filePath: tab?.filePath ?? '',
        workspaceId,
      },
      targetAgents: ['logs'],
      modelConfig: selectedModel,
    }
    send({ action: 'analyze', ...request })
  }, [send, selectedModel, getActiveTab])

  return { analyzeFile, analyzeSelection, askQuestion, requestHoverExplanation, runCommand }
}
