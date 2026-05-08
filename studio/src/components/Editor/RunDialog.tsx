import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface RunDialogProps {
  isOpen: boolean
  onClose: () => void
  command: string
  onCommandChange: (cmd: string) => void
  omitPatterns: string
  onOmitChange: (s: string) => void
  contextPrompt: string
  onContextChange: (s: string) => void
  onExecute: () => void
  isRunning: boolean
  lastOutput?: string
  lastExitCode?: number | null
}



function detectEnvHint(command: string, output: string): string | null {
  const cmd = command.toLowerCase()
  const out = output.toLowerCase()

  if (cmd.includes('docker') || cmd.includes('docker-compose') || cmd.includes('compose')) {
    if (out.includes('cannot connect to the docker daemon') || out.includes('is the docker daemon running') || out.includes('docker desktop') || out.includes('no such file or directory') && out.includes('docker')) {
      return 'docker_not_running'
    }
    if (out.includes('permission denied') && out.includes('docker.sock')) {
      return 'docker_permission'
    }
  }

  if (cmd.includes('npm') || cmd.includes('node')) {
    if (out.includes('command not found') || out.includes('not recognized')) {
      return 'node_not_found'
    }
  }

  if (cmd.includes('python') || cmd.includes('pip')) {
    if (out.includes('command not found') || out.includes('not recognized')) {
      return 'python_not_found'
    }
  }

  if (cmd.includes('cargo') || cmd.includes('rust')) {
    if (out.includes('command not found') || out.includes('not recognized')) {
      return 'rust_not_found'
    }
  }

  if (out.includes('port') && (out.includes('already in use') || out.includes('address already in use'))) {
    return 'port_in_use'
  }

  if (out.includes('enoent') || (out.includes('no such file') && !out.includes('docker'))) {
    return 'file_not_found'
  }

  return null
}

const ENV_HINT_MESSAGES: Record<string, { icon: string; title: string; detail: string }> = {
  docker_not_running: {
    icon: '🐳',
    title: 'Docker no está corriendo',
    detail: 'Inicia Docker Desktop (Windows/Mac) o el servicio Docker antes de ejecutar.',
  },
  docker_permission: {
    icon: '🔒',
    title: 'Sin permisos de Docker',
    detail: 'Agrega tu usuario al grupo docker: sudo usermod -aG docker $USER',
  },
  node_not_found: {
    icon: '📦',
    title: 'Node.js no encontrado',
    detail: 'Instala Node.js desde nodejs.org o verifica que esté en el PATH.',
  },
  python_not_found: {
    icon: '🐍',
    title: 'Python no encontrado',
    detail: 'Instala Python desde python.org o verifica que esté en el PATH.',
  },
  rust_not_found: {
    icon: '⚙️',
    title: 'Rust/Cargo no encontrado',
    detail: 'Instala Rust desde rustup.rs o verifica que esté en el PATH.',
  },
  port_in_use: {
    icon: '🔌',
    title: 'Puerto ya en uso',
    detail: 'Otro proceso está usando ese puerto. Detén el proceso o cambia el puerto.',
  },
  file_not_found: {
    icon: '📄',
    title: 'Archivo o directorio no encontrado',
    detail: 'Verifica que el comando se ejecute desde el directorio correcto.',
  },
}



export function RunDialog({
  isOpen, onClose, command, onCommandChange,
  omitPatterns, onOmitChange, contextPrompt, onContextChange,
  onExecute, isRunning, lastOutput, lastExitCode,
}: RunDialogProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [showLastRun, setShowLastRun] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      
      if (lastExitCode !== null && lastExitCode !== undefined && lastExitCode !== 0) {
        setShowLastRun(true)
      }
    }
  }, [isOpen, lastExitCode])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const hasLastRun = lastExitCode !== null && lastExitCode !== undefined
  const lastRunFailed = hasLastRun && lastExitCode !== 0
  const envHintKey = lastRunFailed && lastOutput ? detectEnvHint(command, lastOutput) : null
  const envHint = envHintKey ? ENV_HINT_MESSAGES[envHintKey] : null

  const fieldStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--vsc-bg-input)', border: '1px solid var(--vsc-border)',
    borderRadius: 3, padding: '5px 8px',
    color: 'var(--vsc-fg-primary)', fontSize: 13, outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: 4,
    color: 'var(--vsc-fg-muted)', fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={onClose} />
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 999,
        background: '#252526',
        border: '1px solid var(--vsc-border)',
        borderRadius: 6,
        padding: 20,
        width: 500,
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        fontFamily: 'var(--vsc-font-ui)',
        fontSize: 'var(--vsc-font-size)',
      }}>
        <h3 style={{ margin: '0 0 16px', color: 'var(--vsc-fg-primary)', fontSize: 14, fontWeight: 600 }}>
          {t('run.title')}
        </h3>

        
        {envHint && (
          <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            background: 'rgba(244,71,71,0.08)', border: '1px solid rgba(244,71,71,0.3)',
            borderRadius: 4, padding: '8px 12px', marginBottom: 14,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{envHint.icon}</span>
            <div>
              <div style={{ fontWeight: 600, color: '#f44747', fontSize: 12, marginBottom: 2 }}>{envHint.title}</div>
              <div style={{ color: 'var(--vsc-fg-muted)', fontSize: 11 }}>{envHint.detail}</div>
            </div>
          </div>
        )}

        <label style={labelStyle}>{t('run.command')}</label>
        <input
          ref={inputRef}
          value={command}
          onChange={e => onCommandChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && command.trim()) onExecute() }}
          placeholder="npm start / docker-compose up / python main.py"
          style={{ ...fieldStyle, fontFamily: 'var(--vsc-font-mono)', marginBottom: 12 }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--vsc-accent)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--vsc-border)')}
        />

        <label style={labelStyle}>{t('run.omit')}</label>
        <input
          value={omitPatterns}
          onChange={e => onOmitChange(e.target.value)}
          placeholder={t('run.omitHint')}
          style={{ ...fieldStyle, fontFamily: 'var(--vsc-font-mono)', marginBottom: 12 }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--vsc-accent)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--vsc-border)')}
        />

        <label style={labelStyle}>{t('run.contextPrompt')}</label>
        <textarea
          value={contextPrompt}
          onChange={e => onContextChange(e.target.value)}
          placeholder={t('run.contextHint')}
          rows={3}
          style={{ ...fieldStyle, fontFamily: 'var(--vsc-font-ui)', resize: 'vertical', marginBottom: 16 }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--vsc-accent)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--vsc-border)')}
        />

        
        {hasLastRun && (
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => setShowLastRun(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                width: '100%', background: 'transparent', border: 'none',
                cursor: 'pointer', padding: '0 0 6px',
                color: lastRunFailed ? '#f44747' : '#4ec9b0',
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: lastRunFailed ? '#f44747' : '#4ec9b0',
              }} />
              {t('run.lastRun')} — exit {lastExitCode}
              <span style={{ marginLeft: 'auto', color: 'var(--vsc-fg-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                {showLastRun ? '▲' : '▼'}
              </span>
            </button>
            {showLastRun && (
              <pre style={{
                background: '#0d0d0d', border: '1px solid var(--vsc-border)',
                borderRadius: 4, padding: '8px 10px', margin: 0,
                fontSize: 11, color: lastRunFailed ? '#f07070' : 'var(--vsc-fg-muted)',
                fontFamily: 'var(--vsc-font-mono)', whiteSpace: 'pre-wrap',
                wordBreak: 'break-all', maxHeight: 180, overflowY: 'auto',
                userSelect: 'text',
              }}>
                {lastOutput || '(no output)'}
              </pre>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '5px 16px', background: 'transparent',
              border: '1px solid var(--vsc-border)', borderRadius: 3,
              color: 'var(--vsc-fg-secondary)', cursor: 'pointer', fontSize: 13,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {t('run.skip')}
          </button>
          <button
            onClick={onExecute}
            disabled={!command.trim() || isRunning}
            style={{
              padding: '5px 16px',
              background: command.trim() && !isRunning ? 'var(--vsc-accent)' : '#555',
              border: 'none', borderRadius: 3,
              color: '#fff', cursor: command.trim() && !isRunning ? 'pointer' : 'not-allowed',
              fontSize: 13,
            }}
          >
            {isRunning ? t('run.running') : t('run.execute')}
          </button>
        </div>
      </div>
    </>
  )
}
