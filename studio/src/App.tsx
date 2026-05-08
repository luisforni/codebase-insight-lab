import { useEffect, Component, ReactNode } from 'react'
import { AppLayout } from './components/Layout/AppLayout'
import { useAgentStore } from './store/agentStore'
import { useSessionStore } from './store/sessionStore'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', background: '#1e1e1e', color: '#ccc', gap: 12, padding: 32, textAlign: 'center',
        }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f44747' }}>Something went wrong</div>
          <div style={{ fontSize: 12, color: '#888', maxWidth: 400, wordBreak: 'break-word' }}>
            {(this.state.error as Error).message}
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 8, padding: '6px 16px', background: '#007acc', border: 'none',
              borderRadius: 4, color: '#fff', fontSize: 12, cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const initAgents = useAgentStore(s => s.init)
  const initSession = useSessionStore(s => s.init)

  useEffect(() => {
    initAgents()
    initSession()
  }, [initAgents, initSession])

  return (
    <ErrorBoundary>
      <AppLayout />
    </ErrorBoundary>
  )
}
