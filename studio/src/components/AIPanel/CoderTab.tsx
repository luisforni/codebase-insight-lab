import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAgentStore } from '../../store/agentStore'
import { useEditorStore } from '../../store/editorStore'
import { useFileStore } from '../../store/fileStore'
import { useFileSystem } from '../../hooks/useFileSystem'
import { CodeDiffCard } from './CodeDiff'

export function CoderTab() {
  const { t, i18n } = useTranslation()
  const { codeEdits, acceptCodeEdit, acceptAllCodeEdits, rejectAllCodeEdits, clearCodeEdits, isAnalyzing, selectedModel, addCodeEdit } = useAgentStore()
  const activeTab = useEditorStore(s => s.getActiveTab())
  const updateTabContent = useEditorStore(s => s.updateTabContent)
  const getActiveWorkspace = useFileStore(s => s.getActiveWorkspace)
  const { activeWorkspaceId } = useFileStore()
  const { writeFile } = useFileSystem()
  const [task, setTask] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const pendingEdits = codeEdits.filter(e => e.status === 'pending')
  const hasEdits = codeEdits.length > 0

  const handleAcceptAll = async () => {
    const ws = getActiveWorkspace()
    if (!ws) {
      acceptAllCodeEdits()
      return
    }
    for (const edit of pendingEdits) {
      const ok = await writeFile(edit.filePath, edit.modifiedContent, ws.handle, ws.rootPath)
      if (ok) {
        updateTabContent(edit.filePath, edit.modifiedContent)
        acceptCodeEdit(edit.id)
      }
    }
  }

  const handleGenerate = async () => {
    if (!task.trim() || !activeTab || !activeWorkspaceId) return
    setIsGenerating(true)
    try {
      const res = await fetch('/api/coder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task,
          filePath: activeTab.filePath,
          content: activeTab.content,
          workspaceId: activeWorkspaceId,
          uiLang: i18n.language,
          modelConfig: { provider: selectedModel.provider, modelId: selectedModel.modelId },
        }),
      })
      if (res.ok) {
        const data = await res.json() as {
          edits: Array<{ description: string; original_content: string; modified_content: string }>
        }
        for (const edit of data.edits ?? []) {
          addCodeEdit({
            id: Math.random().toString(36).slice(2, 10),
            filePath: activeTab.filePath,
            fileName: activeTab.fileName,
            description: edit.description ?? '',
            originalContent: edit.original_content ?? '',
            modifiedContent: edit.modified_content ?? '',
            diff: '',
            status: 'pending',
            timestamp: Date.now(),
            agentId: 'coder',
          })
        }
        setTask('')
      }
    } catch {
      
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      <div style={{ flexShrink: 0, padding: '10px', borderBottom: '1px solid var(--vsc-border)' }}>
        <textarea
          value={task}
          onChange={e => setTask(e.target.value)}
          placeholder={t('ai.coderTaskPlaceholder')}
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '7px 9px',
            background: 'var(--vsc-bg-input)', border: '1px solid var(--vsc-border)',
            borderRadius: 4, color: 'var(--vsc-fg-primary)',
            fontFamily: 'var(--vsc-font-ui)', fontSize: 12,
            outline: 'none', resize: 'vertical', lineHeight: 1.5,
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--vsc-accent)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--vsc-border)')}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleGenerate() }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
          <button
            className="vsc-btn vsc-btn-primary"
            onClick={handleGenerate}
            disabled={!task.trim() || isGenerating || !activeTab}
            style={{ fontSize: 12 }}
          >
            {isGenerating ? t('ai.coderGenerating') : t('ai.coderGenerate')}
          </button>
        </div>
      </div>

      
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        {!hasEdits ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--vsc-fg-inactive)', gap: 10, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 32 }}>✏️</div>
            <div style={{ fontWeight: 600, color: 'var(--vsc-fg-muted)', fontSize: 13 }}>{t('ai.coderNoPending')}</div>
            <div style={{ fontSize: 11 }}>{t('ai.coderNoPendingDesc')}</div>
          </div>
        ) : (
          codeEdits.map(edit => <CodeDiffCard key={edit.id} edit={edit} />)
        )}
      </div>

      
      {pendingEdits.length > 0 && (
        <div style={{
          flexShrink: 0, padding: '8px 10px',
          borderTop: '1px solid var(--vsc-border)',
          display: 'flex', gap: 6, alignItems: 'center',
          background: '#1a1a1a',
        }}>
          <span style={{ fontSize: 11, color: 'var(--vsc-fg-inactive)', flex: 1 }}>
            {pendingEdits.length} {pendingEdits.length === 1 ? t('diff.change') : t('diff.changes')}
          </span>
          <button className="vsc-btn vsc-btn-primary" onClick={handleAcceptAll} style={{ fontSize: 11 }}>
            {t('ai.coderAcceptAll')}
          </button>
          <button
            className="vsc-btn"
            onClick={rejectAllCodeEdits}
            style={{ fontSize: 11, color: '#f44747', borderColor: '#f44747' }}
          >
            {t('ai.coderRejectAll')}
          </button>
        </div>
      )}
      {hasEdits && pendingEdits.length === 0 && (
        <div style={{ flexShrink: 0, padding: '8px 10px', borderTop: '1px solid var(--vsc-border)', background: '#1a1a1a' }}>
          <button className="vsc-btn" onClick={clearCodeEdits} style={{ fontSize: 11, width: '100%' }}>
            {t('ai.clearResponses')}
          </button>
        </div>
      )}
    </div>
  )
}
