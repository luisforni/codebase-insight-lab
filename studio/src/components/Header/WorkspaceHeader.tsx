import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useFileStore } from '../../store/fileStore'
import { useSessionStore } from '../../store/sessionStore'
import { useFileSystem } from '../../hooks/useFileSystem'
import { SUPPORTED_LANGUAGES } from '../../i18n'
import i18n from '../../i18n'

export function WorkspaceHeader() {
  const { t } = useTranslation()
  const [showRecent, setShowRecent] = useState(false)
  const [showLang, setShowLang] = useState(false)
  const [lastWorkspaceName, setLastWorkspaceName] = useState<string | null>(null)
  const recentRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  const { workspaces } = useFileStore()
  const { openFolder } = useFileSystem()
  const { projects, language, setLanguage } = useSessionStore()

  const activeWorkspace = workspaces[0]

  
  useEffect(() => {
    const name = localStorage.getItem('cil:lastWorkspaceName')
    if (name && workspaces.length === 0) {
      setLastWorkspaceName(name)
    } else if (workspaces.length > 0) {
      setLastWorkspaceName(null)
    }
  }, [workspaces.length])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (recentRef.current && !recentRef.current.contains(e.target as Node)) setShowRecent(false)
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLang(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLangChange = (code: string) => {
    setLanguage(code)
    i18n.changeLanguage(code)
    setShowLang(false)
  }

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language)

  return (
    <div style={{
      height: 36,
      background: '#2d2d2d',
      borderBottom: '1px solid var(--vsc-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 8px',
      gap: 6,
      flexShrink: 0,
      fontSize: 'var(--vsc-font-size-sm)',
      userSelect: 'none',
    }}>
      
      <span style={{ color: 'var(--vsc-fg-muted)', fontWeight: 600, marginRight: 4, fontSize: 12 }}>
        {t('app.name')}
      </span>

      <div style={{ width: 1, height: 16, background: 'var(--vsc-border)' }} />

      
      <HeaderButton onClick={() => openFolder()} title={t('app.openFolder')}>
        📁 {activeWorkspace ? activeWorkspace.name : t('app.openFolder')}
      </HeaderButton>

      
      {lastWorkspaceName && (
        <HeaderButton
          onClick={() => { openFolder() }}
          title={`${t('session.restore')}: ${lastWorkspaceName}`}
        >
          🔄 {t('session.restoreProject')}: {lastWorkspaceName}
        </HeaderButton>
      )}

      
      <div ref={recentRef} style={{ position: 'relative' }}>
        <HeaderButton onClick={() => setShowRecent(v => !v)} title={t('app.recentProjects')}>
          🕐 {t('app.recentProjects')}
        </HeaderButton>
        {showRecent && (
          <DropdownMenu>
            {projects.length === 0 ? (
              <DropdownItem disabled>{t('session.noRecent')}</DropdownItem>
            ) : (
              [...projects]
                .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
                .slice(0, 8)
                .map(p => (
                  <DropdownItem key={p.id} onClick={() => { setShowRecent(false) }}>
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                    <span style={{ color: 'var(--vsc-fg-inactive)', fontSize: 10, display: 'block', marginTop: 1 }}>
                      {p.rootPath}
                    </span>
                  </DropdownItem>
                ))
            )}
          </DropdownMenu>
        )}
      </div>

      <div style={{ flex: 1 }} />

      
      <div ref={langRef} style={{ position: 'relative' }}>
        <HeaderButton onClick={() => setShowLang(v => !v)} title={t('app.language')}>
          🌐 {currentLang?.label ?? language.toUpperCase()}
        </HeaderButton>
        {showLang && (
          <DropdownMenu right>
            {SUPPORTED_LANGUAGES.map(lang => (
              <DropdownItem
                key={lang.code}
                onClick={() => handleLangChange(lang.code)}
                active={lang.code === language}
              >
                {lang.label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}



function HeaderButton({ onClick, title, children }: { onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'transparent',
        border: 'none',
        color: 'var(--vsc-fg-secondary)',
        padding: '3px 8px',
        borderRadius: 3,
        cursor: 'pointer',
        fontSize: 12,
        whiteSpace: 'nowrap',
        maxWidth: 200,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  )
}

function DropdownMenu({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      [right ? 'right' : 'left']: 0,
      marginTop: 2,
      background: '#252526',
      border: '1px solid var(--vsc-border)',
      borderRadius: 4,
      minWidth: 180,
      maxHeight: 320,
      overflowY: 'auto',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    }}>
      {children}
    </div>
  )
}

function DropdownItem({ children, onClick, disabled, active }: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  active?: boolean
}) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        padding: '6px 12px',
        color: disabled ? 'var(--vsc-fg-inactive)' : active ? 'var(--vsc-accent)' : 'var(--vsc-fg-secondary)',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 12,
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </div>
  )
}
