#!/usr/bin/env node
/**
 * Writes the "Contents" list at the top of every Markdown document, built from
 * its headings. Run with `make toc` after adding, renaming or removing a
 * heading; `make check` runs it with --check and fails if a list is out of
 * date (docs/project/P1-conventions.md P1.3).
 *
 * Which files: README.md and every .md under docs/ with at least two "##"
 * headings. Which headings: "##" and "###", nested; headings inside code
 * blocks (```) are skipped, since a "#" there is a shell comment.
 *
 * Where the list goes: just before the first "##" heading, as a "## Contents"
 * section. If the document has a "---" line right before that heading, the
 * list goes before it, so the line still separates the introduction from the
 * sections. Running it again replaces the list it wrote, so it can run any
 * number of times.
 *
 * Usage: node scripts/docs-toc.mjs [--check]
 * Exit code 1 with --check when a list differs from what it would write.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The repository root (this file is in scripts/). */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
/** The title of the section this script writes, and owns. */
const TITLE = '## Contents'
/** True with --check: compare only, write nothing. */
const CHECK_ONLY = process.argv.includes('--check')

/**
 * Every .md file in a folder and its subfolders.
 * @param {string} dir absolute path of the folder
 * @returns {string[]} absolute paths
 */
function markdownFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return markdownFiles(path)
    return entry.name.endsWith('.md') ? [path] : []
  })
}

/**
 * The anchor GitHub gives a heading: lowercase, punctuation removed (letters
 * of any alphabet, digits, "_" and "-" stay), spaces turned into "-". A
 * second heading with the same anchor gets "-1", a third "-2".
 * @param {string} text the heading without its "#"s
 * @param {Map<string, number>} seen anchors used so far in the document
 * @returns {string}
 */
function anchor(text, seen) {
  const base = text.trim().toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu, '').replace(/ /g, '-')
  const count = seen.get(base) ?? 0
  seen.set(base, count + 1)
  return count === 0 ? base : `${base}-${count}`
}

/**
 * The "##" and "###" headings of a document, outside code blocks.
 * @param {string[]} lines the document's lines
 * @returns {{ level: number, text: string, slug: string, line: number }[]}
 */
function headings(lines) {
  // Anchors count every heading, the "#" title and deeper ones included
  const seen = new Map()
  const found = []
  let inCode = false
  lines.forEach((line, index) => {
    if (line.startsWith('```')) inCode = !inCode
    const match = !inCode && /^(#{1,6}) (.+)$/.exec(line)
    if (!match) return
    const level = match[1].length
    const text = match[2].trim()
    const slug = anchor(text, seen)
    if ((level === 2 || level === 3) && `## ${text}` !== TITLE) found.push({ level, text, slug, line: index })
  })
  return found
}

/**
 * The document without the Contents section this script wrote before: from
 * its title to the line before the next "---" or "##".
 * @param {string[]} lines
 * @returns {string[]}
 */
function withoutContents(lines) {
  const start = lines.indexOf(TITLE)
  if (start === -1) return lines
  let end = start + 1
  while (end < lines.length && lines[end] !== '---' && !lines[end].startsWith('## ')) end++
  return [...lines.slice(0, start), ...lines.slice(end)]
}

/**
 * The document with its Contents section, or null when it has too few
 * sections to need one.
 * @param {string} source the file's text
 * @returns {string | null}
 */
function withContents(source) {
  const lines = withoutContents(source.split('\n'))
  const found = headings(lines)
  if (found.filter(heading => heading.level === 2).length < 2) return null

  // One list item per heading; "###" ones indented under their "##"
  const items = found.map(({ level, text, slug }) => `${level === 3 ? '  ' : ''}- [${text.replace(/[[\]]/g, '\\$&')}](#${slug})`)

  // Before the first "##", or before the "---" right above it
  let at = found.find(heading => heading.level === 2).line
  let before = at - 1
  while (before >= 0 && lines[before] === '') before--
  if (lines[before] === '---') at = before

  const block = [TITLE, '', ...items, '']
  return [...lines.slice(0, at), ...block, ...lines.slice(at)].join('\n')
}

/** The documents to handle. */
const files = [join(ROOT, 'README.md'), ...markdownFiles(join(ROOT, 'docs'))]
/** The files whose list is (or was) out of date. */
const outdated = []

for (const file of files) {
  const source = readFileSync(file, 'utf8')
  const updated = withContents(source)
  if (updated === null || updated === source) continue
  outdated.push(relative(ROOT, file))
  if (!CHECK_ONLY) writeFileSync(file, updated)
}

if (CHECK_ONLY && outdated.length > 0) {
  console.error(`Contents out of date in: ${outdated.join(', ')}\nRun: make toc`)
  process.exit(1)
}
console.log(outdated.length === 0 ? 'Contents up to date.' : `Contents written: ${outdated.join(', ')}`)
