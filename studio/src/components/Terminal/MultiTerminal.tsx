import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { CommandEntry } from '../../types'

interface TerminalTabData {
  id: string
  name: string
  entries: CommandEntry[]
  history: string[]
  historyIndex: number
}

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

export function MultiTerminal() {
  const { t } = useTranslation()
  const [tabs, setTabs] = useState<TerminalTabData[]>([
    { id: generateId(), name: t('terminal.title'), entries: [], history: [], historyIndex: -1 },
  ])
  const [activeTabId, setActiveTabId] = useState(tabs[0].id)
  const [input, setInput] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeTab?.entries])

  useEffect(() => {
    inputRef.current?.focus()
  }, [activeTabId])

  const updateTab = useCallback((id: string, updater: (tab: TerminalTabData) => TerminalTabData) => {
    setTabs(prev => prev.map(t => t.id === id ? updater(t) : t))
  }, [])

  const addTab = () => {
    const id = generateId()
    const newTab: TerminalTabData = {
      id,
      name: `${t('terminal.title')} ${tabs.length + 1}`,
      entries: [],
      history: [],
      historyIndex: -1,
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(id)
  }

  const closeTab = (id: string) => {
    if (tabs.length === 1) return
    const idx = tabs.findIndex(t => t.id === id)
    setTabs(prev => prev.filter(t => t.id !== id))
    if (activeTabId === id) {
      const next = tabs[idx + 1] ?? tabs[idx - 1]
      setActiveTabId(next.id)
    }
  }

  const runCommand = useCallback(async () => {
    const cmd = input.trim()
    if (!cmd) return

    const entryId = generateId()
    const entry: CommandEntry = {
      id: entryId,
      command: cmd,
      output: '',
      exitCode: null,
      timestamp: Date.now(),
      isRunning: true,
    }

    updateTab(activeTabId, tab => ({
      ...tab,
      entries: [...tab.entries, entry],
      history: cmd !== tab.history[0] ? [cmd, ...tab.history.slice(0, 99)] : tab.history,
      historyIndex: -1,
    }))
    setInput('')

    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      })
      const data = await res.json()
      updateTab(activeTabId, tab => ({
        ...tab,
        entries: tab.entries.map(e =>
          e.id === entryId
            ? { ...e, output: data.output ?? '', exitCode: data.exitCode ?? 0, isRunning: false }
            : e
        ),
      }))
    } catch {
      updateTab(activeTabId, tab => ({
        ...tab,
        entries: tab.entries.map(e =>
          e.id === entryId
            ? { ...e, output: 'Error: could not reach cortex server', exitCode: 1, isRunning: false }
            : e
        ),
      }))
    }
  }, [input, activeTabId, updateTab])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runCommand()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const tab = activeTab
      const newIdx = Math.min(tab.historyIndex + 1, tab.history.length - 1)
      updateTab(activeTabId, t => ({ ...t, historyIndex: newIdx }))
      setInput(tab.history[newIdx] ?? '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const tab = activeTab
      const newIdx = Math.max(tab.historyIndex - 1, -1)
      updateTab(activeTabId, t => ({ ...t, historyIndex: newIdx }))
      setInput(newIdx >= 0 ? tab.history[newIdx] : '')
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      updateTab(activeTabId, t => ({ ...t, entries: [] }))
    }
  }

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id)
    setRenameValue(currentName)
  }

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      updateTab(renamingId, t => ({ ...t, name: renameValue.trim() }))
    }
    setRenamingId(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0e0e0e', fontFamily: 'var(--vsc-font-mono)', fontSize: 12 }}>
      
      <div style={{
        display: 'flex', alignItems: 'center',
        background: '#1e1e1e',
        borderBottom: '1px solid var(--vsc-border)',
        flexShrink: 0,
        height: 30,
        overflowX: 'auto',
      }}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '0 10px',
              height: '100%',
              background: tab.id === activeTabId ? '#0e0e0e' : 'transparent',
              borderRight: '1px solid var(--vsc-border)',
              cursor: 'pointer',
              color: tab.id === activeTabId ? 'var(--vsc-fg-primary)' : 'var(--vsc-fg-inactive)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onClick={() => setActiveTabId(tab.id)}
          >
            {renamingId === tab.id ? (
              <input
                autoFocus
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null) }}
                style={{
                  background: 'transparent', border: 'none', borderBottom: '1px solid var(--vsc-accent)',
                  color: 'inherit', fontFamily: 'inherit', fontSize: 12, outline: 'none', width: 80,
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span onDoubleClick={e => { e.stopPropagation(); startRename(tab.id, tab.name) }}>
                $ {tab.name}
              </span>
            )}
            {tabs.length > 1 && (
              <span
                onClick={e => { e.stopPropagation(); closeTab(tab.id) }}
                style={{ opacity: 0.5, fontSize: 10, marginLeft: 2 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
              >
                ×
              </span>
            )}
          </div>
        ))}
        
        <button
          onClick={addTab}
          title={t('terminal.newTerminal')}
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--vsc-fg-inactive)', cursor: 'pointer',
            padding: '0 10px', height: '100%', fontSize: 16, lineHeight: 1,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--vsc-fg-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--vsc-fg-inactive)')}
        >
          +
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => updateTab(activeTabId, t => ({ ...t, entries: [] }))}
          title={t('terminal.clear')}
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--vsc-fg-inactive)', cursor: 'pointer',
            padding: '0 8px', height: '100%', fontSize: 11,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--vsc-fg-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--vsc-fg-inactive)')}
        >
          {t('terminal.clear')}
        </button>
      </div>

      
      <div
        style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}
        onClick={() => inputRef.current?.focus()}
      >
        {activeTab.entries.map(entry => (
          <div key={entry.id} style={{ marginBottom: 8 }}>
            <div style={{ color: '#73c991' }}>
              <span style={{ color: '#569cd6' }}>❯ </span>{entry.command}
            </div>
            {entry.isRunning ? (
              <div style={{ color: 'var(--vsc-fg-inactive)', fontStyle: 'italic' }}>
                {t('terminal.running')}
              </div>
            ) : (
              <>
                {entry.output && (
                  <pre style={{ margin: '2px 0', color: entry.exitCode !== 0 ? '#f44747' : 'var(--vsc-fg-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {entry.output}
                  </pre>
                )}
                {entry.exitCode !== null && entry.exitCode !== 0 && (
                  <div style={{ color: '#f44747', fontSize: 11 }}>
                    [{t('terminal.exitCode')}: {entry.exitCode}]
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px',
        borderTop: '1px solid var(--vsc-border)',
        flexShrink: 0,
        background: '#0e0e0e',
      }}>
        <span style={{ color: '#569cd6', flexShrink: 0 }}>❯</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('terminal.placeholder')}
          style={{
            flex: 1, background: 'transparent', border: 'none',
            color: 'var(--vsc-fg-primary)', fontFamily: 'var(--vsc-font-mono)',
            fontSize: 12, outline: 'none',
          }}
        />
      </div>
    </div>
  )
}
