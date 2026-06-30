// ponytail: browser-native Blob + anchor click, zero dependencies

export function exportAllData(): void {
  const prefix = 'workoutapp.'
  const data: Record<string, unknown> = {}

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(prefix)) {
      try {
        const value = localStorage.getItem(key)
        if (value !== null) {
          data[key.slice(prefix.length)] = JSON.parse(value)
        }
      } catch {
        // ponytail: skip corrupt entry, export everything else
      }
    }
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workoutapp-export-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
