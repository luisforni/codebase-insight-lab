import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../../store/editorStore'
import { useFileStore } from '../../store/fileStore'
import { useRunProject } from '../../hooks/useRunProject'
import { useProjectAnalyzer } from '../../hooks/useProjectAnalyzer'
import { RunDialog } from './RunDialog'

export function EditorTabs() {
  const { t } = useTranslation()
  const { tabs, activeTabId, setActiveTab, closeTab } = useEditorStore()
  const { activeWorkspaceId } = useFileStore()
  const {
    isOpen, openDialog, closeDialog,
    command, setCommand, omitPatterns, setOmitPatterns,
    contextPrompt, setContextPrompt,
    isRunning, execute,
    lastOutput, lastExitCode,
  } = useRunProject()

  const { analyzeProject, isAnalyzingProject } = useProjectAnalyzer()

  const hasWorkspace = !!activeWorkspaceId

  return (
    <>
      <div style={{
        display: 'flex',
        height: 'var(--vsc-tab-height)',
        background: 'var(--vsc-bg-tab-bar)',
        borderBottom: '1px solid var(--vsc-border)',
        overflowX: 'auto',
        overflowY: 'hidden',
        flexShrink: 0,
        alignItems: 'stretch',
      }}>
        
        <div style={{ display: 'flex', flex: 1, overflowX: 'auto', overflowY: 'hidden', minWidth: 0 }}>
          {tabs.map(tab => {
            const isActive = tab.id === activeTabId
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.filePath}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0 12px 0 14px',
                  height: '100%',
                  cursor: 'pointer',
                  background: isActive ? 'var(--vsc-bg-tab-active)' : 'var(--vsc-bg-tab)',
                  color: isActive ? 'var(--vsc-fg-primary)' : 'var(--vsc-fg-tab-inactive)',
                  borderTop: isActive ? '1px solid var(--vsc-accent)' : '1px solid transparent',
                  borderRight: '1px solid var(--vsc-border)',
                  fontSize: 'var(--vsc-font-size)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  minWidth: 80,
                  maxWidth: 200,
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                  {tab.isDirty && <span style={{ color: 'var(--vsc-accent)' }}>● </span>}
                  {tab.fileName}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); closeTab(tab.id) }}
                  style={{
                    width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'var(--vsc-fg-muted)', borderRadius: 3, flexShrink: 0,
                    fontSize: 14, lineHeight: 1,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>

        
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '0 8px',
          borderLeft: '1px solid var(--vsc-border)',
          flexShrink: 0,
        }}>
          
          <button
            onClick={analyzeProject}
            disabled={!hasWorkspace || isAnalyzingProject}
            title={hasWorkspace ? t('run.analyzeProject') : t('app.openToStart')}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 9px',
              background: 'transparent',
              border: '1px solid var(--vsc-border)',
              borderRadius: 3,
              color: !hasWorkspace || isAnalyzingProject ? 'var(--vsc-fg-inactive)' : '#4ec9b0',
              cursor: !hasWorkspace || isAnalyzingProject ? 'not-allowed' : 'pointer',
              fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
              opacity: !hasWorkspace ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (hasWorkspace && !isAnalyzingProject) e.currentTarget.style.background = 'rgba(78,201,176,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            {isAnalyzingProject ? '⏳' : '🔍'} {isAnalyzingProject ? t('run.analyzingProject') : t('run.analyzeProject')}
          </button>

          
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {lastExitCode !== null && (
              <span
                title={`${t('run.lastRun')}: ${lastExitCode === 0 ? '✓ OK' : `✗ exit ${lastExitCode}`}`}
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: lastExitCode === 0 ? '#4ec9b0' : '#f44747',
                  flexShrink: 0,
                  cursor: 'default',
                }}
              />
            )}
            <button
              onClick={openDialog}
              disabled={isRunning}
              title={t('run.title')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '3px 10px',
                background: isRunning ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: '1px solid var(--vsc-border)',
                borderRadius: 3,
                color: isRunning ? 'var(--vsc-fg-muted)' : 'var(--vsc-fg-secondary)',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (!isRunning) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { if (!isRunning) e.currentTarget.style.background = 'transparent' }}
            >
              {isRunning ? t('run.runningBtn') : t('run.runBtn')}
            </button>
          </div>
        </div>
      </div>

      <RunDialog
        isOpen={isOpen}
        onClose={closeDialog}
        command={command}
        onCommandChange={setCommand}
        omitPatterns={omitPatterns}
        onOmitChange={setOmitPatterns}
        contextPrompt={contextPrompt}
        onContextChange={setContextPrompt}
        onExecute={execute}
        isRunning={isRunning}
        lastOutput={lastOutput}
        lastExitCode={lastExitCode}
      />
    </>
  )
}
