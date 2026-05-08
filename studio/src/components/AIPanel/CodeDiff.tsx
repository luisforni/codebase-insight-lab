import { useTranslation } from 'react-i18next'
import { CodeEdit } from '../../types'
import { useAgentStore } from '../../store/agentStore'
import { useFileStore } from '../../store/fileStore'
import { useEditorStore } from '../../store/editorStore'
import { useFileSystem } from '../../hooks/useFileSystem'

interface DiffLineProps {
  line: string
  type: 'added' | 'removed' | 'context'
}

function DiffLine({ line, type }: DiffLineProps) {
  const bg = type === 'added' ? 'rgba(115,201,145,0.12)' : type === 'removed' ? 'rgba(244,71,71,0.12)' : 'transparent'
  const color = type === 'added' ? '#73c991' : type === 'removed' ? '#f44747' : 'var(--vsc-fg-secondary)'
  const prefix = type === 'added' ? '+' : type === 'removed' ? '-' : ' '

  return (
    <div style={{ background: bg, color, fontFamily: 'var(--vsc-font-mono)', fontSize: 11, lineHeight: 1.6, padding: '0 8px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
      {prefix} {line}
    </div>
  )
}

function parseDiff(originalContent: string, modifiedContent: string): DiffLineProps[] {
  const origLines = originalContent.split('\n')
  const modLines = modifiedContent.split('\n')

  const lines: DiffLineProps[] = []

  const maxContext = 3
  let i = 0, j = 0

  while (i < origLines.length || j < modLines.length) {
    if (i < origLines.length && j < modLines.length && origLines[i] === modLines[j]) {
      lines.push({ line: origLines[i], type: 'context' })
      i++; j++
    } else {
      if (i < origLines.length) lines.push({ line: origLines[i++], type: 'removed' })
      if (j < modLines.length) lines.push({ line: modLines[j++], type: 'added' })
    }
  }

  
  const result: DiffLineProps[] = []
  let contextRun = 0
  for (let k = 0; k < lines.length; k++) {
    if (lines[k].type === 'context') {
      contextRun++
      if (contextRun <= maxContext || (k >= lines.length - maxContext)) {
        result.push(lines[k])
      } else if (contextRun === maxContext + 1) {
        result.push({ line: '...', type: 'context' })
      }
    } else {
      contextRun = 0
      result.push(lines[k])
    }
  }
  return result
}

interface CodeDiffCardProps {
  edit: CodeEdit
}

export function CodeDiffCard({ edit }: CodeDiffCardProps) {
  const { t } = useTranslation()
  const { acceptCodeEdit, rejectCodeEdit } = useAgentStore()
  const getActiveWorkspace = useFileStore(s => s.getActiveWorkspace)
  const updateTabContent = useEditorStore(s => s.updateTabContent)
  const { writeFile } = useFileSystem()
  const diffLines = parseDiff(edit.originalContent, edit.modifiedContent)

  const isPending = edit.status === 'pending'

  const handleAccept = async () => {
    const ws = getActiveWorkspace()
    if (ws) {
      const ok = await writeFile(edit.filePath, edit.modifiedContent, ws.handle, ws.rootPath)
      if (!ok) return
      updateTabContent(edit.filePath, edit.modifiedContent)
    }
    acceptCodeEdit(edit.id)
  }

  return (
    <div style={{
      border: `1px solid ${edit.status === 'accepted' ? '#73c991' : edit.status === 'rejected' ? '#f44747' : 'var(--vsc-border)'}`,
      borderRadius: 4,
      marginBottom: 10,
      overflow: 'hidden',
      opacity: isPending ? 1 : 0.7,
    }}>
      
      <div style={{
        padding: '6px 10px',
        background: '#1e1e1e',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: '1px solid var(--vsc-border)',
      }}>
        <span style={{ fontFamily: 'var(--vsc-font-mono)', fontSize: 11, color: 'var(--vsc-fg-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {edit.fileName}
        </span>
        {edit.status !== 'pending' && (
          <span style={{ fontSize: 10, color: edit.status === 'accepted' ? '#73c991' : '#f44747', textTransform: 'uppercase', fontWeight: 600 }}>
            {edit.status === 'accepted' ? t('diff.applied') : t('diff.rejected')}
          </span>
        )}
        {isPending && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="vsc-btn vsc-btn-primary"
              onClick={handleAccept}
              style={{ fontSize: 10, padding: '2px 8px' }}
            >
              {t('diff.accept')}
            </button>
            <button
              className="vsc-btn"
              onClick={() => rejectCodeEdit(edit.id)}
              style={{ fontSize: 10, padding: '2px 8px', color: '#f44747', borderColor: '#f44747' }}
            >
              {t('diff.reject')}
            </button>
          </div>
        )}
      </div>

      
      {edit.description && (
        <div style={{ padding: '4px 10px', fontSize: 11, color: 'var(--vsc-fg-inactive)', borderBottom: '1px solid var(--vsc-border)', background: '#181818' }}>
          {edit.description}
        </div>
      )}

      
      <div style={{ maxHeight: 240, overflowY: 'auto', background: '#0d0d0d' }}>
        {diffLines.map((line, i) => (
          <DiffLine key={i} line={line.line} type={line.type} />
        ))}
      </div>
    </div>
  )
}
