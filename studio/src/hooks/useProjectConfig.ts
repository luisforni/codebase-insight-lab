import { useCallback } from 'react'
import type { DepthMode, ModelConfig } from '../types'

export const CONFIG_DIR = '.codebaseinsightlab'
const SETTINGS_FILE = 'settings.json'
const SESSION_FILE = 'session.local.json'

export interface ProjectSettings {
  version: number
  depth: DepthMode
  model: { provider: string; modelId: string; displayName: string }
  runCommand: string
  omitPatterns: string[]
  contextPrompt: string
  createdAt: number
  updatedAt: number
}

export interface SessionData {
  version: number
  openFiles: Array<{ path: string; language: string }>
  activeFilePath: string | null
  summaryDocument: string
  chatHistory: Array<{
    id: string
    agentId: string
    agentName: string
    query: string
    content: string
    timestamp: number
  }>
  savedAt: number
}

export interface SessionSnapshotInput {
  openFiles?: Array<{ path: string; language: string }>
  activeFilePath?: string | null
  summaryDocument?: string
  chatHistory?: SessionData['chatHistory']
}

async function getConfigDir(
  workspaceHandle: FileSystemDirectoryHandle,
): Promise<FileSystemDirectoryHandle> {
  return workspaceHandle.getDirectoryHandle(CONFIG_DIR, { create: true })
}

async function readJsonFile<T>(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string,
): Promise<T | null> {
  try {
    const fileHandle = await dirHandle.getFileHandle(fileName)
    const file = await fileHandle.getFile()
    const text = await file.text()
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

async function writeJsonFile(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string,
  data: unknown,
): Promise<void> {
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(JSON.stringify(data, null, 2))
  await writable.close()
}

export async function saveSessionSnapshot(
  workspaceHandle: FileSystemDirectoryHandle,
  session: SessionSnapshotInput,
): Promise<void> {
  const configDir = await getConfigDir(workspaceHandle)
  const existing = await readJsonFile<SessionData>(configDir, SESSION_FILE)
  const updated: SessionData = {
    version: 1,
    openFiles: [],
    activeFilePath: null,
    summaryDocument: '',
    chatHistory: [],
    ...(existing ?? {}),
    ...session,
    savedAt: Date.now(),
  }
  await writeJsonFile(configDir, SESSION_FILE, updated)
}

export function useProjectConfig() {
  const initConfigDir = useCallback(async (
    workspaceHandle: FileSystemDirectoryHandle,
    currentModel: ModelConfig,
    currentDepth: DepthMode,
  ): Promise<{ settings: ProjectSettings; configDir: FileSystemDirectoryHandle }> => {
    const configDir = await getConfigDir(workspaceHandle)

    let settings = await readJsonFile<ProjectSettings>(configDir, SETTINGS_FILE)
    if (!settings) {
      settings = {
        version: 1,
        depth: currentDepth,
        model: {
          provider: currentModel.provider,
          modelId: currentModel.modelId,
          displayName: currentModel.displayName,
        },
        runCommand: '',
        omitPatterns: [],
        contextPrompt: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      await writeJsonFile(configDir, SETTINGS_FILE, settings)
    }

    return { settings, configDir }
  }, [])

  const saveSettings = useCallback(async (
    workspaceHandle: FileSystemDirectoryHandle,
    settings: Partial<ProjectSettings>,
  ): Promise<void> => {
    try {
      const configDir = await getConfigDir(workspaceHandle)
      const existing = await readJsonFile<ProjectSettings>(configDir, SETTINGS_FILE)
      await writeJsonFile(configDir, SETTINGS_FILE, {
        ...(existing ?? {}),
        ...settings,
        updatedAt: Date.now(),
      })
    } catch (err) {
      console.warn('Failed to save project settings:', err)
    }
  }, [])

  const readSettings = useCallback(async (
    workspaceHandle: FileSystemDirectoryHandle,
  ): Promise<ProjectSettings | null> => {
    try {
      const configDir = await getConfigDir(workspaceHandle)
      return readJsonFile<ProjectSettings>(configDir, SETTINGS_FILE)
    } catch {
      return null
    }
  }, [])

  const saveSession = useCallback(async (
    workspaceHandle: FileSystemDirectoryHandle,
    session: Partial<SessionData>,
  ): Promise<void> => {
    try {
      await saveSessionSnapshot(workspaceHandle, session)
    } catch (err) {
      console.warn('Failed to save session:', err)
    }
  }, [])

  const readSession = useCallback(async (
    workspaceHandle: FileSystemDirectoryHandle,
  ): Promise<SessionData | null> => {
    try {
      const configDir = await getConfigDir(workspaceHandle)
      return readJsonFile<SessionData>(configDir, SESSION_FILE)
    } catch {
      return null
    }
  }, [])

  const updateGitignore = useCallback(async (
    workspaceHandle: FileSystemDirectoryHandle,
  ): Promise<void> => {
    try {
      let content = ''
      try {
        const fh = await workspaceHandle.getFileHandle('.gitignore')
        content = await (await fh.getFile()).text()
      } catch {
        
      }

      if (!content.includes(CONFIG_DIR)) {
        content += `\n# Codebase Insight Lab\n${CONFIG_DIR}/\n`
        const fh = await workspaceHandle.getFileHandle('.gitignore', { create: true })
        const writable = await fh.createWritable()
        await writable.write(content)
        await writable.close()
      }
    } catch (err) {
      console.warn('Failed to update .gitignore:', err)
    }
  }, [])

  return {
    initConfigDir,
    saveSettings,
    readSettings,
    saveSession,
    readSession,
    updateGitignore,
  }
}
