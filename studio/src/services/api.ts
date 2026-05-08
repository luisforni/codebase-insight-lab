const BASE = import.meta.env.VITE_CORTEX_URL ?? 'http://localhost:8000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${res.status}: ${body}`)
  }
  return res.json()
}

export const api = {
  health: () => request<{ status: string; models: string[] }>('/health'),

  getHoverExplanation: (payload: {
    filePath: string
    content: string
    line: number
    column: number
    workspaceId: string
    modelConfig: unknown
  }) => request<{ explanation: import('../types').Explanation | null }>('/api/hover', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  runCommand: (payload: { command: string; workingDir: string }) =>
    request<{ output: string; exitCode: number }>('/api/command', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getModels: () => request<{ lmstudio: string[]; cloud: string[] }>('/api/models'),

  getExplanations: (filePath: string) =>
    request<{ explanations: import('../types').Explanation[] }>(
      `/api/explanations?file=${encodeURIComponent(filePath)}`
    ),

  saveExplanation: (explanation: import('../types').Explanation) =>
    request<{ id: string }>('/api/explanations', {
      method: 'POST',
      body: JSON.stringify(explanation),
    }),
}
