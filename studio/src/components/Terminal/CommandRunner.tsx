import { useState, useRef, useEffect } from 'react'
import { CommandEntry } from '../../types'
import { api } from '../../services/api'
import { useAgents } from '../../hooks/useAgents'
import { useFileStore } from '../../store/fileStore'

function generateId() { return Math.random().toString(36).slice(2, 10) }

export function CommandRunner() {
  const [entries, setEntries] = useState<CommandEntry[]>([])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { runCommand } = useAgents()
  const { activeWorkspaceId } = useFileStore()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  const execute = async () => {
    if (!input.trim()) return
    const cmd = input.trim()
    setHistory(h => [cmd, ...h.slice(0, 99)])
    setHistoryIdx(-1)
    setInput('')

    const id = generateId()
    setEntries(e => [...e, { id, command: cmd, output: '', exitCode: null, timestamp: Date.now(), isRunning: true }])

    try {
      const result = await api.runCommand({ command: cmd, workingDir: '.' })
      setEntries(e => e.map(entry =>
        entry.id === id
          ? { ...entry, output: result.output, exitCode: result.exitCode, isRunning: false }
          : entry
      ))
      if (result.output && activeWorkspaceId) {
        runCommand(`${cmd}\n\n${result.output}`, activeWorkspaceId)
      }
    } catch (err) {
      setEntries(e => e.map(entry =>
        entry.id === id
          ? { ...entry, output: `Error: ${(err as Error).message}`, exitCode: 1, isRunning: false }
          : entry
      ))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { execute(); return }
    if (e.key === 'ArrowUp') {
      const idx = Math.min(historyIdx + 1, history.length - 1)
      setHistoryIdx(idx)
      setInput(history[idx] ?? '')
    }
    if (e.key === 'ArrowDown') {
      const idx = Math.max(historyIdx - 1, -1)
      setHistoryIdx(idx)
      setInput(idx === -1 ? '' : history[idx])
    }
  }

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: 'var(--vsc-bg-terminal)',
        borderTop: '1px solid var(--vsc-border)',
        fontFamily: 'var(--vsc-font-mono)',
        fontSize: 13,
      }}
      onClick={() => inputRef.current?.focus()}
    >
      
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '4px 10px',
        background: '#2d2d2d',
        borderBottom: '1px solid var(--vsc-border)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 'var(--vsc-font-size-sm)', color: 'var(--vsc-fg-muted)', fontFamily: 'var(--vsc-font-ui)', fontWeight: 700 }}>
          TERMINAL
        </span>
        <button
          className="icon-btn"
          onClick={() => setEntries([])}
          title="Clear"
          style={{ marginLeft: 'auto', fontSize: 12 }}
        >
          🗑
        </button>
      </div>

      
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {entries.map(entry => (
          <div key={entry.id} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#73c991' }}>$</span>
              <span style={{ color: 'var(--vsc-fg-primary)' }}>{entry.command}</span>
              {entry.isRunning && <div className="spinner" style={{ width: 10, height: 10 }} />}
            </div>
            {entry.output && (
              <pre style={{
                margin: '4px 0 0 16px',
                color: entry.exitCode === 0 ? 'var(--vsc-fg-secondary)' : '#f48771',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: 12,
              }}>
                {entry.output}
              </pre>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 12px',
        borderTop: '1px solid var(--vsc-border)',
        flexShrink: 0,
      }}>
        <span style={{ color: '#73c991', flexShrink: 0 }}>$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command..."
          style={{
            flex: 1, background: 'transparent', border: 'none',
            color: 'var(--vsc-fg-primary)', fontFamily: 'var(--vsc-font-mono)',
            fontSize: 13, outline: 'none',
          }}
          autoFocus
        />
      </div>
    </div>
  )
}
