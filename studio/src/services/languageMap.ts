const EXT_MAP: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
  py: 'python', pyw: 'python', rb: 'ruby', go: 'go', rs: 'rust',
  java: 'java', kt: 'kotlin', swift: 'swift', cs: 'csharp', cpp: 'cpp',
  cc: 'cpp', cxx: 'cpp', c: 'c', h: 'c', hpp: 'cpp', hxx: 'cpp',
  php: 'php', r: 'r', scala: 'scala', dart: 'dart', lua: 'lua',
  sh: 'shell', bash: 'shell', zsh: 'shell', ps1: 'powershell',
  html: 'html', htm: 'html', xml: 'xml', svg: 'xml',
  css: 'css', scss: 'scss', sass: 'scss', less: 'less',
  json: 'json', jsonc: 'json', yaml: 'yaml', yml: 'yaml',
  toml: 'toml', ini: 'ini', cfg: 'ini', conf: 'ini',
  md: 'markdown', mdx: 'markdown', rst: 'restructuredtext',
  sql: 'sql', graphql: 'graphql', gql: 'graphql',
  dockerfile: 'dockerfile', makefile: 'makefile',
  tf: 'hcl', hcl: 'hcl', ex: 'elixir', exs: 'elixir',
  clj: 'clojure', cljs: 'clojure', hs: 'haskell', ml: 'ocaml',
  vue: 'vue', svelte: 'svelte',
}

export function getLanguageFromExtension(ext: string): string {
  return EXT_MAP[ext.toLowerCase()] ?? 'plaintext'
}

export function getLanguageFromPath(filePath: string): string {
  const parts = filePath.split('.')
  const ext = parts.length > 1 ? parts[parts.length - 1] : ''
  const name = filePath.split('/').pop()?.toLowerCase() ?? ''
  if (name === 'dockerfile') return 'dockerfile'
  if (name === 'makefile') return 'makefile'
  return getLanguageFromExtension(ext)
}
