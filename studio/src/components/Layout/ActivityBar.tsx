import { useState, useRef, useEffect } from 'react'
import { SidebarView } from './AppLayout'
import { useSessionStore } from '../../store/sessionStore'
import { useFileSystem } from '../../hooks/useFileSystem'
import { SUPPORTED_LANGUAGES } from '../../i18n'
import i18n from '../../i18n'

interface Props {
  activeView: SidebarView
  onViewChange: (v: SidebarView) => void
}

const NAV_ITEMS = [
  {
    id: 'explorer' as SidebarView,
    title: 'Explorer',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 3h8l2 2h8v14H3V3zm0 2v12h18V7h-7.59l-2-2H3z"/>
    </svg>`,
  },
  {
    id: 'agents' as SidebarView,
    title: 'AI Agents',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>`,
  },
  {
    id: 'settings' as SidebarView,
    title: 'Settings',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
    </svg>`,
  },
]

const CLOCK_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
</svg>`

const GLOBE_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
</svg>`

function ActivityBtn({
  title, active, onClick, svg,
}: {
  title: string; active: boolean; onClick: () => void; svg: string
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 48, height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: active ? 'var(--vsc-fg-icon-hover)' : 'var(--vsc-fg-inactive)',
        borderLeft: active ? '2px solid var(--vsc-fg-icon-hover)' : '2px solid transparent',
        transition: 'color 0.1s',
        flexShrink: 0,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--vsc-fg-secondary)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--vsc-fg-inactive)' }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

function Popover({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: '100%',
      marginLeft: 6,
      background: '#252526',
      border: '1px solid var(--vsc-border)',
      borderRadius: 4,
      minWidth: 190,
      maxHeight: 320,
      overflowY: 'auto',
      zIndex: 1000,
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      paddingBottom: 4,
    }}>
      {children}
    </div>
  )
}

function PopoverLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '8px 12px 4px',
      fontSize: 10, fontWeight: 700,
      color: 'var(--vsc-fg-inactive)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    }}>
      {children}
    </div>
  )
}

function PopoverItem({
  children, onClick, disabled, active,
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; active?: boolean
}) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        padding: '5px 12px',
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

export function ActivityBar({ activeView, onViewChange }: Props) {
  const [showLang, setShowLang] = useState(false)
  const [showRecent, setShowRecent] = useState(false)
  const { language, setLanguage, projects } = useSessionStore()
  const { openFolder } = useFileSystem()
  const langRef = useRef<HTMLDivElement>(null)
  const recentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLang(false)
      if (recentRef.current && !recentRef.current.contains(e.target as Node)) setShowRecent(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLangChange = (code: string) => {
    setLanguage(code)
    i18n.changeLanguage(code)
    setShowLang(false)
  }

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language)

  return (
    <div style={{
      width: 'var(--vsc-activity-bar-width)',
      background: 'var(--vsc-bg-activity-bar)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 8,
      flexShrink: 0,
      borderRight: '1px solid var(--vsc-border)',
    }}>
      
      {NAV_ITEMS.map(item => (
        <ActivityBtn
          key={item.id}
          title={item.title}
          active={activeView === item.id}
          onClick={() => onViewChange(item.id)}
          svg={item.svg}
        />
      ))}

      <div style={{ flex: 1 }} />

      
      <div ref={recentRef} style={{ position: 'relative' }}>
        <ActivityBtn
          title="Recent Projects"
          active={showRecent}
          onClick={() => setShowRecent(v => !v)}
          svg={CLOCK_SVG}
        />
        {showRecent && (
          <Popover>
            <PopoverLabel>Recent Projects</PopoverLabel>
            {projects.length === 0 ? (
              <PopoverItem disabled>No recent projects</PopoverItem>
            ) : (
              [...projects]
                .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
                .slice(0, 8)
                .map(p => (
                  <PopoverItem key={p.id} onClick={() => { openFolder(); setShowRecent(false) }}>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    <div style={{ color: 'var(--vsc-fg-inactive)', fontSize: 10, marginTop: 1 }}>
                      {p.rootPath}
                    </div>
                  </PopoverItem>
                ))
            )}
          </Popover>
        )}
      </div>

      <div ref={langRef} style={{ position: 'relative', marginBottom: 8 }}>
        <ActivityBtn
          title={`Language: ${currentLang?.label ?? language.toUpperCase()}`}
          active={showLang}
          onClick={() => setShowLang(v => !v)}
          svg={GLOBE_SVG}
        />
        {showLang && (
          <Popover>
            <PopoverLabel>Language</PopoverLabel>
            {SUPPORTED_LANGUAGES.map(lang => (
              <PopoverItem
                key={lang.code}
                active={lang.code === language}
                onClick={() => handleLangChange(lang.code)}
              >
                {lang.label}
              </PopoverItem>
            ))}
          </Popover>
        )}
      </div>
    </div>
  )
}
