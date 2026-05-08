import { useState } from 'react'
import { ModelConfig, AVAILABLE_MODELS, ModelProvider } from '../../types'
import { useAgentStore } from '../../store/agentStore'

const PROVIDER_LABELS: Record<ModelProvider, string> = {
  ollama: '🖥️ Local (Ollama)',
  anthropic: '🟠 Anthropic',
  openai: '🟢 OpenAI',
  gemini: '🔵 Gemini',
  groq: '⚡ Groq',
}

export function ModelSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const { selectedModel, setSelectedModel } = useAgentStore()

  const grouped = AVAILABLE_MODELS.reduce<Record<ModelProvider, ModelConfig[]>>((acc, m) => {
    if (!acc[m.provider]) acc[m.provider] = []
    acc[m.provider].push(m)
    return acc
  }, {} as Record<ModelProvider, ModelConfig[]>)

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 8px', background: 'var(--vsc-bg-input)',
          border: '1px solid var(--vsc-border)', borderRadius: 3,
          color: 'var(--vsc-fg-primary)', cursor: 'pointer',
          fontSize: 'var(--vsc-font-size-sm)', width: '100%',
        }}
      >
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedModel.displayName}
        </span>
        <span style={{ color: 'var(--vsc-fg-muted)' }}>▾</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#2d2d2d', border: '1px solid var(--vsc-border)',
          borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          maxHeight: 340, overflowY: 'auto', marginTop: 2,
        }}>
          {(Object.entries(grouped) as [ModelProvider, ModelConfig[]][]).map(([provider, models]) => (
            <div key={provider}>
              <div style={{
                padding: '6px 10px 4px',
                fontSize: 'var(--vsc-font-size-xs)',
                color: 'var(--vsc-fg-inactive)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                borderTop: '1px solid var(--vsc-border)',
              }}>
                {PROVIDER_LABELS[provider]}
              </div>
              {models.map(model => (
                <div
                  key={model.modelId}
                  onClick={() => { setSelectedModel(model); setIsOpen(false) }}
                  style={{
                    padding: '5px 10px 5px 18px',
                    cursor: 'pointer',
                    fontSize: 'var(--vsc-font-size)',
                    color: model.modelId === selectedModel.modelId ? 'var(--vsc-accent)' : 'var(--vsc-fg-primary)',
                    background: model.modelId === selectedModel.modelId ? 'var(--vsc-bg-selected)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (model.modelId !== selectedModel.modelId) (e.currentTarget as HTMLElement).style.background = 'var(--vsc-bg-hover)' }}
                  onMouseLeave={e => { if (model.modelId !== selectedModel.modelId) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  {model.modelId === selectedModel.modelId && '✓ '}
                  {model.displayName}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
