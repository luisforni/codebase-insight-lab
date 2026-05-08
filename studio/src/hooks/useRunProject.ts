import { useState, useCallback, useEffect } from 'react'
import { FileNode } from '../types'
import { useFileStore } from '../store/fileStore'
import { useProjectConfig } from './useProjectConfig'
import { useAgentStore } from '../store/agentStore'
import { useEditorStore } from '../store/editorStore'
import { wsManager } from '../services/wsManager'

function detectRunCommand(tree: FileNode[]): string {
  const nameSet = new Set(tree.map(n => n.name.toLowerCase()))

  if (nameSet.has('package.json')) return 'npm start'
  if (nameSet.has('cargo.toml')) return 'cargo run'
  if (nameSet.has('go.mod')) return 'go run .'
  if (nameSet.has('docker-compose.yml') || nameSet.has('docker-compose.yaml')) return 'docker-compose up'
  if (nameSet.has('makefile')) return 'make'
  if (nameSet.has('pyproject.toml')) return 'python -m pytest'
  if (nameSet.has('requirements.txt') || nameSet.has('main.py')) return 'python main.py'
  return ''
}

export function useRunProject() {
  const getActiveWorkspace = useFileStore(s => s.getActiveWorkspace)
  const activeWorkspaceId = useFileStore(s => s.activeWorkspaceId)
  const { saveSettings, readSettings } = useProjectConfig()

  const [isOpen, setIsOpen] = useState(false)
  const [command, setCommand] = useState('')
  const [omitPatterns, setOmitPatterns] = useState('')
  const [contextPrompt, setContextPrompt] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [lastOutput, setLastOutput] = useState('')
  const [lastExitCode, setLastExitCode] = useState<number | null>(null)

  
  useEffect(() => {
    const ws = getActiveWorkspace()
    if (!ws) return
    readSettings(ws.handle).then(settings => {
      if (!settings) return
      if (settings.runCommand) setCommand(settings.runCommand)
      if (settings.omitPatterns?.length) setOmitPatterns(settings.omitPatterns.join(', '))
      if (settings.contextPrompt) setContextPrompt(settings.contextPrompt)
    }).catch(() => {})
  }, [activeWorkspaceId, getActiveWorkspace, readSettings])

  const openDialog = useCallback(() => {
    const ws = getActiveWorkspace()
    if (ws) {
      setCommand(prev => {
        if (prev) return prev
        return detectRunCommand(ws.tree)
      })
    }
    setIsOpen(true)
  }, [getActiveWorkspace])

  const closeDialog = useCallback(() => setIsOpen(false), [])

  const execute = useCallback(async () => {
    const cmd = command.trim()
    if (!cmd) return
    setIsRunning(true)
    setIsOpen(false)

    
    const ws = getActiveWorkspace()
    if (ws) {
      saveSettings(ws.handle, {
        runCommand: cmd,
        omitPatterns: omitPatterns.split(',').map(s => s.trim()).filter(Boolean),
        contextPrompt: contextPrompt.trim(),
      }).catch(console.warn)
    }

    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      })
      const data = await res.json()
      const output: string = data.output ?? ''
      const exitCode: number = data.exitCode ?? 0

      setLastOutput(output)
      setLastExitCode(exitCode)

      if (exitCode !== 0 && activeWorkspaceId) {
        
        const { selectedModel } = useAgentStore.getState()
        const { getActiveTab } = useEditorStore.getState()
        const activeTab = getActiveTab()
        const context = contextPrompt.trim()
          ? `Context: ${contextPrompt}\n\nCommand: ${cmd}\n\nOutput:\n${output}`
          : `Command: ${cmd}\n\nOutput:\n${output}`

        wsManager.send({
          action: 'analyze',
          type: 'command_output',
          query: context,
          context: {
            filePath: activeTab?.filePath ?? '',
            workspaceId: activeWorkspaceId,
          },
          targetAgents: ['logs', 'error_handling', 'debugger'],
          modelConfig: selectedModel,
        })
      }
    } catch (err) {
      const msg = `Error: ${(err as Error).message}`
      setLastOutput(msg)
      setLastExitCode(1)
    } finally {
      setIsRunning(false)
    }
  }, [command, omitPatterns, contextPrompt, activeWorkspaceId, getActiveWorkspace, saveSettings])

  return {
    isOpen,
    openDialog,
    closeDialog,
    command,
    setCommand,
    omitPatterns,
    setOmitPatterns,
    contextPrompt,
    setContextPrompt,
    isRunning,
    lastOutput,
    lastExitCode,
    execute,
  }
}
