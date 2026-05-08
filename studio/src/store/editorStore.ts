import { create } from 'zustand'
import { EditorTab, CursorPosition, Explanation } from '../types'

interface EditorStore {
  tabs: EditorTab[]
  activeTabId: string | null
  cursorPosition: CursorPosition
  explanations: Record<string, Explanation[]>
  hoveredExplanation: Explanation | null
  hoverPosition: { x: number; y: number } | null
  isTerminalVisible: boolean
  jumpFn: ((line: number) => void) | null

  openTab: (tab: EditorTab) => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  setCursorPosition: (pos: CursorPosition) => void
  updateTabContent: (filePath: string, content: string) => void
  markTabDirty: (tabId: string) => void
  addExplanation: (filePath: string, explanation: Explanation) => void
  setHoveredExplanation: (exp: Explanation | null, pos?: { x: number; y: number }) => void
  getExplanationsForFile: (filePath: string) => Explanation[]
  toggleTerminal: () => void
  getActiveTab: () => EditorTab | null
  setJumpFn: (fn: (line: number) => void) => void
  jumpToLine: (line: number) => void
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  cursorPosition: { line: 1, column: 1 },
  explanations: {},
  hoveredExplanation: null,
  hoverPosition: null,
  isTerminalVisible: false,
  jumpFn: null,

  openTab: (tab) => set(s => {
    const existing = s.tabs.find(t => t.filePath === tab.filePath)
    if (existing) return { activeTabId: existing.id }
    return { tabs: [...s.tabs, tab], activeTabId: tab.id }
  }),

  closeTab: (tabId) => set(s => {
    const idx = s.tabs.findIndex(t => t.id === tabId)
    const remaining = s.tabs.filter(t => t.id !== tabId)
    let nextActive = s.activeTabId
    if (s.activeTabId === tabId) {
      nextActive = remaining[Math.min(idx, remaining.length - 1)]?.id ?? null
    }
    return { tabs: remaining, activeTabId: nextActive }
  }),

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  setCursorPosition: (pos) => set({ cursorPosition: pos }),

  updateTabContent: (filePath, content) => set(s => ({
    tabs: s.tabs.map(t => t.filePath === filePath ? { ...t, content, isDirty: false } : t),
  })),

  markTabDirty: (tabId) => set(s => ({
    tabs: s.tabs.map(t => t.id === tabId ? { ...t, isDirty: true } : t),
  })),

  addExplanation: (filePath, explanation) => set(s => ({
    explanations: {
      ...s.explanations,
      [filePath]: [
        ...(s.explanations[filePath] ?? []).filter(e => e.line !== explanation.line),
        explanation,
      ],
    },
  })),

  setHoveredExplanation: (exp, pos) => set({ hoveredExplanation: exp, hoverPosition: pos ?? null }),

  getExplanationsForFile: (filePath) => get().explanations[filePath] ?? [],

  toggleTerminal: () => set(s => ({ isTerminalVisible: !s.isTerminalVisible })),

  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find(t => t.id === activeTabId) ?? null
  },

  setJumpFn: (fn) => set({ jumpFn: fn }),
  jumpToLine: (line) => get().jumpFn?.(line),
}))
