import { useEffect, useRef } from 'react'
import { Explanation } from '../../types'
import { useEditorStore } from '../../store/editorStore'
import { MarkdownContent } from '../AIPanel/AgentResponse'

interface TooltipProps {
  explanation: Explanation
  x: number
  y: number
  onClose: () => void
}

function ExplanationTooltip({ explanation, x, y, onClose }: TooltipProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const BADGE_COLORS: Record<string, string> = {
    function: '#dcdcaa', class: '#4ec9b0', variable: '#9cdcfe',
    import: '#c586c0', method: '#dcdcaa', parameter: '#9cdcfe',
  }

  const TOOLTIP_H = 300
  const fitsBelow = y + 24 + TOOLTIP_H < window.innerHeight
  const top = fitsBelow ? y + 24 : Math.max(8, y - TOOLTIP_H - 8)

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: Math.min(x, window.innerWidth - 420),
        top,
        zIndex: 9999,
        background: '#252526',
        border: '1px solid #454545',
        borderRadius: 4,
        padding: '10px 14px',
        maxWidth: 400,
        maxHeight: 300,
        overflowY: 'auto',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        fontFamily: 'var(--vsc-font-ui)',
        fontSize: 'var(--vsc-font-size)',
        color: 'var(--vsc-fg-primary)',
        pointerEvents: 'all',
      }}
    >
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          background: `${BADGE_COLORS[explanation.elementType] ?? '#6d6d6d'}22`,
          color: BADGE_COLORS[explanation.elementType] ?? '#6d6d6d',
          border: `1px solid ${BADGE_COLORS[explanation.elementType] ?? '#6d6d6d'}44`,
          borderRadius: 3, padding: '1px 6px',
          fontSize: 'var(--vsc-font-size-xs)', fontWeight: 700,
        }}>
          {explanation.elementType}
        </span>
        <code style={{ color: 'var(--vsc-fg-secondary)', fontFamily: 'var(--vsc-font-mono)', fontSize: 12 }}>
          {explanation.elementName}
        </code>
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto', background: 'transparent', border: 'none',
            color: 'var(--vsc-fg-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1,
          }}
        >×</button>
      </div>

      
      <div style={{ color: 'var(--vsc-fg-secondary)' }}>
        <MarkdownContent content={explanation.content} />
      </div>

      
      <div style={{ marginTop: 8, fontSize: 'var(--vsc-font-size-xs)', color: 'var(--vsc-fg-inactive)', display: 'flex', gap: 8 }}>
        <span>via {explanation.agentSource}</span>
        <span>·</span>
        <span>{explanation.modelUsed}</span>
        <span>·</span>
        <span>line {explanation.line}</span>
      </div>
    </div>
  )
}

export function HoverExplainerOverlay() {
  const { hoveredExplanation, hoverPosition, setHoveredExplanation } = useEditorStore()

  if (!hoveredExplanation) return null

  return (
    <ExplanationTooltip
      explanation={hoveredExplanation}
      x={hoverPosition?.x ?? 100}
      y={hoverPosition?.y ?? 100}
      onClose={() => setHoveredExplanation(null)}
    />
  )
}
