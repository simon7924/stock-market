export function loadAppearance() {
  try {
    return JSON.parse(localStorage.getItem('stocksim_appearance') || '{}')
  } catch { return {} }
}

export function saveAppearance(val) {
  localStorage.setItem('stocksim_appearance', JSON.stringify(val))
}

export function applyAccent(color) {
  document.documentElement.style.setProperty('--blue', color)
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  document.documentElement.style.setProperty('--blue-glow', `rgba(${r},${g},${b},0.25)`)
}

export function applyDarkMode(dark) {
  const vars = dark ? {
    '--bg': '#0f1115',
    '--panel': '#151922',
    '--card': '#1b2230',
    '--sidebar-bg': '#0d1117',
    '--input-bg': '#111723',
    '--border': 'rgba(255,255,255,0.06)',
    '--border-hover': 'rgba(255,255,255,0.12)',
    '--subtle-border': 'rgba(255,255,255,0.08)',
    '--hover-bg': 'rgba(255,255,255,0.04)',
    '--toggle-off': 'rgba(255,255,255,0.1)',
    '--disabled-bg': '#2b3445',
    '--btn-secondary-text': '#cbd5e1',
    '--scrollbar-thumb': 'rgba(255,255,255,0.1)',
    '--text': '#ffffff',
    '--text-secondary': '#b0bac8',
    '--text-muted': '#868f9e',
    '--gradient-start': '#1e3a5f',
    '--gradient-end': '#162032',
  } : {
    '--bg': '#f0f2f5',
    '--panel': '#ffffff',
    '--card': '#eef1f5',
    '--sidebar-bg': '#e2e6ed',
    '--input-bg': '#ffffff',
    '--border': 'rgba(0,0,0,0.1)',
    '--border-hover': 'rgba(0,0,0,0.18)',
    '--subtle-border': 'rgba(0,0,0,0.12)',
    '--hover-bg': 'rgba(0,0,0,0.04)',
    '--toggle-off': 'rgba(0,0,0,0.15)',
    '--disabled-bg': '#d1d5db',
    '--btn-secondary-text': '#374151',
    '--scrollbar-thumb': 'rgba(0,0,0,0.15)',
    '--text': '#0f172a',
    '--text-secondary': '#475569',
    '--text-muted': '#6b7280',
    '--gradient-start': '#dbeafe',
    '--gradient-end': '#eff6ff',
  }
  for (const [k, v] of Object.entries(vars)) {
    document.documentElement.style.setProperty(k, v)
  }
}

export function initAppearance() {
  const saved = loadAppearance()
  applyDarkMode(saved.darkMode !== false)
  if (saved.accentColor) applyAccent(saved.accentColor)
  window.__stocksimGraphAnimations = saved.graphAnimations !== false
}
