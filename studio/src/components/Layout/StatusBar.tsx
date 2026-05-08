import { useEditorStore } from '../../store/editorStore'
import { useAgentStore } from '../../store/agentStore'

export function StatusBar() {
  const cursorPosition = useEditorStore(s => s.cursorPosition)
  const activeTab = useEditorStore(s => s.getActiveTab())
  const { selectedModel, isAnalyzing, wsConnected } = useAgentStore()
  const toggleTerminal = useEditorStore(s => s.toggleTerminal)

  return (
    <div style={{
      height: 'var(--vsc-status-bar-height)',
      background: isAnalyzing ? '#5a3e1b' : 'var(--vsc-bg-status-bar)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 8px',
      color: 'var(--vsc-fg-status-bar)',
      fontSize: 'var(--vsc-font-size-sm)',
      flexShrink: 0,
      transition: 'background 0.3s',
    }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <StatusItem
          icon={wsConnected ? '◉' : '○'}
          label={wsConnected ? 'Cortex connected' : 'Cortex offline'}
          color={wsConnected ? '#73c991' : '#f14c4c'}
        />
        {isAnalyzing && (
          <StatusItem icon="⟳" label="Agents analyzing..." />
        )}
      </div>

      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {activeTab && (
          <>
            <StatusItem label={`Ln ${cursorPosition.line}, Col ${cursorPosition.column}`} />
            <StatusItem label={activeTab.language} />
          </>
        )}
        <StatusItem
          label={selectedModel.displayName}
          onClick={() => {}}
          clickable
        />
        <StatusItem
          icon="⌨"
          label="Terminal"
          onClick={toggleTerminal}
          clickable
        />
      </div>
    </div>
  )
}

function StatusItem({
  icon, label, color, clickable, onClick,
}: {
  icon?: string
  label: string
  color?: string
  clickable?: boolean
  onClick?: () => void
}) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        color: color ?? 'inherit',
        cursor: clickable ? 'pointer' : 'default',
        padding: '0 4px',
        borderRadius: '2px',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (clickable) (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.12)' }}
      onMouseLeave={e => { if (clickable) (e.target as HTMLElement).style.background = 'transparent' }}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </span>
  )
}
