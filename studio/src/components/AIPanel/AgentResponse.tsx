import { useMemo, useState, useCallback, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AgentResponse as AgentResponseType, AgentId } from '../../types'
import { SuggestedQuestions } from './SuggestedQuestions'
import { useEditorStore } from '../../store/editorStore'
import { useAgentStore } from '../../store/agentStore'



const AGENT_COLORS: Record<AgentId, string> = {
  structure:      '#4ec9b0',
  functions:      '#dcdcaa',
  variables:      '#9cdcfe',
  imports:        '#c586c0',
  business_logic: '#f28b54',
  error_handling: '#f44747',
  security:       '#ff8c00',
  logs:           '#6796e6',
  integration:    '#b5cea8',
  planner:        '#569cd6',
  coder:          '#4ec9b0',
  reviewer:       '#dcdcaa',
  debugger:       '#f44747',
  tester:         '#b5cea8',
  documenter:     '#9cdcfe',
  architect:      '#c586c0',
  summarizer:     '#f28b54',
}

const AGENT_ICONS: Record<AgentId, string> = {
  structure:      '🏗️',
  functions:      '⚡',
  variables:      '📦',
  imports:        '📥',
  business_logic: '🎯',
  error_handling: '🛡️',
  security:       '🔐',
  logs:           '📋',
  integration:    '🔗',
  planner:        '📐',
  coder:          '✏️',
  reviewer:       '👁️',
  debugger:       '🐛',
  tester:         '✅',
  documenter:     '📝',
  architect:      '🗺️',
  summarizer:     '📄',
}



function extractSymbols(content: string): Map<string, number> {
  const symbols = new Map<string, number>()
  const PATTERNS = [
    /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
    /(?:export\s+)?const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[:=]/,
    /(?:export\s+)?(?:let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[:=]/,
    /(?:export\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
    /(?:export\s+)?(?:interface|type)\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
    /def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/,
    /(?:fn|pub fn)\s+([A-Za-z_][A-Za-z0-9_]*)\s*[(<]/,
    /func\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/,
  ]
  content.split('\n').forEach((line, idx) => {
    for (const pat of PATTERNS) {
      const m = line.match(pat)
      if (m?.[1] && !symbols.has(m[1])) {
        symbols.set(m[1], idx + 1)
        break
      }
    }
  })
  return symbols
}



function getCodeContext(content: string, lineNum: number, radius = 3): { lines: string[]; startLine: number } {
  const all = content.split('\n')
  const start = Math.max(0, lineNum - 1 - radius)
  const end = Math.min(all.length, lineNum + radius)
  return { lines: all.slice(start, end), startLine: start + 1 }
}



interface SymbolTooltip {
  name: string
  line: number
  x: number
  y: number
}

function SymbolPreviewTooltip({ tooltip, fileContent }: { tooltip: SymbolTooltip; fileContent: string }) {
  const { lines, startLine } = getCodeContext(fileContent, tooltip.line)
  const targetLineIdx = tooltip.line - startLine

  
  const W = window.innerWidth
  const left = tooltip.x + 16
  const adjustedLeft = left + 320 > W ? tooltip.x - 336 : left

  return (
    <div
      style={{
        position: 'fixed',
        top: tooltip.y - 10,
        left: adjustedLeft,
        zIndex: 9999,
        background: '#1e1e1e',
        border: '1px solid var(--vsc-border-light)',
        borderRadius: 5,
        padding: '6px 0',
        minWidth: 280,
        maxWidth: 400,
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        pointerEvents: 'none',
        fontFamily: 'var(--vsc-font-mono)',
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      <div style={{ padding: '2px 10px 6px', fontSize: 10, color: 'var(--vsc-fg-inactive)', borderBottom: '1px solid var(--vsc-border)', marginBottom: 4 }}>
        {tooltip.name} — line {tooltip.line}
      </div>
      {lines.map((line, i) => {
        const isTarget = i === targetLineIdx
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              background: isTarget ? 'rgba(0,122,204,0.12)' : 'transparent',
              borderLeft: isTarget ? '2px solid var(--vsc-accent)' : '2px solid transparent',
            }}
          >
            <span style={{ padding: '0 8px', color: 'var(--vsc-fg-inactive)', minWidth: 40, textAlign: 'right', userSelect: 'none', flexShrink: 0 }}>
              {startLine + i}
            </span>
            <span style={{ padding: '0 8px', color: isTarget ? 'var(--vsc-fg-primary)' : 'var(--vsc-fg-secondary)', whiteSpace: 'pre', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {line}
            </span>
          </div>
        )
      })}
    </div>
  )
}



function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }, [code])

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-block-lang">{lang || 'code'}</span>
        <button className="code-copy-btn" onClick={handleCopy}>
          {copied ? '✓ Copied' : '⎘ Copy'}
        </button>
      </div>
      <pre className="code-block-pre">
        <code>{code}</code>
      </pre>
    </div>
  )
}



type Block =
  | { t: 'h'; level: 1 | 2 | 3; text: string }
  | { t: 'code'; lang: string; code: string }
  | { t: 'list'; ordered: boolean; items: string[] }
  | { t: 'quote'; text: string }
  | { t: 'table'; headers: string[]; rows: string[][] }
  | { t: 'p'; text: string }
  | { t: 'hr' }

function parseBlocks(md: string): Block[] {
  const lines = md.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    
    const hm = line.match(/^(#{1,3})\s+(.+)$/)
    if (hm) {
      blocks.push({ t: 'h', level: hm[1].length as 1 | 2 | 3, text: hm[2] })
      i++; continue
    }

    
    if (/^[-*_]{3,}\s*$/.test(line.trim())) {
      blocks.push({ t: 'hr' })
      i++; continue
    }

    
    const cm = line.match(/^```(\w*)/)
    if (cm) {
      const lang = cm[1]
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(lines[i]); i++ }
      if (i < lines.length) i++
      blocks.push({ t: 'code', lang, code: code.join('\n') })
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const ql = [line.slice(2)]
      while (i + 1 < lines.length && lines[i + 1].startsWith('> ')) { i++; ql.push(lines[i].slice(2)) }
      blocks.push({ t: 'quote', text: ql.join('\n') })
      i++; continue
    }

    // Table (| col | col |)
    if (line.startsWith('|') && line.trim().endsWith('|')) {
      const parseRow = (r: string) => r.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim())
      const headers = parseRow(line)
      const tableRows: string[][] = []
      i++
      // skip separator row (| --- | --- |)
      if (i < lines.length && /^\|[-| :]+\|$/.test(lines[i].trim())) i++
      while (i < lines.length && lines[i].startsWith('|') && lines[i].trim().endsWith('|')) {
        tableRows.push(parseRow(lines[i]))
        i++
      }
      blocks.push({ t: 'table', headers, rows: tableRows })
      continue
    }

    // Unordered list
    if (/^[-*+] /.test(line)) {
      const items = [line.replace(/^[-*+] /, '')]
      while (i + 1 < lines.length && /^[-*+] /.test(lines[i + 1])) { i++; items.push(lines[i].replace(/^[-*+] /, '')) }
      blocks.push({ t: 'list', ordered: false, items })
      i++; continue
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items = [line.replace(/^\d+\. /, '')]
      while (i + 1 < lines.length && /^\d+\. /.test(lines[i + 1])) { i++; items.push(lines[i].replace(/^\d+\. /, '')) }
      blocks.push({ t: 'list', ordered: true, items })
      i++; continue
    }

    // Blank line → skip
    if (!line.trim()) { i++; continue }

    // Paragraph
    const pl = [line]
    while (
      i + 1 < lines.length &&
      lines[i + 1].trim() &&
      !lines[i + 1].match(/^#{1,3} /) &&
      !lines[i + 1].startsWith('```') &&
      !lines[i + 1].startsWith('> ') &&
      !/^[-*+] /.test(lines[i + 1]) &&
      !/^\d+\. /.test(lines[i + 1]) &&
      !/^[-*_]{3,}\s*$/.test(lines[i + 1].trim())
    ) { i++; pl.push(lines[i]) }

    blocks.push({ t: 'p', text: pl.join('\n') })
    i++
  }
  return blocks
}

// ─── Inline renderer ──────────────────────────────────────────────────────────

interface InlineProps {
  symbols: Map<string, number>
  onJump: ((line: number) => void) | null
  onSymbolHover: (name: string, line: number, e: React.MouseEvent) => void
  onSymbolLeave: () => void
}

function renderInline(text: string, key: string, p: InlineProps): ReactNode[] {
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/)
  return parts.map((part, j) => {
    const k = `${key}-${j}`

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={k}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2 && !part.startsWith('**')) {
      return <em key={k}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      const name = part.slice(1, -1)
      const line = p.symbols.get(name)
      if (line != null && p.onJump) {
        return (
          <code
            key={k}
            className="code-symbol"
            onClick={() => p.onJump!(line)}
            onMouseEnter={(e) => p.onSymbolHover(name, line, e)}
            onMouseLeave={p.onSymbolLeave}
            title={`→ line ${line}`}
          >
            {name}
          </code>
        )
      }
      return <code key={k}>{name}</code>
    }
    return part || null
  }).filter((n): n is ReactNode => n !== null && n !== '')
}



function RenderBlock({ block, bKey, inline }: { block: Block; bKey: string; inline: InlineProps }) {
  if (block.t === 'hr') {
    return <hr style={{ border: 'none', borderTop: '1px solid var(--vsc-border)', margin: '12px 0' }} />
  }

  if (block.t === 'h') {
    const sizes: Record<1 | 2 | 3, string> = { 1: '16px', 2: '14px', 3: '13px' }
    const margins: Record<1 | 2 | 3, string> = { 1: '14px 0 6px', 2: '12px 0 5px', 3: '10px 0 4px' }
    return (
      <div style={{ fontWeight: 600, fontSize: sizes[block.level], color: 'var(--vsc-fg-secondary)', margin: margins[block.level], borderBottom: block.level === 1 ? '1px solid var(--vsc-border)' : 'none', paddingBottom: block.level === 1 ? 6 : 0 }}>
        {renderInline(block.text, bKey, inline)}
      </div>
    )
  }

  if (block.t === 'code') {
    return <CodeBlock lang={block.lang} code={block.code} />
  }

  if (block.t === 'table') {
    return (
      <div style={{ overflowX: 'auto', margin: '8px 0' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
          <thead>
            <tr>
              {block.headers.map((h, i) => (
                <th key={i} style={{ padding: '4px 10px', textAlign: 'left', borderBottom: '1px solid var(--vsc-border)', color: 'var(--vsc-fg-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {renderInline(h, `${bKey}-th${i}`, inline)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)' }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: '4px 10px', borderBottom: '1px solid rgba(62,62,62,0.5)', color: 'var(--vsc-fg-secondary)' }}>
                    {renderInline(cell, `${bKey}-td${ri}-${ci}`, inline)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (block.t === 'list') {
    const Tag = block.ordered ? 'ol' : 'ul'
    return (
      <Tag style={{ margin: '6px 0', paddingLeft: 22 }}>
        {block.items.map((item, j) => (
          <li key={j} style={{ margin: '3px 0', lineHeight: 1.65 }}>
            {renderInline(item, `${bKey}-li${j}`, inline)}
          </li>
        ))}
      </Tag>
    )
  }

  if (block.t === 'quote') {
    return (
      <blockquote style={{ borderLeft: '3px solid var(--vsc-accent)', margin: '8px 0', padding: '6px 12px', background: 'rgba(0,122,204,0.06)', borderRadius: '0 3px 3px 0' }}>
        {renderInline(block.text, bKey, inline)}
      </blockquote>
    )
  }

  return (
    <p style={{ margin: '5px 0', lineHeight: 1.7 }}>
      {renderInline(block.text, bKey, inline)}
    </p>
  )
}



const EMPTY_SYMBOLS = new Map<string, number>()
const NOOP_HOVER = () => {}
const NOOP_LEAVE = () => {}

export function MarkdownContent({
  content,
  isStreaming,
  symbols = EMPTY_SYMBOLS,
  onJump = null,
  onSymbolHover = NOOP_HOVER,
  onSymbolLeave = NOOP_LEAVE,
}: {
  content: string
  isStreaming?: boolean
  symbols?: Map<string, number>
  onJump?: ((line: number) => void) | null
  onSymbolHover?: (name: string, line: number, e: React.MouseEvent) => void
  onSymbolLeave?: () => void
}) {
  const blocks = useMemo(() => parseBlocks(content), [content])
  const inline: InlineProps = { symbols, onJump, onSymbolHover, onSymbolLeave }

  return (
    <div className="markdown-content">
      {blocks.map((block, i) => (
        <RenderBlock key={i} block={block} bKey={String(i)} inline={inline} />
      ))}
      {isStreaming && <span className="cursor-blink" />}
    </div>
  )
}



interface Props {
  response: AgentResponseType
  isActive: boolean
  onToggle: () => void
  onRemove: () => void
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function AgentResponseCard({ response, isActive, onToggle, onRemove }: Props) {
  const { t } = useTranslation()
  const color = AGENT_COLORS[response.agentId]
  const icon = AGENT_ICONS[response.agentId]

  const wsConnected = useAgentStore(s => s.wsConnected)
  const activeTabId = useEditorStore(s => s.activeTabId)
  const allTabs = useEditorStore(s => s.tabs)
  const jumpToLine = useEditorStore(s => s.jumpToLine)

  const activeTab = allTabs.find(tab => tab.id === activeTabId) ?? null

  const symbols = useMemo(
    () => (activeTab ? extractSymbols(activeTab.content) : new Map<string, number>()),
    
    [activeTab?.filePath],
  )

  const [headerHovered, setHeaderHovered] = useState(false)
  const [symbolTooltip, setSymbolTooltip] = useState<SymbolTooltip | null>(null)

  const handleSymbolHover = useCallback((name: string, line: number, e: React.MouseEvent) => {
    if (!activeTab?.content) return
    setSymbolTooltip({ name, line, x: e.clientX, y: e.clientY })
  }, [activeTab?.content])

  const handleSymbolLeave = useCallback(() => {
    setSymbolTooltip(null)
  }, [])

  const interrupted = response.isStreaming && !wsConnected

  return (
    <div style={{
      borderBottom: '1px solid var(--vsc-border)',
      background: isActive ? 'rgba(255,255,255,0.02)' : 'transparent',
    }}>
      
      <div
        onClick={onToggle}
        onMouseEnter={() => { setHeaderHovered(true); }}
        onMouseLeave={() => { setHeaderHovered(false); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px',
          cursor: 'pointer',
          userSelect: 'none',
          background: headerHovered ? 'var(--vsc-bg-hover)' : 'transparent',
          transition: 'background 0.1s',
        }}
      >
        <span style={{ fontSize: 14 }}>{icon}</span>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color, fontWeight: 600, fontSize: 'var(--vsc-font-size)' }}>
              {response.agentName}
            </span>
            {response.isStreaming && !interrupted && <div className="spinner" style={{ width: 10, height: 10 }} />}
            {interrupted && (
              <span style={{ fontSize: 10, color: '#f44747', background: 'rgba(244,71,71,0.12)', padding: '1px 5px', borderRadius: 3 }}>
                {t('ai.responseInterrupted')}
              </span>
            )}
          </div>
          <div style={{ fontSize: 'var(--vsc-font-size-xs)', color: 'var(--vsc-fg-inactive)', marginTop: 1 }}>
            {formatTime(response.timestamp)}
          </div>
        </div>
        <span style={{
          color: 'var(--vsc-fg-muted)', fontSize: 12,
          transform: isActive ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.15s',
          flexShrink: 0,
        }}>▶</span>
        
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          title={t('ai.deleteResponse')}
          style={{
            opacity: headerHovered ? 1 : 0,
            transition: 'opacity 0.15s',
            background: 'transparent',
            border: 'none',
            color: 'var(--vsc-fg-muted)',
            cursor: 'pointer',
            fontSize: 14,
            lineHeight: 1,
            padding: '2px 4px',
            borderRadius: 3,
            flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f44747')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--vsc-fg-muted)')}
        >
          ✕
        </button>
      </div>

      
      {isActive && (
        <div>
          <div style={{
            padding: '0 14px 12px',
            color: 'var(--vsc-fg-secondary)',
            maxHeight: 600,
            overflowY: 'auto',
            userSelect: 'text',
            cursor: 'text',
          }}>
            {interrupted ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f44747', padding: '8px 0', userSelect: 'none', cursor: 'default' }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{t('ai.responseInterruptedTitle')}</div>
                  {response.content && (
                    <div style={{ marginTop: 6 }}>
                      <MarkdownContent
                        content={response.content}
                        symbols={symbols}
                        onJump={jumpToLine}
                        onSymbolHover={handleSymbolHover}
                        onSymbolLeave={handleSymbolLeave}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : response.isStreaming && !response.content ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--vsc-fg-muted)', padding: '8px 0', userSelect: 'none', cursor: 'default' }}>
                <div className="spinner" />
                <span>{t('editor.analyzingHint')}</span>
              </div>
            ) : (
              <MarkdownContent
                content={response.content}
                isStreaming={response.isStreaming}
                symbols={symbols}
                onJump={jumpToLine}
                onSymbolHover={handleSymbolHover}
                onSymbolLeave={handleSymbolLeave}
              />
            )}
          </div>
          {!response.isStreaming && response.suggestedQuestions.length > 0 && (
            <SuggestedQuestions questions={response.suggestedQuestions} />
          )}
        </div>
      )}

      
      {symbolTooltip && activeTab?.content && (
        <SymbolPreviewTooltip tooltip={symbolTooltip} fileContent={activeTab.content} />
      )}
    </div>
  )
}
