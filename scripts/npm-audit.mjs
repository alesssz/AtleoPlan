#!/usr/bin/env node
/**
 * The frontend's npm packages against the advisory database, with a list of
 * advisories already reviewed and left out on purpose. Run by `make audit`
 * and by the Audit workflow (.github/workflows/audit.yml).
 *
 * Why not plain `npm audit`: it has no way to leave out an advisory, and
 * some cannot be fixed. deepmerge's, for one, has no patched version, and
 * only shadcn's command, a development tool, uses it. Plain `npm audit`
 * would fail every run on it, and a failure that is always there hides the
 * new one that matters. So each advisory reviewed goes in
 * frontend/package.json, under `auditIgnore`, by its GHSA id with the reason;
 * any other advisory, of any severity, fails the run.
 *
 * Exit code 1 when an advisory not in the list is found, or when the audit
 * itself cannot run (no network); 0 otherwise.
 */
import { spawnSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The frontend's folder (this file is in scripts/, beside it). */
const FRONTEND = join(dirname(fileURLToPath(import.meta.url)), '..', 'frontend')

/**
 * The advisories reviewed, from package.json: GHSA id → why it is left out.
 * `?? {}`: none, when the field is missing.
 * @type {Record<string, string>}
 */
const ignored = JSON.parse(readFileSync(join(FRONTEND, 'package.json'), 'utf8')).auditIgnore ?? {}

// `npm audit --json`: the report as data rather than text. npm exits with 1
// when it finds anything, so the exit code is not read, the JSON is. On
// Windows `npm` is a script (npm.cmd), which only a shell can start, and
// Node wants the whole command as one string there: arguments passed apart
// to a shell are not escaped, and Node warns (DEP0190)
const options = { cwd: FRONTEND, encoding: 'utf8' }
const result = process.platform === 'win32'
  ? spawnSync('npm audit --json', { ...options, shell: true })
  : spawnSync('npm', ['audit', '--json'], options)

/** The report; null when npm printed no JSON at all. */
let report = null
try {
  report = JSON.parse(result.stdout)
}
catch {
  report = null
}
if (!report || report.error) {
  // No network, or the registry down: say so and fail, never pass silently
  console.error('✖ npm audit could not run:', report?.error?.summary ?? result.stderr.trim() ?? 'no output')
  process.exit(1)
}

/**
 * The advisories found, one each, however many packages lead to them. In
 * `vulnerabilities`, every package on the way to a vulnerable one has an
 * entry; its `via` lists either the advisory itself (an object, with its
 * url) or the package it comes through (a name). Only the objects are
 * advisories.
 * @type {Map<string, { ghsa: string, name: string, severity: string, title: string, url: string }>}
 */
const advisories = new Map()
for (const entry of Object.values(report.vulnerabilities ?? {})) {
  for (const via of entry.via) {
    if (typeof via !== 'object') continue
    // The GHSA id is the url's last part: https://github.com/advisories/GHSA-…
    const ghsa = via.url.split('/').pop()
    advisories.set(ghsa, { ghsa, name: via.name, severity: via.severity, title: via.title, url: via.url })
  }
}

/** The advisories not in the list: these fail the run. */
const fresh = [...advisories.values()].filter(advisory => !(advisory.ghsa in ignored))
/** Entries of the list no longer found: the package was fixed or removed, the entry can go. */
const stale = Object.keys(ignored).filter(ghsa => !advisories.has(ghsa))

// The report, one line per advisory
console.log(`npm audit: ${advisories.size} advisor${advisories.size === 1 ? 'y' : 'ies'} found, ${fresh.length} new.`)
for (const advisory of advisories.values()) {
  const status = advisory.ghsa in ignored ? `ignored: ${ignored[advisory.ghsa]}` : 'NEW'
  console.log(`  ${advisory.ghsa}  ${advisory.name}  ${advisory.severity}  ${advisory.title}\n      ${status}`)
}
for (const ghsa of stale) console.log(`  ${ghsa} is in auditIgnore but no longer found: remove it from frontend/package.json`)

// On GitHub, the same in the run's summary page: GITHUB_STEP_SUMMARY is a
// file whose Markdown GitHub shows under the run
if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = [...advisories.values()].map(advisory => `| [${advisory.ghsa}](${advisory.url}) | ${advisory.name} | ${advisory.severity} | ${advisory.ghsa in ignored ? `ignored: ${ignored[advisory.ghsa]}` : '**new**'} |`)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, ['### npm advisories', '', '| Advisory | Package | Severity | Status |', '|---|---|---|---|', ...rows, ''].join('\n'))
}

if (fresh.length > 0) {
  console.error(`\n✖ ${fresh.length} advisory not reviewed: fix it, or review it and add it to auditIgnore with the reason (docs/how-to/H5-ci.md H5.4).`)
  process.exit(1)
}
console.log('\n✔ No new advisory.')
