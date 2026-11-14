#!/usr/bin/env node
/**
 * Checks that this computer and this clone are ready for AtleoPlan, and prints
 * the fix for whatever is not. Changes nothing. Run with `make doctor`.
 *
 * Checks, in order: Docker (installed, running, disk space), Node (the major of
 * .nvmrc) and npm's cache, the Git identity and hook, the dependencies of both
 * apps, the backend's .env (only that it exists: it holds secrets), the ports,
 * and the test database: the problems met while setting the project up. Works
 * on macOS, Linux and Windows; the npm cache check does not apply to Windows
 * and is skipped there.
 *
 * Exit code 1 when at least one check fails, 0 otherwise (warnings included).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { connect } from 'node:net'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The repository root (this file is in scripts/). */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
/** The only email allowed in commits. */
const NOREPLY = '32982604+alesssz@users.noreply.github.com'
/** Host ports of the stack, standard + 500, with what owns them. */
const PORTS = { 8500: 'Laravel', 5932: 'Postgres', 8525: 'Mailpit', 5673: 'Vite' }
/** Below this many free GB on Docker's disk, builds start failing in odd ways. */
const MIN_DOCKER_FREE_GB = 5

/** Count of failed checks, for the exit code. */
let failures = 0

/** Runs a command and returns its trimmed output, or null when it fails. */
function run(command, args, options = {}) {
  try {
    return execFileSync(command, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], ...options }).trim()
  }
  catch {
    return null
  }
}

/**
 * Tells whether a program accepts connections on a port of this computer.
 * Connecting works the same on macOS, Linux and Windows, unlike `lsof`, which
 * Windows lacks. Both local addresses are tried: Docker publishes the stack on
 * 127.0.0.1, while Vite may listen on ::1 only.
 */
async function isListening(port) {
  for (const host of ['127.0.0.1', '::1']) {
    // Whether this address answered; a refused connection is an error, so a free port gives false
    const answered = await new Promise((resolve) => {
      // The connection attempt, given up after a second
      const socket = connect({ port, host, timeout: 1000 })
      /** Closes the socket and gives the attempt's result. */
      const finish = (result) => {
        socket.destroy()
        resolve(result)
      }
      socket.once('connect', () => finish(true))
      socket.once('timeout', () => finish(false))
      socket.once('error', () => finish(false))
    })
    if (answered) return true
  }
  return false
}

/** Tells whether the program on a port is Vite: only Vite serves its own client script. */
async function isVite(port) {
  try {
    return (await fetch(`http://localhost:${port}/@vite/client`, { signal: AbortSignal.timeout(2000) })).ok
  }
  catch {
    return false
  }
}

/** The command that shows which program holds a port: Windows has no lsof. */
function portOwnerCommand(port) {
  return process.platform === 'win32'
    ? `netstat -ano | grep :${port}`
    : `lsof -nP -iTCP:${port} -sTCP:LISTEN`
}

/** Prints a passed check. */
function ok(message) {
  console.log(`  ✔ ${message}`)
}

/** Prints a warning: worth fixing, not blocking. */
function warn(message, fix) {
  console.log(`  ⚠ ${message}${fix ? `\n      → ${fix}` : ''}`)
}

/** Prints a failed check with its fix, and counts it. */
function fail(message, fix) {
  failures++
  console.log(`  ✖ ${message}${fix ? `\n      → ${fix}` : ''}`)
}

// --- Docker ------------------------------------------------------------------------
console.log('Docker')
/** Docker's server version; null when the CLI is missing or the daemon is down. */
const dockerVersion = run('docker', ['info', '--format', '{{.ServerVersion}}'])
if (!run('docker', ['--version'])) {
  fail('Docker is not installed', 'install Docker Desktop')
}
else if (!dockerVersion) {
  fail('Docker is installed but not running', 'start Docker Desktop')
}
else {
  ok(`Docker ${dockerVersion} running`)
  // Free space on Docker's virtual disk, in GB, measured from a throwaway container
  // already on this computer (the backend image, if built)
  const freeKb = run('docker', ['run', '--rm', '--entrypoint', 'sh', 'atleoplan-backend:dev', '-c', "df -k / | tail -1 | awk '{print $4}'"])
  if (freeKb === null) {
    warn('backend image not built yet, Docker disk space not checked', 'make build')
  }
  else {
    // Kilobytes to gigabytes, one decimal
    const freeGb = Math.round(Number(freeKb) / 1024 / 1024 * 10) / 10
    if (freeGb < MIN_DOCKER_FREE_GB) {
      fail(`only ${freeGb} GB free on Docker's disk`, 'docker builder prune -af; docker image prune -af (docs/start/S1-setup.md S1.10)')
    }
    else {
      ok(`${freeGb} GB free on Docker's disk`)
    }
  }
}

// --- Node and npm ------------------------------------------------------------------
console.log('Node')
/** The Node major the project expects (.nvmrc). */
const wantedNode = readFileSync(join(ROOT, '.nvmrc'), 'utf8').trim()
/** The Node major running this script. */
const actualNode = process.versions.node.split('.')[0]
if (actualNode === wantedNode) {
  ok(`Node ${process.versions.node}`)
}
else {
  fail(`Node ${process.versions.node}, the project wants ${wantedNode} (.nvmrc)`, 'nvm use (or install Node ' + wantedNode + ')')
}
// A file in npm's cache owned by another user (root, after a `sudo npm`) breaks every install.
// macOS and Linux only: Windows has no sudo and no process.getuid().
if (process.platform !== 'win32') {
  // npm's cache folder, and the first file in it that belongs to someone else, if any
  const npmCache = join(homedir(), '.npm')
  const foreignFile = existsSync(npmCache) ? run('find', [npmCache, '!', '-user', String(process.getuid()), '-print', '-quit']) : ''
  if (foreignFile) {
    fail('npm\'s cache has files owned by another user (EACCES on install)', 'sudo chown -R $(id -u):$(id -g) ~/.npm')
  }
  else {
    ok('npm cache owned by you')
  }
}

// --- Git ---------------------------------------------------------------------------
console.log('Git')
/** The email this repository commits with. */
const email = run('git', ['config', 'user.email'])
if (email === NOREPLY) {
  ok(`commits as ${email}`)
}
else {
  fail(`commits would use ${email ?? 'no email'}`, `git config user.email "${NOREPLY}" (docs/start/S1-setup.md S1.3)`)
}
if (run('git', ['config', 'core.hooksPath']) === '.githooks') {
  ok('email-guard hook active')
}
else {
  fail('the email-guard hook is off', 'git config core.hooksPath .githooks')
}
if (run('git', ['remote', 'get-url', 'origin'])) {
  ok('GitHub remote set')
}
else {
  warn('no GitHub remote', 'git remote add origin https://github.com/alesssz/AtleoPlan.git')
}

// --- The apps ----------------------------------------------------------------------
console.log('Apps')
// The Composer packages exist twice: the ones the app runs on, in the `vendor`
// Docker volume, checked further down once the containers are known to run; and
// this copy on the computer, which only the editor reads. vendor/autoload.php
// is the file every PHP request loads first, so its presence means the copy is
// complete, not just begun. A missing copy is only a warning: the app works
// without it.
if (existsSync(join(ROOT, 'backend/vendor/autoload.php'))) ok('backend packages copied for the editor')
else warn('backend/vendor/ empty: the editor cannot see the packages', 'make vendor (make setup on a new clone)')
// Existence only: the file holds secrets and is never read here
if (existsSync(join(ROOT, 'backend/.env'))) ok('backend/.env present')
else fail('backend/.env missing', 'cp backend/.env.example backend/.env && make artisan c="key:generate"')
if (existsSync(join(ROOT, 'frontend/node_modules'))) ok('frontend packages installed')
else fail('frontend packages missing', 'make fe-install')

// --- Ports and services ------------------------------------------------------------
console.log('Ports')
/** Host ports published by this project's running containers. */
const ownPorts = new Set((run('docker', ['compose', 'ps', '--format', '{{.Ports}}']) ?? '')
  .match(/:(\d+)->/g)?.map(match => match.slice(1, -2)) ?? [])
for (const [port, service] of Object.entries(PORTS)) {
  if (!await isListening(Number(port))) ok(`${port} (${service}) free`)
  else if (ownPorts.has(port)) ok(`${port} (${service}) in use by AtleoPlan`)
  else if (port === '5673' && await isVite(port)) ok(`${port} (${service}) in use by Vite, probably make dev`)
  else warn(`${port} (${service}) taken by another program`, `${portOwnerCommand(port)}; or change the port (docs/start/S1-setup.md S1.4)`)
}

// The test database, when Postgres runs
const testDb = run('docker', ['compose', 'exec', '-T', 'postgres', 'psql', '-U', 'atleoplan', '-tAc', "select 1 from pg_database where datname = 'atleoplan_test'"])
if (testDb === null) warn('Postgres not running, test database not checked', 'make up')
else if (testDb === '1') ok('test database atleoplan_test exists')
else fail('test database atleoplan_test missing', 'make test-db')

// The packages the app runs on, in the `vendor` Docker volume, when the backend
// runs. The volume is inside Docker's virtual machine, where this script cannot
// look, so the question goes to the container. Its answer is never empty, so
// null means it is not running. An empty volume, as after `make down-v`, is a
// failure: every request errors.
/** "yes" or "no" from the container, or null when the backend is not running. */
const packages = run('docker', ['compose', 'exec', '-T', 'backend', 'sh', '-c', 'test -f vendor/autoload.php && echo yes || echo no'])
if (packages === null) warn('backend not running, its packages not checked', 'make up')
else if (packages === 'yes') ok('backend packages installed')
else fail('backend packages missing from the vendor volume (after make down-v?)', 'make setup')

console.log(failures ? `\n✖ ${failures} problem(s) to fix.` : '\n✔ All good.')
process.exitCode = failures ? 1 : 0
