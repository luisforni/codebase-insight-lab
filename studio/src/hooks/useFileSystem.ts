import { useCallback } from 'react'
import { FileNode, Workspace, EditorTab, AgentId, AgentResponse, AVAILABLE_MODELS } from '../types'
import { useFileStore } from '../store/fileStore'
import { useAgentStore } from '../store/agentStore'
import { useSessionStore } from '../store/sessionStore'
import { useEditorStore } from '../store/editorStore'
import { useProjectConfig } from './useProjectConfig'
import { getLanguageFromExtension, getLanguageFromPath } from '../services/languageMap'

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export async function buildFileTree(
  dirHandle: FileSystemDirectoryHandle,
  parentPath: string,
  depth = 0
): Promise<FileNode[]> {
  const nodes: FileNode[] = []
  const IGNORED = new Set(['.git', 'node_modules', '__pycache__', '.venv', 'venv', 'dist', 'build', '.idea', '.vscode'])
  const MAX_DEPTH = 10

  if (depth > MAX_DEPTH) return nodes

  for await (const [name, handle] of dirHandle as AsyncIterable<[string, FileSystemHandle]>) {
    if (IGNORED.has(name)) continue

    const path = `${parentPath}/${name}`
    const id = generateId()

    if (handle.kind === 'directory') {
      nodes.push({
        id,
        name,
        path,
        type: 'directory',
        handle: handle as FileSystemDirectoryHandle,
        isExpanded: depth === 0,
        children: depth === 0
          ? await buildFileTree(handle as FileSystemDirectoryHandle, path, depth + 1)
          : [],
      })
    } else {
      const ext = name.split('.').pop() ?? ''
      nodes.push({
        id,
        name,
        path,
        type: 'file',
        language: getLanguageFromExtension(ext),
        handle: handle as FileSystemFileHandle,
      })
    }
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}



async function getFileHandleByPath(
  rootHandle: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<FileSystemFileHandle | null> {
  try {
    const parts = relativePath.split('/').filter(Boolean)
    let dir: FileSystemDirectoryHandle = rootHandle
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i])
    }
    return dir.getFileHandle(parts[parts.length - 1])
  } catch {
    return null
  }
}

async function restoreSession(
  dirHandle: FileSystemDirectoryHandle,
  workspaceId: string,
  rootPath: string,
): Promise<void> {
  try {
    const configDirHandle = await dirHandle.getDirectoryHandle('.codebaseinsightlab')

    
    try {
      const settingsHandle = await configDirHandle.getFileHandle('settings.json')
      const settings = JSON.parse(await (await settingsHandle.getFile()).text())
      const { setDepthMode, setSelectedModel } = useAgentStore.getState()
      if (settings?.depth) setDepthMode(settings.depth)
      if (settings?.model?.modelId) {
        const model = AVAILABLE_MODELS.find(m => m.modelId === settings.model.modelId)
        if (model) setSelectedModel(model)
      }
    } catch { /* settings not yet saved */ }

    const sessionFileHandle = await configDirHandle.getFileHandle('session.local.json')
    const session = JSON.parse(await (await sessionFileHandle.getFile()).text())

    const { openTab } = useEditorStore.getState()
    const { setSummaryDocument, setResponses } = useAgentStore.getState()

    
    if (session.summaryDocument) {
      setSummaryDocument(session.summaryDocument)
    }

    
    if (Array.isArray(session.chatHistory) && session.chatHistory.length > 0) {
      const responses: AgentResponse[] = session.chatHistory.map((h: {
        id: string; agentId: string; agentName: string; query: string; content: string; timestamp: number
      }) => ({
        id: h.id,
        agentId: h.agentId as AgentId,
        agentName: h.agentName,
        query: h.query,
        content: h.content,
        timestamp: h.timestamp,
        isStreaming: false,
        suggestedQuestions: [],
        contextUsed: { filePath: '', workspaceId },
      }))
      setResponses(responses)
    }

    
    if (Array.isArray(session.openFiles)) {
      for (const file of session.openFiles) {
        const relativePath = file.path.startsWith(rootPath + '/')
          ? file.path.slice(rootPath.length + 1)
          : file.path
        const fileHandle = await getFileHandleByPath(dirHandle, relativePath)
        if (!fileHandle) continue
        const content = await (await fileHandle.getFile()).text()
        const fileName = relativePath.split('/').pop() ?? relativePath
        const tab: EditorTab = {
          id: generateId(),
          filePath: file.path,
          fileName,
          language: file.language || getLanguageFromPath(fileName),
          content,
          isDirty: false,
          workspaceId,
        }
        openTab(tab)
      }
    }
  } catch {
    
  }
}

export function useFileSystem() {
  const { addWorkspace, toggleFolder: _toggleFolder } = useFileStore()
  const { initConfigDir, updateGitignore } = useProjectConfig()

  const openFolder = useCallback(async () => {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
      const tree = await buildFileTree(dirHandle, dirHandle.name)

      const workspace: Workspace = {
        id: generateId(),
        name: dirHandle.name,
        rootPath: dirHandle.name,
        handle: dirHandle,
        tree,
        addedAt: Date.now(),
      }

      addWorkspace(workspace)

      
      const { saveWorkspaceHandle } = useSessionStore.getState()
      await saveWorkspaceHandle('last', dirHandle)
      localStorage.setItem('cil:lastWorkspaceName', dirHandle.name)

      
      const { selectedModel, depthMode } = useAgentStore.getState()
      initConfigDir(dirHandle, selectedModel, depthMode).catch(console.warn)
      updateGitignore(dirHandle).catch(console.warn)

      
      restoreSession(dirHandle, workspace.id, workspace.rootPath).catch(console.warn)

      return workspace
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Failed to open folder:', err)
      }
      return null
    }
  }, [addWorkspace, initConfigDir, updateGitignore])

  const readFile = useCallback(async (handle: FileSystemFileHandle): Promise<string> => {
    const file = await handle.getFile()
    return file.text()
  }, [])

  const expandFolder = useCallback(async (
    workspaceId: string,
    node: FileNode,
    updateTree: (id: string, tree: FileNode[]) => void,
    workspace: Workspace
  ) => {
    if (node.type !== 'directory' || !node.handle) return

    if (!node.children || node.children.length === 0) {
      const children = await buildFileTree(
        node.handle as FileSystemDirectoryHandle,
        node.path,
        1
      )
      const updateNodeChildren = (nodes: FileNode[]): FileNode[] =>
        nodes.map(n => n.id === node.id ? { ...n, children, isExpanded: true } : n.children
          ? { ...n, children: updateNodeChildren(n.children) }
          : n
        )
      updateTree(workspaceId, updateNodeChildren(workspace.tree))
    } else {
      _toggleFolder(workspaceId, node.id)
    }
  }, [_toggleFolder])

  const writeFile = useCallback(async (
    filePath: string,
    content: string,
    workspaceHandle: FileSystemDirectoryHandle,
    rootPath: string,
  ): Promise<boolean> => {
    try {
      const relative = filePath.startsWith(rootPath + '/')
        ? filePath.slice(rootPath.length + 1)
        : filePath
      const parts = relative.split('/')
      let dirHandle: FileSystemDirectoryHandle = workspaceHandle
      for (let i = 0; i < parts.length - 1; i++) {
        dirHandle = await dirHandle.getDirectoryHandle(parts[i])
      }
      const fileHandle = await dirHandle.getFileHandle(parts[parts.length - 1])
      const writable = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()
      return true
    } catch (err) {
      console.error('Failed to write file:', err)
      return false
    }
  }, [])

  return { openFolder, readFile, expandFolder, writeFile }
}
