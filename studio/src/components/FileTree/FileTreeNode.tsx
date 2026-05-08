import { FileNode } from '../../types'

interface Props {
  node: FileNode
  depth: number
  isSelected: boolean
  onFileClick: (node: FileNode) => void
  onFolderClick: (node: FileNode) => void
}

const INDENT_SIZE = 12

const FILE_ICONS: Record<string, { icon: string; color: string }> = {
  typescript: { icon: 'TS', color: '#3178c6' },
  javascript: { icon: 'JS', color: '#f7df1e' },
  python: { icon: 'PY', color: '#3572a5' },
  rust: { icon: 'RS', color: '#dea584' },
  go: { icon: 'GO', color: '#00add8' },
  java: { icon: 'JV', color: '#b07219' },
  css: { icon: 'CS', color: '#563d7c' },
  html: { icon: 'HT', color: '#e34c26' },
  json: { icon: '{}', color: '#cbcb41' },
  markdown: { icon: 'MD', color: '#a0a0a0' },
  yaml: { icon: 'YM', color: '#cb171e' },
  shell: { icon: 'SH', color: '#89e051' },
  sql: { icon: 'SQ', color: '#336791' },
  dockerfile: { icon: 'DF', color: '#384d54' },
}

function FileIcon({ language }: { language?: string }) {
  const info = language ? FILE_ICONS[language] : null
  if (!info) {
    return (
      <span style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--vsc-fg-inactive)">
          <path d="M9 1.5H3.5v13h9V5.5L9 1.5zm0 1.7L10.8 5H9V3.2zM3.5 2.5H8v3h3v8h-7.5v-11z"/>
        </svg>
      </span>
    )
  }
  return (
    <span style={{
      width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '8px', fontWeight: 700, color: info.color, fontFamily: 'var(--vsc-font-mono)',
      background: `${info.color}22`, borderRadius: 2, flexShrink: 0,
    }}>
      {info.icon}
    </span>
  )
}

function FolderIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={isOpen ? '#dcb67a' : '#c8a84b'} style={{ flexShrink: 0 }}>
      {isOpen
        ? <path d="M1.5 14h13l1-8H1l.5 8zm13-9H7L6 3H1.5l-.5 11V2.5h6l1 1.5h6.5V5z"/>
        : <path d="M.5 2h6l1 1.5H15.5l.5 1.5v9l-.5.5H.5L0 14V2.5L.5 2zm0 2.5v9h15v-9h-15z"/>
      }
    </svg>
  )
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="var(--vsc-fg-muted)"
      style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.1s', flexShrink: 0 }}>
      <path d="M6 4l4 4-4 4"/>
    </svg>
  )
}

export function FileTreeNode({ node, depth, isSelected, onFileClick, onFolderClick }: Props) {
  const isDir = node.type === 'directory'
  const paddingLeft = `${depth * INDENT_SIZE + 8}px`

  return (
    <div>
      <div
        onClick={() => isDir ? onFolderClick(node) : onFileClick(node)}
        title={node.path}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          paddingLeft,
          paddingRight: '8px',
          height: '22px',
          cursor: 'pointer',
          background: isSelected ? 'var(--vsc-bg-selected)' : 'transparent',
          color: isSelected ? '#ffffff' : 'var(--vsc-fg-primary)',
          fontSize: 'var(--vsc-font-size)',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--vsc-bg-hover)'
        }}
        onMouseLeave={e => {
          if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'
        }}
      >
        {isDir ? (
          <>
            <ChevronIcon isOpen={!!node.isExpanded} />
            <FolderIcon isOpen={!!node.isExpanded} />
          </>
        ) : (
          <>
            <span style={{ width: 12, flexShrink: 0 }} />
            <FileIcon language={node.language} />
          </>
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
          {node.name}
        </span>
      </div>

      {isDir && node.isExpanded && node.children && node.children.map(child => (
        <FileTreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          isSelected={isSelected && child.path === node.path}
          onFileClick={onFileClick}
          onFolderClick={onFolderClick}
        />
      ))}
    </div>
  )
}
