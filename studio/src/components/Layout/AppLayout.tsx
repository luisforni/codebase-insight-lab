import { useEffect, useState } from 'react'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { ActivityBar } from './ActivityBar'
import { StatusBar } from './StatusBar'
import { FileTree } from '../FileTree/FileTree'
import { CodeEditor } from '../Editor/CodeEditor'
import { AIPanel } from '../AIPanel/AIPanel'
import { MultiTerminal } from '../Terminal/MultiTerminal'
import { useEditorStore } from '../../store/editorStore'
import { useFileStore } from '../../store/fileStore'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useSessionPersistence } from '../../hooks/useSessionPersistence'
import { useFileSystem } from '../../hooks/useFileSystem'

export type SidebarView = 'explorer' | 'agents' | 'settings'

export function AppLayout() {
  const [sidebarView, setSidebarView] = useState<SidebarView>('explorer')
  const isTerminalVisible = useEditorStore(s => s.isTerminalVisible)
  const activeWorkspaceId = useFileStore(s => s.activeWorkspaceId)
  const { restoreLastFolder } = useFileSystem()

  useWebSocket()
  useSessionPersistence()

  useEffect(() => {
    if (activeWorkspaceId) return
    restoreLastFolder({ alertOnDenied: true }).catch(console.warn)
  }, [activeWorkspaceId, restoreLastFolder])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <ActivityBar activeView={sidebarView} onViewChange={setSidebarView} />

        <PanelGroup direction="horizontal" style={{ flex: 1 }}>
          
          <Panel defaultSize={20} minSize={12} maxSize={40} style={{ display: 'flex', flexDirection: 'column', background: 'var(--vsc-bg-sidebar)' }}>
            <FileTree view={sidebarView} />
          </Panel>

          <PanelResizeHandle style={{ width: 1, background: 'var(--vsc-border)', cursor: 'col-resize' }} />

          
          <Panel defaultSize={55} minSize={30} style={{ display: 'flex', flexDirection: 'column', background: 'var(--vsc-bg-editor)' }}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={isTerminalVisible ? 70 : 100} minSize={30}>
                <CodeEditor />
              </Panel>
              {isTerminalVisible && (
                <>
                  <PanelResizeHandle style={{ height: 1, background: 'var(--vsc-border)', cursor: 'row-resize' }} />
                  <Panel defaultSize={30} minSize={15} maxSize={60}>
                    <MultiTerminal />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>

          <PanelResizeHandle style={{ width: 1, background: 'var(--vsc-border)', cursor: 'col-resize' }} />

          
          <Panel defaultSize={25} minSize={18} maxSize={45} style={{ display: 'flex', flexDirection: 'column', background: 'var(--vsc-bg-sidebar)' }}>
            <AIPanel />
          </Panel>
        </PanelGroup>
      </div>

      <StatusBar />
    </div>
  )
}

