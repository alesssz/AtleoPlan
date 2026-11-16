#!/usr/bin/env node
/**
 * Writes a "## Contents" list of the "##" and "###" headings into every .md
 * under docs/ with at least two "##" headings. Headings inside code blocks are
 * skipped. The list goes before the first "##" heading, or before the "---"
 * line right above it, and replaces the list written by an earlier run.
 *
 * Usage: node scripts/docs-toc.mjs [--check]
 * Exit code 1 with --check when a list differs from what it would write.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
/** The title of the section this script writes, and owns. */
const TITLE = '## Contents'
const CHECK_ONLY = process.argv.includes('--check')

/**
 * @param {string} dir absolute path
 * @returns {string[]} absolute paths of every .md below it
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

  // "###" indented under its "##". "[", "]" and "\" are escaped in the link's
  // text: an unescaped "]" would end the link early, a lone "\" would escape
  // what follows (CodeQL's js/incomplete-sanitization)
  const items = found.map(({ level, text, slug }) => `${level === 3 ? '  ' : ''}- [${text.replace(/[\\[\]]/g, '\\$&')}](#${slug})`)

  // Before the first "##", or before the "---" right above it
  let at = found.find(heading => heading.level === 2).line
  let before = at - 1
  while (before >= 0 && lines[before] === '') before--
  if (lines[before] === '---') at = before

  const block = [TITLE, '', ...items, '']
  return [...lines.slice(0, at), ...block, ...lines.slice(at)].join('\n')
}

const files = markdownFiles(join(ROOT, 'docs'))
const outdated = []

for (const file of files) {
  const raw = readFileSync(file, 'utf8')
  // A CRLF checkout (core.autocrlf on Windows) would leave a "\r" on every
  // line and no heading would match: read with "\n", write back as found
  const eol = raw.includes('\r\n') ? '\r\n' : '\n'
  const source = raw.replace(/\r\n/g, '\n')
  const updated = withContents(source)
  if (updated === null || updated === source) continue
  outdated.push(relative(ROOT, file))
  if (!CHECK_ONLY) writeFileSync(file, updated.replace(/\n/g, eol))
}

if (CHECK_ONLY && outdated.length > 0) {
  console.error(`Contents out of date in: ${outdated.join(', ')}\nRun: make toc`)
  process.exit(1)
}
console.log(outdated.length === 0 ? 'Contents up to date.' : `Contents written: ${outdated.join(', ')}`)
