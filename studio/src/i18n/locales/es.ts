const es = {
  
  app: {
    name: 'Codebase Insight Lab',
    openFolder: 'Abrir carpeta',
    addFolder: 'Añadir carpeta',
    recentProjects: 'Proyectos recientes',
    saveSession: 'Guardar sesión',
    newSession: 'Nueva sesión',
    settings: 'Configuración',
    language: 'Idioma',
    noWorkspace: 'Sin workspace',
    openToStart: 'Abre una carpeta para empezar',
  },

  
  explorer: {
    title: 'Explorador',
    noFolder: 'Sin carpeta abierta',
    noFolderDesc: 'Abre una carpeta para navegar por sus archivos',
    addFolder: '+ Añadir carpeta',
    loading: 'Cargando...',
  },

  
  editor: {
    noFileOpen: 'Sin archivo abierto',
    noFileDesc: 'Selecciona un archivo del explorador para verlo aquí',
    analyzeBtn: '⚡ Analizar con Agentes',
    analyzingHint: 'Analizando...',
    line: 'Línea',
    col: 'Col',
  },

  
  ai: {
    analysis: 'Análisis',
    coder: 'Codificador',
    summary: 'Resumen',
    analysisTitle: 'AI Análisis',
    coderTitle: 'AI Codificador',
    summaryTitle: 'AI Resumen',
    noResponses: 'Sin respuestas todavía',
    noResponsesDesc: 'Abre un archivo y haz clic en ⚡ Analizar',
    analyzing: 'Agentes analizando...',
    clearResponses: 'Limpiar respuestas',
    askPlaceholder: 'Pregunta sobre el código...',
    send: 'Enviar',
    askNext: 'Preguntar a continuación',
    depth: 'Profundidad',
    depthSummary: 'Resumen',
    depthTechnical: 'Técnico',
    depthComplete: 'Completo',
    depthEli5: 'Explícamelo fácil',
    depthSenior: 'Senior Dev',
    coderTaskPlaceholder: 'Describe la tarea de código (ej: Añadir manejo de errores a la función X)...',
    coderGenerate: 'Generar cambios',
    coderGenerating: 'Generando...',
    coderAcceptAll: 'Aceptar todo',
    coderRejectAll: 'Rechazar todo',
    coderNoPending: 'Sin cambios pendientes',
    coderNoPendingDesc: 'Describe una tarea para que el agente proponga cambios de código',
    coderAccept: 'Aceptar',
    coderReject: 'Rechazar',
    coderExplain: 'Explicar',
    summaryGenerate: 'Generar documento',
    summaryGenerating: 'Generando...',
    summaryNoDoc: 'Sin documento generado',
    summaryNoDocDesc: 'Genera un análisis completo del repositorio',
    summaryEdit: 'Editar',
    summarySave: 'Guardar',
    summaryExport: 'Exportar',
    modelSelector: 'Seleccionar modelo',
    agents: 'Agentes',
    connected: 'Cortex conectado',
    disconnected: 'Cortex desconectado',
    conversationHistory: 'Historial de conversaciones',
    newConversation: 'Nueva conversación',
    loadConversation: 'Cargar conversación',
    deleteResponse: 'Eliminar respuesta',
    responseInterrupted: 'Interrumpida',
    responseInterruptedTitle: 'La conexión se interrumpió. Esta respuesta está incompleta.',
  },

  
  depth: {
    summary: 'Respuesta breve y de alto nivel',
    technical: 'Explicación técnica detallada',
    complete: 'Análisis exhaustivo de todos los aspectos',
    eli5: 'Explicación simple para no técnicos',
    senior: 'Como hablar con un desarrollador senior',
  },

  
  terminal: {
    title: 'Terminal',
    newTerminal: 'Nueva terminal',
    closeTerminal: 'Cerrar terminal',
    clear: 'Limpiar',
    renameTerminal: 'Renombrar',
    placeholder: 'Ingresa un comando...',
    running: 'Ejecutando...',
    exitCode: 'Código de salida',
  },

  
  diff: {
    proposed: 'Cambios propuestos',
    original: 'Original',
    modified: 'Modificado',
    accept: 'Aceptar',
    reject: 'Rechazar',
    explain: 'Explicar cambio',
    change: 'cambio',
    changes: 'cambios',
    acceptAll: 'Aceptar todo',
    rejectAll: 'Rechazar todo',
    noChanges: 'Sin cambios pendientes',
    applied: 'Cambio aplicado',
    rejected: 'Cambio rechazado',
  },

  
  status: {
    terminal: 'Terminal',
    ln: 'Lín',
    col: 'Col',
  },

  
  session: {
    saved: 'Sesión guardada',
    loaded: 'Sesión cargada',
    noRecent: 'Sin proyectos recientes',
    saveProject: 'Guardar proyecto',
    loadProject: 'Cargar proyecto',
    projectName: 'Nombre del proyecto',
    lastOpened: 'Última apertura',
    conversations: 'conversaciones',
    resumeSession: 'Retomar sesión',
    newSession: 'Nueva sesión',
    restore: 'Restaurar última sesión',
    restoreProject: 'Retomar proyecto',
    restored: 'Sesión restaurada',
    saving: 'Guardando sesión...',
    clickToRestore: 'Haz clic para reabrir',
  },

  
  run: {
    title: 'Ejecutar Proyecto',
    command: 'Comando',
    omit: 'Omitir archivos/carpetas',
    omitHint: 'Patrones separados por coma (ej: .env,tests/)',
    contextPrompt: 'Prompt de contexto (opcional)',
    contextHint: 'Contexto adicional para los agentes de IA',
    execute: 'Ejecutar',
    skip: 'Omitir',
    running: 'Ejecutando...',
    analyzing: 'Analizando errores con agentes...',
    noCommand: 'No se detectó comando de ejecución',
    errorFound: 'Errores detectados — analizando con agentes...',
    runBtn: '▶ Ejecutar',
    runningBtn: '⏳ Ejecutando...',
    analyzeProject: 'Analizar Proyecto',
    analyzingProject: 'Analizando...',
    lastRun: 'Último resultado',
  },

  
  config: {
    title: 'Configuración del Proyecto',
    created: 'Directorio de configuración creado',
    gitignoreUpdated: '.gitignore actualizado',
    configDir: 'Directorio de config',
    save: 'Guardar cambios',
    confirmEdit: 'Confirmar cambios',
  },
} as const

export default es
export type Translations = typeof es
