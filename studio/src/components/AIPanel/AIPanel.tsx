import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAgentStore } from '../../store/agentStore'
import { AnalysisTab } from './AnalysisTab'
import { CoderTab } from './CoderTab'
import { SummaryTab } from './SummaryTab'

type TabId = 'analysis' | 'coder' | 'summary'

export function AIPanel() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabId>('analysis')
  const wsConnected = useAgentStore(s => s.wsConnected)

  const tabs: { id: TabId; label: string }[] = [
    { id: 'analysis', label: t('ai.analysis') },
    { id: 'coder',    label: t('ai.coder') },
    { id: 'summary',  label: t('ai.summary') },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--vsc-border)',
        background: '#1e1e1e',
        flexShrink: 0,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '8px 4px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--vsc-accent)' : 'transparent'}`,
              color: activeTab === tab.id ? 'var(--vsc-fg-primary)' : 'var(--vsc-fg-inactive)',
              fontSize: 12,
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
              letterSpacing: '0.03em',
            }}
          >
            {tab.label}
          </button>
        ))}

        
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '0 8px', flexShrink: 0,
        }}>
          <span
            style={{
              display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
              background: wsConnected ? '#73c991' : '#6a6a6a',
              boxShadow: wsConnected ? '0 0 4px #73c991' : 'none',
            }}
            title={wsConnected ? t('ai.connected') : t('ai.disconnected')}
          />
        </div>
      </div>

      
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'analysis' && <AnalysisTab />}
        {activeTab === 'coder'    && <CoderTab />}
        {activeTab === 'summary'  && <SummaryTab />}
      </div>
    </div>
  )
}
