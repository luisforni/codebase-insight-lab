import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAgentStore } from '../../store/agentStore'
import { useEditorStore } from '../../store/editorStore'
import { useFileStore } from '../../store/fileStore'
import { MarkdownContent } from './AgentResponse'

export function SummaryTab() {
  const { t } = useTranslation()
  const { summaryDocument, setSummaryDocument, selectedModel } = useAgentStore()
  const activeTab = useEditorStore(s => s.getActiveTab())
  const { activeWorkspaceId } = useFileStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')

  const handleGenerate = async () => {
    if (!activeTab || !activeWorkspaceId) return
    setIsGenerating(true)
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: activeTab.filePath,
          content: activeTab.content,
          workspaceId: activeWorkspaceId,
          modelConfig: { provider: selectedModel.provider, modelId: selectedModel.modelId },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setSummaryDocument(data.document ?? '')
      }
    } catch {
      
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEdit = () => {
    setEditContent(summaryDocument)
    setIsEditing(true)
  }

  const handleSave = () => {
    setSummaryDocument(editContent)
    setIsEditing(false)
  }

  const handleExport = () => {
    const blob = new Blob([summaryDocument], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab?.fileName ?? 'summary'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      <div style={{
        flexShrink: 0, padding: '8px 10px',
        borderBottom: '1px solid var(--vsc-border)',
        display: 'flex', gap: 6, alignItems: 'center',
        background: '#1e1e1e',
      }}>
        <button
          className="vsc-btn vsc-btn-primary"
          onClick={handleGenerate}
          disabled={isGenerating || !activeTab}
          style={{ fontSize: 11 }}
        >
          {isGenerating ? t('ai.summaryGenerating') : t('ai.summaryGenerate')}
        </button>

        {summaryDocument && !isEditing && (
          <>
            <button className="vsc-btn" onClick={handleEdit} style={{ fontSize: 11 }}>
              {t('ai.summaryEdit')}
            </button>
            <button className="vsc-btn" onClick={handleExport} style={{ fontSize: 11 }}>
              {t('ai.summaryExport')}
            </button>
          </>
        )}
        {isEditing && (
          <>
            <button className="vsc-btn vsc-btn-primary" onClick={handleSave} style={{ fontSize: 11 }}>
              {t('ai.summarySave')}
            </button>
            <button className="vsc-btn" onClick={() => setIsEditing(false)} style={{ fontSize: 11 }}>
              ✕
            </button>
          </>
        )}
      </div>

      
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            style={{
              width: '100%', height: '100%', boxSizing: 'border-box',
              background: 'var(--vsc-bg-input)', border: '1px solid var(--vsc-accent)',
              borderRadius: 3, color: 'var(--vsc-fg-primary)',
              fontFamily: 'var(--vsc-font-mono)', fontSize: 12,
              outline: 'none', resize: 'none', padding: '8px', lineHeight: 1.6,
            }}
          />
        ) : summaryDocument ? (
          <MarkdownContent content={summaryDocument} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--vsc-fg-inactive)', gap: 10, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 32 }}>📄</div>
            <div style={{ fontWeight: 600, color: 'var(--vsc-fg-muted)', fontSize: 13 }}>{t('ai.summaryNoDoc')}</div>
            <div style={{ fontSize: 11 }}>{t('ai.summaryNoDocDesc')}</div>
          </div>
        )}
      </div>
    </div>
  )
}
