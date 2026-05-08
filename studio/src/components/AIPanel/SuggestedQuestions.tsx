import { SuggestedQuestion } from '../../types'
import { useAgents } from '../../hooks/useAgents'
import { useFileStore } from '../../store/fileStore'
import { useTranslation } from 'react-i18next'
import { getQuestionText } from '../../i18n/questions'

const CONTEXT_ICONS: Record<string, string> = {
  functions: '⚡',
  classes: '🏗️',
  variables: '📦',
  imports: '📥',
  logs: '📋',
  full_file: '📄',
}

interface Props {
  questions: SuggestedQuestion[]
}

export function SuggestedQuestions({ questions }: Props) {
  const { askQuestion } = useAgents()
  const { activeWorkspaceId } = useFileStore()
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  if (!questions.length) return null

  return (
    <div style={{ padding: '8px 10px 10px', borderTop: '1px solid var(--vsc-border)' }}>
      <div style={{
        fontSize: 'var(--vsc-font-size-xs)', color: 'var(--vsc-fg-inactive)',
        marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700,
      }}>
        {t('ai.askNext')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {questions.map(q => (
          <button
            key={q.id}
            onClick={() => askQuestion(q, activeWorkspaceId ?? '')}
            style={{
              textAlign: 'left',
              background: 'rgba(0,122,204,0.08)',
              border: '1px solid rgba(0,122,204,0.25)',
              borderRadius: 3,
              padding: '5px 10px',
              color: 'var(--vsc-fg-secondary)',
              fontSize: 'var(--vsc-font-size-sm)',
              cursor: 'pointer',
              lineHeight: 1.4,
              transition: 'background 0.1s, border-color 0.1s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,122,204,0.18)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,122,204,0.5)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,122,204,0.08)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,122,204,0.25)'
            }}
          >
            <span style={{ marginRight: 6, fontSize: 12 }}>{CONTEXT_ICONS[q.contextType] ?? '❓'}</span>
            {getQuestionText(q.textKey, q.text, lang)}
          </button>
        ))}
      </div>
    </div>
  )
}
