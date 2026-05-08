import type { Translations } from './es'

const zh: Translations = {
  app: { name: 'Codebase Insight Lab', openFolder: '打开文件夹', addFolder: '添加文件夹', recentProjects: '最近项目', saveSession: '保存会话', newSession: '新会话', settings: '设置', language: '语言', noWorkspace: '无工作区', openToStart: '打开文件夹以开始' },
  explorer: { title: '资源管理器', noFolder: '未打开文件夹', noFolderDesc: '打开文件夹以浏览文件', addFolder: '+ 添加文件夹', removeFolder: '移除文件夹', loading: '加载中...' },
  editor: { noFileOpen: '未打开文件', noFileDesc: '从资源管理器选择文件', analyzeBtn: '⚡ 用智能体分析', analyzingHint: '分析中...', line: '行', col: '列' },
  ai: { analysis: '分析', coder: '编码器', summary: '摘要', analysisTitle: 'AI 分析', coderTitle: 'AI 编码器', summaryTitle: 'AI 摘要', noResponses: '暂无回复', noResponsesDesc: '打开文件并点击 ⚡ 分析', analyzing: '智能体分析中...', clearResponses: '清除回复', askPlaceholder: '询问关于代码的问题...', send: '发送', askNext: '继续提问', depth: '深度', depthSummary: '摘要', depthTechnical: '技术', depthComplete: '完整', depthEli5: '简单解释', depthSenior: '资深开发者', coderTaskPlaceholder: '描述编码任务...', coderGenerate: '生成更改', coderGenerating: '生成中...', coderAcceptAll: '全部接受', coderRejectAll: '全部拒绝', coderNoPending: '没有待处理的更改', coderNoPendingDesc: '描述一个任务', coderAccept: '接受', coderReject: '拒绝', coderExplain: '解释', summaryGenerate: '生成文档', summaryGenerating: '生成中...', summaryNoDoc: '无文档', summaryNoDocDesc: '生成完整分析', summaryEdit: '编辑', summarySave: '保存', summaryExport: '导出', modelSelector: '选择模型', agents: '智能体', connected: 'Cortex 已连接', disconnected: 'Cortex 已断开', conversationHistory: '对话历史', newConversation: '新对话', loadConversation: '加载对话', deleteResponse: '删除回复', responseInterrupted: '已中断', responseInterruptedTitle: '连接已中断。此回复不完整。' },
  depth: { summary: '简短概述', technical: '详细技术说明', complete: '全面深入分析', eli5: '通俗易懂的解释', senior: '如同与资深开发者交流' },
  terminal: { title: '终端', newTerminal: '新建终端', closeTerminal: '关闭终端', clear: '清空', renameTerminal: '重命名', placeholder: '输入命令...', running: '运行中...', exitCode: '退出码' },
  diff: { proposed: '建议更改', original: '原始', modified: '已修改', accept: '接受', reject: '拒绝', explain: '解释更改', change: '更改', changes: '处更改', acceptAll: '全部接受', rejectAll: '全部拒绝', noChanges: '无待处理更改', applied: '更改已应用', rejected: '更改已拒绝' },
  status: { terminal: '终端', ln: '行', col: '列' },
  session: { saved: '会话已保存', loaded: '会话已加载', noRecent: '没有最近项目', saveProject: '保存项目', loadProject: '加载项目', projectName: '项目名称', lastOpened: '最近打开', conversations: '次对话', resumeSession: '恢复会话', newSession: '新会话', restore: '恢复上次会话', restoreProject: '继续项目', restored: '会话已恢复', saving: '正在保存...', clickToRestore: '点击重新打开' },
  run: { title: '运行项目', command: '命令', omit: '忽略文件/文件夹', omitHint: '逗号分隔模式（如: .env,tests/）', contextPrompt: '上下文（可选）', contextHint: '为 AI 代理提供额外上下文', execute: '运行', skip: '跳过', running: '运行中...', analyzing: '分析错误...', noCommand: '未检测到运行命令', errorFound: '检测到错误', runBtn: '▶ 运行', runningBtn: '⏳ 运行中...', analyzeProject: '🔍 分析项目', analyzingProject: '分析中...', lastRun: '上次结果' },
  config: { title: '项目配置', created: '配置目录已创建', gitignoreUpdated: '.gitignore 已更新', configDir: '配置目录', save: '保存更改', confirmEdit: '确认更改' },
}
export default zh
