import { create } from 'zustand'
import { FileNode, Workspace } from '../types'

interface FileStore {
  workspaces: Workspace[]
  activeWorkspaceId: string | null
  selectedFilePath: string | null

  addWorkspace: (workspace: Workspace) => void
  removeWorkspace: (id: string) => void
  setActiveWorkspace: (id: string) => void
  setSelectedFile: (path: string | null) => void
  toggleFolder: (workspaceId: string, nodeId: string) => void
  updateWorkspaceTree: (workspaceId: string, tree: FileNode[]) => void
  getActiveWorkspace: () => Workspace | null
}

function toggleNodeExpanded(nodes: FileNode[], nodeId: string): FileNode[] {
  return nodes.map(node => {
    if (node.id === nodeId) return { ...node, isExpanded: !node.isExpanded }
    if (node.children) return { ...node, children: toggleNodeExpanded(node.children, nodeId) }
    return node
  })
}

export const useFileStore = create<FileStore>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  selectedFilePath: null,

  addWorkspace: (workspace) => set(s => ({
    workspaces: [...s.workspaces, workspace],
    activeWorkspaceId: s.activeWorkspaceId ?? workspace.id,
  })),

  removeWorkspace: (id) => set(s => {
    const remaining = s.workspaces.filter(w => w.id !== id)
    return {
      workspaces: remaining,
      activeWorkspaceId:
        s.activeWorkspaceId === id
          ? remaining[0]?.id ?? null
          : s.activeWorkspaceId,
    }
  }),

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

  setSelectedFile: (path) => set({ selectedFilePath: path }),

  toggleFolder: (workspaceId, nodeId) => set(s => ({
    workspaces: s.workspaces.map(ws =>
      ws.id === workspaceId
        ? { ...ws, tree: toggleNodeExpanded(ws.tree, nodeId) }
        : ws
    ),
  })),

  updateWorkspaceTree: (workspaceId, tree) => set(s => ({
    workspaces: s.workspaces.map(ws =>
      ws.id === workspaceId ? { ...ws, tree } : ws
    ),
  })),

  getActiveWorkspace: () => {
    const { workspaces, activeWorkspaceId } = get()
    return workspaces.find(w => w.id === activeWorkspaceId) ?? null
  },
}))
