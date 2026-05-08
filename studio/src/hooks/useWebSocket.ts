import { useEffect, useCallback } from 'react'
import { wsManager } from '../services/wsManager'

export function useWebSocket() {
  useEffect(() => {
    wsManager.connect()
  }, [])

  const send = useCallback((data: object) => {
    wsManager.send(data)
  }, [])

  return { send }
}
