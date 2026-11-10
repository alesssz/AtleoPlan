/*
 * Saving data as a file on the user's device, from the browser: no page of
 * the server, no new tab. Used by a plan's Export
 * (src/components/plans/ExportPlanButton.tsx, docs/concepts/C1-frontend.md
 * C1.15.6).
 */

/**
 * Saves a value as a JSON file, as the browser saves any download (the
 * Downloads folder, or the question "where?").
 *
 * How: the text goes into a **Blob**, a file held in the browser's memory;
 * `URL.createObjectURL()` gives it an address (`blob:http://…`); a link
 * with that address and a `download` attribute, clicked by the code, makes
 * the browser save it instead of opening it. The address is then freed,
 * or the Blob would stay in memory until the page closes.
 *
 * @param fileName the file's name, such as "calisthenics.atleoplan.json"
 * @param data the value; written indented by two spaces, readable by a person
 */
export function downloadJson(fileName: string, data: unknown): void {
  // The file in memory: the text, and its type. JSON.stringify(data, null,
  // 2): no filter of keys (null), two spaces of indent
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  // Its temporary address, blob:http://…
  const url = URL.createObjectURL(blob)
  // A link that is never put on the page: click() works without it
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * A name made safe for a file: lower case, letters and digits, the rest a
 * single dash. "Push Pull Legs!" → "push-pull-legs". Accents are dropped
 * with their letter kept: "Forza è" → "forza-e". Empty → "plan".
 * @param name the name to turn into a file's name
 */
export function fileNameOf(name: string): string {
  // The name made safe, step by step. normalize('NFD') splits "è" into
  // "e" and an accent mark (U+0300…U+036F), which the first replace
  // removes; then lower case, any run of other characters a dash, and no
  // dash at either end (^ the start, $ the end, | either)
  const safe = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return safe === '' ? 'plan' : safe
}
