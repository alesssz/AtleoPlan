/*
 * Saving data as a file from the browser, with no server page and no new tab: a
 * plan's Export.
 */

/**
 * Indented, so a person can read the file. The object URL is revoked at once,
 * or the Blob would stay in memory until the page closes.
 */
export function downloadJson(fileName: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  // Never attached to the page: click() works without it
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * "Push Pull Legs!" → "push-pull-legs", "Forza è" → "forza-e", empty → "plan".
 */
export function fileNameOf(name: string): string {
  // NFD splits "è" into "e" and a combining accent (U+0300–U+036F), which
  // the first replace drops
  const safe = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return safe === '' ? 'plan' : safe
}
