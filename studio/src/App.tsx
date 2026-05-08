import { useEffect } from 'react'
import { AppLayout } from './components/Layout/AppLayout'
import { useAgentStore } from './store/agentStore'
import { useSessionStore } from './store/sessionStore'

export default function App() {
  const initAgents = useAgentStore(s => s.init)
  const initSession = useSessionStore(s => s.init)

  useEffect(() => {
    initAgents()
    initSession()
  }, [initAgents, initSession])

  return <AppLayout />
}
