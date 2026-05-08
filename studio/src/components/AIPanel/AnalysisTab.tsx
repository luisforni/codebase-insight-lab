import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAgentStore } from '../../store/agentStore'
import { useEditorStore } from '../../store/editorStore'
import { useFileStore } from '../../store/fileStore'
import { useAgents } from '../../hooks/useAgents'
import { AgentResponseCard } from './AgentResponse'
import { ModelSelector } from './ModelSelector'
import { DepthMode, AgentId } from '../../types'

const ANALYSIS_AGENTS: AgentId[] = [
  'structure', 'functions', 'variables', 'imports',
  'business_logic', 'error_handling', 'security', 'logs', 'integration',
]

const DEPTH_MODES: DepthMode[] = ['summary', 'technical', 'complete', 'eli5', 'senior']

function DepthSelector() {
  const { t } = useTranslation()
  const { depthMode, setDepthMode } = useAgentStore()

  return (
    <div style={{ display: 'flex', gap: 4, padding: '4px 10px', overflowX: 'auto' }}>
      {DEPTH_MODES.map(mode => (
        <button
          key={mode}
          onClick={() => setDepthMode(mode)}
          title={t(`depth.${mode}`)}
          style={{
            padding: '2px 8px',
            borderRadius: 10,
            border: `1px solid ${depthMode === mode ? 'var(--vsc-accent)' : 'var(--vsc-border)'}`,
            background: depthMode === mode ? 'rgba(0,122,204,0.2)' : 'transparent',
            color: depthMode === mode ? 'var(--vsc-accent)' : 'var(--vsc-fg-inactive)',
            fontSize: 10,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s',
          }}
        >
          {t(`ai.depth${mode.charAt(0).toUpperCase() + mode.slice(1)}`)}
        </button>
      ))}
    </div>
  )
}

function AgentStatusDots() {
  const { agents } = useAgentStore()
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', padding: '4px 10px' }}>
      {ANALYSIS_AGENTS.map(id => {
        const agent = agents[id]
        if (!agent) return null
        const colors = { idle: '#4a4a4a', running: '#007acc', completed: '#73c991', error: '#f44747' }
        return (
          <span
            key={id}
            title={`${agent.name}: ${agent.status}`}
            style={{
              display: 'inline-block', width: 8, height: 8,
              borderRadius: '50%',
              background: colors[agent.status],
              transition: 'background 0.3s',
              boxShadow: agent.status === 'running' ? '0 0 4px #007acc' : 'none',
            }}
          />
        )
      })}
    </div>
  )
}

export function AnalysisTab() {
  const { t } = useTranslation()
  const { responses, activeResponseId, setActiveResponse, isAnalyzing, clearResponses, removeResponse } = useAgentStore()
  const { analyzeFile } = useAgents()
  const activeTab = useEditorStore(s => s.getActiveTab())
  const { activeWorkspaceId } = useFileStore()
  const [query, setQuery] = useState('')

  const handleSend = () => {
    if (!query.trim() || !activeTab || !activeWorkspaceId) return
    analyzeFile(activeTab.filePath, activeTab.content, activeWorkspaceId, query)
    setQuery('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      <div style={{ flexShrink: 0, borderBottom: '1px solid var(--vsc-border)' }}>
        <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <ModelSelector />
          {responses.length > 0 && (
            <button className="icon-btn" onClick={clearResponses} title={t('ai.clearResponses')} style={{ fontSize: 11, marginLeft: 4 }}>
              🗑
            </button>
          )}
        </div>
        <DepthSelector />
        <AgentStatusDots />
        {isAnalyzing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', color: 'var(--vsc-accent)', fontSize: 11 }}>
            <div className="spinner" />
            <span>{t('ai.analyzing')}</span>
          </div>
        )}
      </div>

      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {responses.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--vsc-fg-inactive)', gap: 10, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 32 }}>🤖</div>
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              {t('ai.noResponsesDesc')}
            </div>
          </div>
        ) : (
          responses.map(r => (
            <AgentResponseCard
              key={r.id}
              response={r}
              isActive={r.id === activeResponseId}
              onToggle={() => setActiveResponse(activeResponseId === r.id ? null : r.id)}
              onRemove={() => removeResponse(r.id)}
            />
          ))
        )}
      </div>

      
      <div style={{ flexShrink: 0, padding: '8px 10px', borderTop: '1px solid var(--vsc-border)', background: '#1a1a1a' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend() }}
            placeholder={t('ai.askPlaceholder')}
            style={{
              flex: 1, padding: '5px 8px',
              background: 'var(--vsc-bg-input)', border: '1px solid var(--vsc-border)',
              borderRadius: 3, color: 'var(--vsc-fg-primary)',
              fontFamily: 'var(--vsc-font-ui)', fontSize: 12, outline: 'none',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--vsc-accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--vsc-border)')}
          />
          <button
            className="vsc-btn vsc-btn-primary"
            onClick={handleSend}
            disabled={!query.trim()}
            style={{ flexShrink: 0, fontSize: 11 }}
          >
            {t('ai.send')}
          </button>
        </div>
      </div>
    </div>
  )
}
