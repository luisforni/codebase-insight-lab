import { useAgentStore } from '../store/agentStore'
import { useEditorStore } from '../store/editorStore'
import { useFileStore } from '../store/fileStore'
import { CONFIG_DIR } from '../hooks/useProjectConfig'

export async function saveCurrentSession(): Promise<void> {
  const { workspaces, activeWorkspaceId } = useFileStore.getState()
  const workspace = workspaces.find(w => w.id === activeWorkspaceId) ?? workspaces[0]
  if (!workspace?.handle) return

  const { responses, summaryDocument } = useAgentStore.getState()
  const { tabs, activeTabId } = useEditorStore.getState()

  const chatHistory = responses
    .filter(r => !r.isStreaming && r.content)
    .slice(0, 50)
    .map(r => ({
      id: r.id,
      agentId: r.agentId,
      agentName: r.agentName,
      query: r.query,
      content: r.content,
      timestamp: r.timestamp,
    }))

  const openFiles = tabs
    .filter(t => t.workspaceId === workspace.id)
    .map(t => ({ path: t.filePath, language: t.language }))

  const activeFilePath = tabs.find(t => t.id === activeTabId)?.filePath ?? null

  try {
    const configDir = await workspace.handle.getDirectoryHandle(CONFIG_DIR, { create: true })
    const fileHandle = await configDir.getFileHandle('session.local.json', { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(JSON.stringify({
      version: 1,
      openFiles,
      activeFilePath,
      summaryDocument,
      chatHistory,
      savedAt: Date.now(),
    }, null, 2))
    await writable.close()
  } catch { /* ignore – no write permission yet or no workspace open */ }
}
