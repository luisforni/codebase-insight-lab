import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SidebarView } from '../Layout/AppLayout'
import { FileNode, EditorTab } from '../../types'
import { useFileStore } from '../../store/fileStore'
import { useEditorStore } from '../../store/editorStore'
import { useFileSystem } from '../../hooks/useFileSystem'
import { FileTreeNode } from './FileTreeNode'
import { getLanguageFromPath } from '../../services/languageMap'

interface Props {
  view: SidebarView
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}



function ChevronDown() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M1.5 3l3 3 3-3H1.5z" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M3 1.5l3 3-3 3V1.5z" />
    </svg>
  )
}

interface SectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  action?: React.ReactNode
  indent?: number
}

function CollapsibleSection({ title, defaultOpen = true, children, action, indent = 0 }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: `4px 8px 4px ${6 + indent * 12}px`,
          cursor: 'pointer',
          color: 'var(--vsc-fg-muted)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          userSelect: 'none',
          flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <span style={{ color: 'var(--vsc-fg-inactive)', display: 'flex', alignItems: 'center', minWidth: 10 }}>
          {open ? <ChevronDown /> : <ChevronRight />}
        </span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </span>
        {action && (
          <span onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
            {action}
          </span>
        )}
      </div>
      {open && children}
    </div>
  )
}



function AppTitleBar() {
  return (
    <div style={{
      padding: '9px 10px 7px',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.07em',
      color: 'var(--vsc-fg-muted)',
      textTransform: 'uppercase',
      borderBottom: '1px solid var(--vsc-border)',
      flexShrink: 0,
      userSelect: 'none',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}>
      Codebase Insight Lab
    </div>
  )
}



function RestoreBanner({ name, onRestore }: { name: string; onRestore: () => void }) {
  const { t } = useTranslation()
  return (
    <div style={{
      margin: '8px',
      padding: '8px 10px',
      background: 'rgba(0,122,204,0.08)',
      border: '1px solid rgba(0,122,204,0.25)',
      borderRadius: 4,
      cursor: 'pointer',
    }}
      onClick={onRestore}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,122,204,0.16)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,122,204,0.08)')}
    >
      <div style={{ fontSize: 10, color: 'var(--vsc-fg-inactive)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {t('session.restore')}
      </div>
      <div style={{ fontSize: 12, color: 'var(--vsc-accent)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        🔄 {name}
      </div>
      <div style={{ fontSize: 10, color: 'var(--vsc-fg-inactive)', marginTop: 3 }}>
        {t('session.clickToRestore')}
      </div>
    </div>
  )
}



export function FileTree({ view }: Props) {
  const { t } = useTranslation()
  const { workspaces, selectedFilePath, setSelectedFile, updateWorkspaceTree, toggleFolder, removeWorkspace } = useFileStore()
  const { openTab } = useEditorStore()
  const { openFolder, restoreLastFolder, readFile, expandFolder } = useFileSystem()
  const [lastWorkspaceName, setLastWorkspaceName] = useState<string | null>(null)

  useEffect(() => {
    const name = localStorage.getItem('cil:lastWorkspaceName')
    if (name && workspaces.length === 0) {
      setLastWorkspaceName(name)
    } else {
      setLastWorkspaceName(null)
    }
  }, [workspaces.length])

  const handleFileClick = useCallback(async (node: FileNode) => {
    if (!node.handle || node.type !== 'file') return
    setSelectedFile(node.path)
    const content = await readFile(node.handle as FileSystemFileHandle)
    const language = getLanguageFromPath(node.name)
    const tab: EditorTab = {
      id: generateId(),
      filePath: node.path,
      fileName: node.name,
      language,
      content,
      isDirty: false,
      workspaceId: workspaces.find(w => node.path.startsWith(w.rootPath))?.id ?? '',
    }
    openTab(tab)
  }, [setSelectedFile, readFile, openTab, workspaces])

  const handleFolderClick = useCallback(async (node: FileNode) => {
    const workspace = workspaces.find(w => node.path.startsWith(w.rootPath))
    if (!workspace) return
    if (node.children && node.children.length > 0) {
      toggleFolder(workspace.id, node.id)
    } else {
      await expandFolder(workspace.id, node, updateWorkspaceTree, workspace)
    }
  }, [workspaces, toggleFolder, expandFolder, updateWorkspaceTree])

  const addBtn = (
    <button
      className="icon-btn"
      title={t('app.openFolder')}
      onClick={() => openFolder()}
      style={{ width: 18, height: 18, fontSize: 15, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--vsc-fg-muted)' }}
    >
      +
    </button>
  )

  if (view === 'settings') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <AppTitleBar />
        <div style={{ padding: '16px 12px', color: 'var(--vsc-fg-muted)', fontSize: 12 }}>
          Settings panel coming soon.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      <AppTitleBar />

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        
        {lastWorkspaceName && (
          <RestoreBanner
            name={lastWorkspaceName}
            onRestore={() => {
              restoreLastFolder({ alertOnDenied: true }).catch(console.warn)
            }}
          />
        )}

        
        <CollapsibleSection title={t('explorer.title')} action={addBtn}>
          {workspaces.length === 0 ? (
            <div style={{ padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
              <div style={{ color: 'var(--vsc-fg-muted)', fontSize: 11, marginBottom: 10 }}>
                {t('explorer.noFolderDesc')}
              </div>
              <button
                className="vsc-btn vsc-btn-primary"
                onClick={() => openFolder()}
                style={{ width: '100%', fontSize: 11 }}
              >
                {t('app.openFolder')}
              </button>
            </div>
          ) : (
            workspaces.map(workspace => (

              <CollapsibleSection
                key={workspace.id}
                title={workspace.name}
                defaultOpen
                indent={0}
                action={
                  <button
                    className="icon-btn"
                    title={t('explorer.removeFolder')}
                    onClick={() => removeWorkspace(workspace.id)}
                    style={{ width: 16, height: 16, fontSize: 13, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--vsc-fg-inactive)', opacity: 0.7 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--vsc-error)'; (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--vsc-fg-inactive)'; (e.currentTarget as HTMLButtonElement).style.opacity = '0.7' }}
                  >
                    ×
                  </button>
                }
              >
                {workspace.tree.map(node => (
                  <FileTreeNode
                    key={node.id}
                    node={node}
                    depth={1}
                    isSelected={selectedFilePath === node.path}
                    onFileClick={handleFileClick}
                    onFolderClick={handleFolderClick}
                  />
                ))}
              </CollapsibleSection>
            ))
          )}

          {workspaces.length > 0 && (
            <div style={{ padding: '4px 8px 8px' }}>
              <button
                className="vsc-btn vsc-btn-ghost"
                onClick={() => openFolder()}
                style={{ width: '100%', fontSize: 11 }}
              >
                {t('explorer.addFolder')}
              </button>
            </div>
          )}
        </CollapsibleSection>

        
        <CollapsibleSection title="Documentation" defaultOpen={false}>
          <div style={{ padding: '8px 16px', color: 'var(--vsc-fg-inactive)', fontSize: 11, fontStyle: 'italic' }}>
            Coming soon — load project docs here.
          </div>
        </CollapsibleSection>
      </div>
    </div>
  )
}
