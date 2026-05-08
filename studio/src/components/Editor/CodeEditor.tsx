import { useRef, useCallback, useEffect } from 'react'
import MonacoEditor, { OnMount, Monaco } from '@monaco-editor/react'
import type { editor as MonacoEditorNS } from 'monaco-editor'
import { EditorTabs } from './EditorTabs'
import { HoverExplainerOverlay } from './HoverExplainer'
import { useEditorStore } from '../../store/editorStore'
import { useFileStore } from '../../store/fileStore'
import { useAgents } from '../../hooks/useAgents'
import { useFileSystem } from '../../hooks/useFileSystem'

const MONACO_OPTIONS: MonacoEditorNS.IStandaloneEditorConstructionOptions = {
  theme: 'vs-dark',
  fontSize: 14,
  fontFamily: "'Consolas', 'Courier New', 'Cascadia Code', monospace",
  fontLigatures: true,
  lineHeight: 22,
  minimap: { enabled: true, scale: 1 },
  scrollBeyondLastLine: false,
  wordWrap: 'off',
  renderWhitespace: 'selection',
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: true, indentation: true },
  padding: { top: 10, bottom: 10 },
  renderLineHighlight: 'all',
  cursorBlinking: 'smooth',
  smoothScrolling: true,
  automaticLayout: true,
  overviewRulerBorder: false,
  scrollbar: {
    vertical: 'visible',
    horizontal: 'visible',
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
}

export function CodeEditor() {
  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const hoverDecorationsRef = useRef<MonacoEditorNS.IEditorDecorationsCollection | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastHoverLineRef = useRef<number>(-1)
  const suppressDirtyRef = useRef(false)

  const { getActiveTab, setCursorPosition, getExplanationsForFile, setHoveredExplanation, markTabDirty, updateTabContent } = useEditorStore()
  const { activeWorkspaceId } = useFileStore()
  const { analyzeFile, requestHoverExplanation } = useAgents()
  const { writeFile } = useFileSystem()

  const activeTab = getActiveTab()

  
  
  useEffect(() => {
    return useEditorStore.subscribe((state, prevState) => {
      const tab = state.getActiveTab()
      const prevTab = prevState.getActiveTab()
      if (
        tab && prevTab &&
        tab.filePath === prevTab.filePath &&
        tab.content !== prevTab.content &&
        !tab.isDirty
      ) {
        suppressDirtyRef.current = true
        const model = editorRef.current?.getModel()
        if (model && model.getValue() !== tab.content) {
          model.setValue(tab.content)
        }
        suppressDirtyRef.current = false
      }
    })
  }, [])

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    useEditorStore.getState().setJumpFn((line) => {
      editor.revealLineInCenter(line)
      editor.setPosition({ lineNumber: line, column: 1 })
      editor.focus()
    })

    editor.onDidChangeCursorPosition(e => {
      setCursorPosition({ line: e.position.lineNumber, column: e.position.column })
    })

    
    editor.onDidChangeModelContent(() => {
      if (suppressDirtyRef.current) return
      const tab = useEditorStore.getState().getActiveTab()
      if (tab) markTabDirty(tab.id)
    })

    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
      const tab = useEditorStore.getState().getActiveTab()
      if (!tab) return
      const content = editor.getValue()
      const ws = useFileStore.getState().getActiveWorkspace()
      if (ws) {
        const ok = await writeFile(tab.filePath, content, ws.handle, ws.rootPath)
        if (ok) {
          suppressDirtyRef.current = true
          updateTabContent(tab.filePath, content)
          suppressDirtyRef.current = false
        }
      }
    })

    editor.onMouseMove((e) => {
      if (!activeTab || e.target.type !== monaco.editor.MouseTargetType.CONTENT_TEXT) return
      const pos = e.target.position
      if (!pos) return

      
      if (pos.lineNumber === lastHoverLineRef.current) return
      lastHoverLineRef.current = pos.lineNumber

      
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)

      const mousePos = e.event ? { x: e.event.posx, y: e.event.posy } : undefined

      
      const cached = getExplanationsForFile(activeTab.filePath)
        .find(ex => ex.line === pos.lineNumber)
      if (cached) {
        setHoveredExplanation(cached, mousePos)
        return
      }

      
      hoverTimerRef.current = setTimeout(async () => {
        const result = await requestHoverExplanation(
          activeTab.filePath,
          activeTab.content,
          pos.lineNumber,
          pos.column,
          activeTab.workspaceId,
        )
        if (result?.explanation) setHoveredExplanation(result.explanation, mousePos)
      }, 900)
    })

    editor.onMouseLeave(() => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
      lastHoverLineRef.current = -1
      setHoveredExplanation(null)
    })
  }, [activeTab, setCursorPosition, getExplanationsForFile, setHoveredExplanation, requestHoverExplanation, markTabDirty, updateTabContent, writeFile])

  useEffect(() => {
    if (!activeTab || !editorRef.current || !monacoRef.current) return

    const explanations = getExplanationsForFile(activeTab.filePath)
    const monaco = monacoRef.current
    const editor = editorRef.current

    if (hoverDecorationsRef.current) {
      hoverDecorationsRef.current.clear()
    }

    const decorations = explanations.map(exp => ({
      range: new monaco.Range(exp.line, 1, exp.line, 1),
      options: {
        isWholeLine: false,
        linesDecorationsClassName: 'explanation-gutter-dot',
        overviewRuler: { color: '#007acc88', position: monaco.editor.OverviewRulerLane.Left },
      },
    }))

    hoverDecorationsRef.current = editor.createDecorationsCollection(decorations)
  }, [activeTab, getExplanationsForFile])

  const handleAnalyzeFile = useCallback(() => {
    if (!activeTab || !activeWorkspaceId) return
    analyzeFile(activeTab.filePath, activeTab.content, activeWorkspaceId)
  }, [activeTab, activeWorkspaceId, analyzeFile])

  const handleSave = useCallback(async () => {
    if (!activeTab) return
    const content = editorRef.current?.getValue() ?? activeTab.content
    const ws = useFileStore.getState().getActiveWorkspace()
    if (!ws) return
    const ok = await writeFile(activeTab.filePath, content, ws.handle, ws.rootPath)
    if (ok) {
      suppressDirtyRef.current = true
      updateTabContent(activeTab.filePath, content)
      suppressDirtyRef.current = false
    }
  }, [activeTab, writeFile, updateTabContent])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      <EditorTabs />

      {!activeTab ? (
        
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          flex: 1, color: 'var(--vsc-fg-inactive)', gap: 16,
        }}>
          <div style={{ fontSize: 64, lineHeight: 1 }}>🔬</div>
          <div style={{ fontSize: 24, fontWeight: 300, color: 'var(--vsc-fg-muted)' }}>Codebase Insight Lab</div>
          <div style={{ fontSize: 'var(--vsc-font-size)', color: 'var(--vsc-fg-inactive)' }}>
            Open a folder and select a file to start analyzing
          </div>
        </div>
      ) : (
        <>
          
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '4px 12px',
            background: '#1a1a1a',
            borderBottom: '1px solid var(--vsc-border)',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 'var(--vsc-font-size-sm)', color: 'var(--vsc-fg-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeTab.filePath}
            </span>
            {activeTab.isDirty && (
              <button className="vsc-btn" onClick={handleSave} style={{ fontSize: 'var(--vsc-font-size-sm)', borderColor: 'var(--vsc-accent)', color: 'var(--vsc-accent)' }}>
                💾 Save
              </button>
            )}
            <button className="vsc-btn vsc-btn-primary" onClick={handleAnalyzeFile} style={{ fontSize: 'var(--vsc-font-size-sm)' }}>
              ⚡ Analyze with Agents
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            <MonacoEditor
              language={activeTab.language}
              value={activeTab.content}
              options={MONACO_OPTIONS}
              onMount={handleEditorMount}
              theme="vs-dark"
            />
            <HoverExplainerOverlay />
          </div>
        </>
      )}
    </div>
  )
}
