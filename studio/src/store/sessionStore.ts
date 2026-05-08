import { create } from 'zustand'
import { openDB, type IDBPDatabase } from 'idb'
import type { SavedProject, ConversationThread } from '../types'



const DB_NAME = 'codebase-insight-lab'
const DB_VERSION = 1

interface CILSchema {
  'workspace-handles': {
    key: string
    value: FileSystemDirectoryHandle
  }
  'conversation-threads': {
    key: string
    value: ConversationThread
    indexes: { by_workspace: string }
  }
}

let _db: IDBPDatabase<CILSchema> | null = null

async function getDB(): Promise<IDBPDatabase<CILSchema>> {
  if (_db) return _db
  _db = await openDB<CILSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('workspace-handles')) {
        db.createObjectStore('workspace-handles')
      }
      if (!db.objectStoreNames.contains('conversation-threads')) {
        const store = db.createObjectStore('conversation-threads', { keyPath: 'id' })
        store.createIndex('by_workspace', 'workspaceId')
      }
    },
  })
  return _db
}



interface SessionStore {
  projects: SavedProject[]
  activeProjectId: string | null
  language: string
  threads: ConversationThread[]
  activeThreadId: string | null

  
  saveProject: (project: Omit<SavedProject, 'id' | 'savedAt' | 'lastOpenedAt'>) => Promise<SavedProject>
  loadProject: (projectId: string) => void
  deleteProject: (projectId: string) => void
  updateLastOpened: (projectId: string) => void

  
  saveWorkspaceHandle: (key: string, handle: FileSystemDirectoryHandle) => Promise<void>
  loadWorkspaceHandle: (key: string) => Promise<FileSystemDirectoryHandle | undefined>

  
  loadThreadsForWorkspace: (workspaceId: string) => Promise<void>
  createThread: (workspaceId: string, title: string, filePath?: string) => Promise<ConversationThread>
  updateThread: (thread: ConversationThread) => Promise<void>
  deleteThread: (threadId: string) => Promise<void>
  setActiveThread: (threadId: string | null) => void

  
  setLanguage: (lang: string) => void

  
  init: () => void
}



function loadProjectsFromStorage(): SavedProject[] {
  try {
    return JSON.parse(localStorage.getItem('cil:projects') ?? '[]')
  } catch {
    return []
  }
}

function saveProjectsToStorage(projects: SavedProject[]): void {
  localStorage.setItem('cil:projects', JSON.stringify(projects))
}



export const useSessionStore = create<SessionStore>((set, get) => ({
  projects: [],
  activeProjectId: null,
  language: localStorage.getItem('language') ?? 'es',
  threads: [],
  activeThreadId: null,

  init() {
    const projects = loadProjectsFromStorage()
    const activeProjectId = localStorage.getItem('cil:activeProject')
    set({ projects, activeProjectId })
  },

  async saveProject(data) {
    const project: SavedProject = {
      ...data,
      id: `proj_${Date.now()}`,
      savedAt: Date.now(),
      lastOpenedAt: Date.now(),
    }
    const projects = [...get().projects.filter(p => p.rootPath !== data.rootPath), project]
    saveProjectsToStorage(projects)
    set({ projects, activeProjectId: project.id })
    localStorage.setItem('cil:activeProject', project.id)
    return project
  },

  loadProject(projectId) {
    const project = get().projects.find(p => p.id === projectId)
    if (!project) return
    set({ activeProjectId: projectId })
    localStorage.setItem('cil:activeProject', projectId)
    get().updateLastOpened(projectId)
  },

  deleteProject(projectId) {
    const projects = get().projects.filter(p => p.id !== projectId)
    saveProjectsToStorage(projects)
    const active = get().activeProjectId === projectId ? null : get().activeProjectId
    set({ projects, activeProjectId: active })
    if (!active) localStorage.removeItem('cil:activeProject')
  },

  updateLastOpened(projectId) {
    const projects = get().projects.map(p =>
      p.id === projectId ? { ...p, lastOpenedAt: Date.now() } : p,
    )
    saveProjectsToStorage(projects)
    set({ projects })
  },

  async saveWorkspaceHandle(key, handle) {
    const db = await getDB()
    await db.put('workspace-handles', handle, key)
  },

  async loadWorkspaceHandle(key) {
    const db = await getDB()
    return db.get('workspace-handles', key)
  },

  async loadThreadsForWorkspace(workspaceId) {
    const db = await getDB()
    const threads = await db.getAllFromIndex('conversation-threads', 'by_workspace', workspaceId)
    set({ threads: threads.sort((a, b) => b.updatedAt - a.updatedAt) })
  },

  async createThread(workspaceId, title, filePath) {
    const thread: ConversationThread = {
      id: `thread_${Date.now()}`,
      title,
      workspaceId,
      filePath,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const db = await getDB()
    await db.put('conversation-threads', thread)
    set(s => ({ threads: [thread, ...s.threads], activeThreadId: thread.id }))
    return thread
  },

  async updateThread(thread) {
    const updated = { ...thread, updatedAt: Date.now() }
    const db = await getDB()
    await db.put('conversation-threads', updated)
    set(s => ({
      threads: s.threads.map(t => (t.id === updated.id ? updated : t)),
    }))
  },

  async deleteThread(threadId) {
    const db = await getDB()
    await db.delete('conversation-threads', threadId)
    set(s => ({
      threads: s.threads.filter(t => t.id !== threadId),
      activeThreadId: s.activeThreadId === threadId ? null : s.activeThreadId,
    }))
  },

  setActiveThread(threadId) {
    set({ activeThreadId: threadId })
  },

  setLanguage(lang) {
    localStorage.setItem('language', lang)
    set({ language: lang })
  },
}))
