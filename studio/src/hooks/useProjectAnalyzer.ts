import { useState, useCallback } from 'react'
import { useFileStore } from '../store/fileStore'
import { useAgentStore } from '../store/agentStore'
import { useWebSocket } from './useWebSocket'

const SOURCE_EXTS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
  'py', 'go', 'rs', 'java', 'cs', 'cpp', 'c', 'h', 'rb', 'php', 'swift', 'kt',
  'vue', 'svelte',
  'json', 'toml', 'yaml', 'yml', 'env', 'sh', 'dockerfile',
  'md',
])

const IGNORED = new Set([
  '.git', 'node_modules', '__pycache__', '.venv', 'venv',
  'dist', 'build', '.next', '.nuxt', 'coverage', 'target',
  '.idea', '.vscode', '.codebaseinsightlab',
])

const MAX_FILES = 40
const MAX_BYTES = 200_000

async function walkSourceFiles(
  dirHandle: FileSystemDirectoryHandle,
  basePath: string,
  depth = 0,
): Promise<Array<{ path: string; handle: FileSystemFileHandle }>> {
  if (depth > 8) return []
  const results: Array<{ path: string; handle: FileSystemFileHandle }> = []

  for await (const [name, handle] of dirHandle as AsyncIterable<[string, FileSystemHandle]>) {
    if (IGNORED.has(name)) continue
    const path = `${basePath}/${name}`

    if (handle.kind === 'file') {
      const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''
      if (SOURCE_EXTS.has(ext) || name.toLowerCase() === 'dockerfile') {
        results.push({ path, handle: handle as FileSystemFileHandle })
      }
    } else {
      const sub = await walkSourceFiles(handle as FileSystemDirectoryHandle, path, depth + 1)
      results.push(...sub)
    }
  }
  return results
}

export function useProjectAnalyzer() {
  const { send } = useWebSocket()
  const { activeWorkspaceId, workspaces } = useFileStore()
  const selectedModel = useAgentStore(s => s.selectedModel)
  const [isAnalyzingProject, setIsAnalyzingProject] = useState(false)

  const analyzeProject = useCallback(async () => {
    const workspace = workspaces.find(w => w.id === activeWorkspaceId)
    if (!workspace?.handle || isAnalyzingProject) return

    setIsAnalyzingProject(true)
    try {
      const allFiles = await walkSourceFiles(
        workspace.handle as FileSystemDirectoryHandle,
        workspace.rootPath,
      )

      const prioritized = [
        ...allFiles.filter(f => /\/(package\.json|cargo\.toml|go\.mod|pyproject\.toml|main\.|index\.|app\.)/.test(f.path.toLowerCase())),
        ...allFiles.filter(f => !/\/(package\.json|cargo\.toml|go\.mod|pyproject\.toml|main\.|index\.|app\.)/.test(f.path.toLowerCase())),
      ].slice(0, MAX_FILES)

      const header = `// === Project: ${workspace.name} ===\n// Reading ${prioritized.length} of ${allFiles.length} source files\n`
      const parts: string[] = [header]
      let totalBytes = header.length

      for (const f of prioritized) {
        if (totalBytes >= MAX_BYTES) {
          parts.push(`\n// [truncated — ${allFiles.length - prioritized.length} more files not shown]`)
          break
        }
        try {
          const content = await (await f.handle.getFile()).text()
          const chunk = `\n// --- ${f.path} ---\n${content}`
          parts.push(chunk)
          totalBytes += chunk.length
        } catch { /* skip unreadable files */ }
      }

      send({
        action: 'analyze',
        type: 'file',
        context: {
          filePath: workspace.rootPath,
          workspaceId: activeWorkspaceId!,
          fullContent: parts.join(''),
        },
        query: 'Analyze the architecture, structure, key components, and patterns of this entire project. Give a comprehensive overview.',
        modelConfig: selectedModel,
      })
    } finally {
      setIsAnalyzingProject(false)
    }
  }, [send, activeWorkspaceId, workspaces, selectedModel, isAnalyzingProject])

  return { analyzeProject, isAnalyzingProject }
}
