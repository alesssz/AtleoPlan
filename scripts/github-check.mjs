#!/usr/bin/env node
/**
 * Checks the repository's settings on GitHub against the ones the project
 * decided, and the state of its checks: the last CI and Audit runs, the open
 * alerts. Changes nothing: every call is a read. Run with `make github-check`.
 *
 * Needs GitHub's command line, `gh`, signed in once with `gh auth login`. It
 * asks GitHub's REST API through `gh api`, which adds the signed-in account's
 * token by itself; the token is never printed. Some answers need the
 * repository's owner: another account gets "Not Found" there, reported as a
 * failure.
 *
 * Exit code 1 when at least one check fails, 0 otherwise (warnings included).
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The repository root (this file is in scripts/). */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
/**
 * The `gh` program: on the PATH, or where its Windows installer puts it, for
 * a terminal opened before the installation (which does not see the new
 * PATH until it is reopened).
 */
const GH = process.platform === 'win32' && existsSync('C:\\Program Files\\GitHub CLI\\gh.exe')
  ? 'C:\\Program Files\\GitHub CLI\\gh.exe'
  : 'gh'

/** Count of failed checks, for the exit code. */
let failures = 0

/**
 * Runs gh and returns its trimmed output, or null when it fails.
 * @param {string[]} args gh's arguments
 */
function gh(args) {
  try {
    return execFileSync(GH, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  }
  catch {
    return null
  }
}

/**
 * One answer of GitHub's REST API, as data; null when the call fails (no
 * access, a feature not available, no network).
 * @param {string} path the API path, after https://api.github.com/
 */
function api(path) {
  const output = gh(['api', path])
  return output === null ? null : JSON.parse(output)
}

/** Prints a passed check. */
function ok(message) {
  console.log(`  ✔ ${message}`)
}

/** Prints a warning: worth a look, not blocking. */
function warn(message, fix) {
  console.log(`  ⚠ ${message}${fix ? `\n      → ${fix}` : ''}`)
}

/** Prints a failed check with its fix, and counts it. */
function fail(message, fix) {
  failures++
  console.log(`  ✖ ${message}${fix ? `\n      → ${fix}` : ''}`)
}

/**
 * Passes or fails one setting: its value against the one expected.
 * @param {boolean} good whether the value is the expected one
 * @param {string} message what is checked, as passed
 * @param {string} fix where to change it
 */
function expect(good, message, fix) {
  if (good) ok(message)
  else fail(`not as expected: ${message}`, fix)
}

// --- gh and the repository ---------------------------------------------------------
console.log('gh')
if (gh(['--version']) === null) {
  fail('gh is not installed, or not on the PATH', 'install GitHub CLI, then reopen the terminal (docs/how-to/H5-ci.md H5.3)')
  process.exit(1)
}
if (gh(['auth', 'status']) === null) {
  fail('gh is not signed in', 'gh auth login (docs/how-to/H5-ci.md H5.3)')
  process.exit(1)
}
/** "owner/name", from the clone's origin remote. */
const name = gh(['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner'])
if (!name) {
  fail('the repository on GitHub could not be read', 'git remote get-url origin; gh auth status')
  process.exit(1)
}
ok(`signed in, repository ${name}`)
/** The API path of the repository. */
const repo = `repos/${name}`

// --- Actions ----------------------------------------------------------------
console.log('Actions')
const permissions = api(`${repo}/actions/permissions`)
expect(permissions?.enabled === true && permissions.allowed_actions === 'selected', 'Actions on, only selected actions allowed', 'Settings → Actions → General → Actions permissions')
const selected = api(`${repo}/actions/permissions/selected-actions`)
expect(selected?.github_owned_allowed === true && selected.verified_allowed === false && selected.patterns_allowed.length === 0, 'only actions created by GitHub', 'Settings → Actions → General: only "Allow actions created by GitHub" ticked')
const token = api(`${repo}/actions/permissions/workflow`)
expect(token?.default_workflow_permissions === 'read' && token.can_approve_pull_request_reviews === false, 'workflow token read-only, cannot approve pull requests', 'Settings → Actions → General → Workflow permissions')
const forks = api(`${repo}/actions/permissions/fork-pr-contributor-approval`)
expect(forks?.approval_policy === 'all_external_contributors', 'approval required for all external contributors', 'Settings → Actions → General → Approval for running fork pull request workflows')

// --- Code security --------------------------------------------------------
console.log('Code security')
/** The repository, for its visibility and its security features. */
const info = api(repo)
/** Each security feature's status, "enabled" or "disabled". */
const features = info?.security_and_analysis ?? {}
expect(info?.visibility === 'public', 'repository public', 'Settings → General → Danger Zone (P1.5)')
expect(features.secret_scanning?.status === 'enabled', 'secret scanning on', 'Settings → Advanced Security → Secret Protection')
expect(features.secret_scanning_push_protection?.status === 'enabled', 'push protection on', 'Settings → Advanced Security → Push protection')
expect(features.dependabot_security_updates?.status === 'enabled', 'Dependabot security updates on', 'Settings → Advanced Security → Dependabot security updates')
expect(api(`${repo}/private-vulnerability-reporting`)?.enabled === true, 'private vulnerability reporting on', 'Settings → Advanced Security → Private vulnerability reporting')
const codeql = api(`${repo}/code-scanning/default-setup`)
expect(codeql?.state === 'configured', `CodeQL default setup on${codeql?.languages?.length ? ` (${codeql.languages.join(', ')})` : ''}`, 'Settings → Advanced Security → CodeQL analysis → Default setup')

// --- The ruleset of main ---------------------------------------------------
console.log('Ruleset')
/** The branch rulesets, by summary; then the active one on the default branch, in full. */
const summaries = api(`${repo}/rulesets`) ?? []
const rulesets = summaries.map(summary => api(`${repo}/rulesets/${summary.id}`)).filter(Boolean)
const onMain = rulesets.find(ruleset => ruleset.enforcement === 'active' && ruleset.conditions?.ref_name?.include?.includes('~DEFAULT_BRANCH'))
/** The kinds of rule it holds: "deletion", "non_fast_forward"… */
const rules = onMain?.rules.map(rule => rule.type) ?? []
expect(rules.includes('deletion') && rules.includes('non_fast_forward'), 'main: deletion and force pushes blocked', 'Settings → Rules → Rulesets (P1.5.2)')
if (onMain && onMain.bypass_actors.length > 0) warn('the ruleset of main has bypass actors: someone may skip it', 'Settings → Rules → Rulesets → main → Bypass list')

// --- Alerts ------------------------------------------------------------------------
console.log('Alerts')
/**
 * Counts a list of open alerts; null when it cannot be read.
 * @param {string} path the API path of the list
 */
function openAlerts(path) {
  const list = api(`${path}${path.includes('?') ? '&' : '?'}state=open&per_page=100`)
  return Array.isArray(list) ? list.length : null
}
const dependabot = openAlerts(`${repo}/dependabot/alerts`)
if (dependabot === null) warn('Dependabot alerts could not be read')
else if (dependabot === 0) ok('no open Dependabot alert')
else warn(`${dependabot} open Dependabot alert(s)`, `Security → Dependabot; make audit (docs/how-to/H5-ci.md H5.4)`)
const secrets = openAlerts(`${repo}/secret-scanning/alerts`)
if (secrets === null) warn('secret scanning alerts could not be read')
else if (secrets === 0) ok('no open secret scanning alert')
else fail(`${secrets} open secret scanning alert(s): a secret is in the repository`, 'revoke it first, then remove it (P1.5.3)')
const code = openAlerts(`${repo}/code-scanning/alerts`)
if (code === null) warn('CodeQL alerts could not be read (none yet before its first analysis)')
else if (code === 0) ok('no open CodeQL alert')
else warn(`${code} open CodeQL alert(s)`, 'Security → Code scanning (docs/how-to/H5-ci.md H5.5)')

// --- The last runs ----------------------------------------------------------
console.log('Last runs on main')
for (const workflow of ['ci.yml', 'audit.yml']) {
  // The newest finished run of the workflow on main: its conclusion and when
  const output = gh(['run', 'list', '--workflow', workflow, '--branch', 'main', '--status', 'completed', '--limit', '1', '--json', 'conclusion,createdAt,url'])
  const run = output ? JSON.parse(output)[0] : undefined
  if (!run) warn(`${workflow}: no finished run on main yet`)
  else if (run.conclusion === 'success') ok(`${workflow}: success (${run.createdAt.slice(0, 10)})`)
  else fail(`${workflow}: ${run.conclusion} (${run.createdAt.slice(0, 10)})`, `${run.url} (docs/how-to/H5-ci.md H5.5)`)
}

console.log(failures ? `\n✖ ${failures} problem(s) to fix.` : '\n✔ All as decided.')
process.exitCode = failures ? 1 : 0
