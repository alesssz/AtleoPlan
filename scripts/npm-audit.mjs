#!/usr/bin/env node
/**
 * `npm audit` for the frontend, minus the advisories reviewed and listed in
 * frontend/package.json under `auditIgnore` (GHSA id → reason). Plain
 * `npm audit` cannot ignore an advisory, and one with no patched version
 * would fail every run, hiding the new one that matters. Any other
 * advisory, of any severity, fails the run. Used by `make audit` and the
 * Audit workflow.
 *
 * Exit code 1 when an advisory not in the list is found, or when the audit
 * itself cannot run (no network); 0 otherwise.
 */
import { spawnSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** This file is in scripts/, beside frontend/. */
const FRONTEND = join(dirname(fileURLToPath(import.meta.url)), '..', 'frontend')

/** @type {Record<string, string>} */
const ignored = JSON.parse(readFileSync(join(FRONTEND, 'package.json'), 'utf8')).auditIgnore ?? {}

// npm exits with 1 when it finds anything, so the JSON is read, not the exit
// code. On Windows `npm` is npm.cmd, which only a shell can start, and Node
// wants the whole command as one string there (DEP0190)
const options = { cwd: FRONTEND, encoding: 'utf8' }
const result = process.platform === 'win32'
  ? spawnSync('npm audit --json', { ...options, shell: true })
  : spawnSync('npm', ['audit', '--json'], options)

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
 * The advisories found, one each, however many packages lead to them. Every
 * package on the way to a vulnerable one has an entry in `vulnerabilities`;
 * its `via` holds either the advisory (an object) or the package it comes
 * through (a name).
 * @type {Map<string, { ghsa: string, name: string, severity: string, title: string, url: string }>}
 */
const advisories = new Map()
for (const entry of Object.values(report.vulnerabilities ?? {})) {
  for (const via of entry.via) {
    if (typeof via !== 'object') continue
    // https://github.com/advisories/GHSA-…
    const ghsa = via.url.split('/').pop()
    advisories.set(ghsa, { ghsa, name: via.name, severity: via.severity, title: via.title, url: via.url })
  }
}

const fresh = [...advisories.values()].filter(advisory => !(advisory.ghsa in ignored))
/** Entries no longer found: the package was fixed or removed. */
const stale = Object.keys(ignored).filter(ghsa => !advisories.has(ghsa))

console.log(`npm audit: ${advisories.size} advisor${advisories.size === 1 ? 'y' : 'ies'} found, ${fresh.length} new.`)
for (const advisory of advisories.values()) {
  const status = advisory.ghsa in ignored ? `ignored: ${ignored[advisory.ghsa]}` : 'NEW'
  console.log(`  ${advisory.ghsa}  ${advisory.name}  ${advisory.severity}  ${advisory.title}\n      ${status}`)
}
for (const ghsa of stale) console.log(`  ${ghsa} is in auditIgnore but no longer found: remove it from frontend/package.json`)

if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = [...advisories.values()].map(advisory => `| [${advisory.ghsa}](${advisory.url}) | ${advisory.name} | ${advisory.severity} | ${advisory.ghsa in ignored ? `ignored: ${ignored[advisory.ghsa]}` : '**new**'} |`)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, ['### npm advisories', '', '| Advisory | Package | Severity | Status |', '|---|---|---|---|', ...rows, ''].join('\n'))
}

if (fresh.length > 0) {
  console.error(`\n✖ ${fresh.length} advisory not reviewed: fix it, or review it and add it to auditIgnore with the reason (docs/how-to/H5-ci.md H5.4).`)
  process.exit(1)
}
console.log('\n✔ No new advisory.')
