import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const isWindows = process.platform === 'win32'
const npm = isWindows ? 'npm.cmd' : 'npm'
const services = [
  { name: 'frontend', command: npm, args: ['run', 'dev'], cwd: resolve(root, 'executive-cars-frontend-main') },
  { name: 'backend', command: npm, args: ['run', 'dev'], cwd: resolve(root, 'executive-cars-backend-main') },
]
const python = isWindows
  ? resolve(root, 'ml-service', '.venv', 'Scripts', 'python.exe')
  : resolve(root, 'ml-service', '.venv', 'bin', 'python')
if (existsSync(python)) services.push({ name: 'ml', command: python, args: ['run.py'], cwd: resolve(root, 'ml-service') })
else process.stdout.write('[ml] .venv not found; ML price predictions will be unavailable.\n')

let stopping = false
const children = services.map(service => {
  const child = spawn(service.command, service.args, {
    cwd: service.cwd,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env,
    shell: isWindows && service.command === npm,
  })
  child.stdout.on('data', data => process.stdout.write(`[${service.name}] ${data}`))
  child.stderr.on('data', data => process.stderr.write(`[${service.name}] ${data}`))
  child.on('error', error => process.stderr.write(`[${service.name}] failed to start: ${error.message}\n`))
  child.on('exit', code => { if (!stopping && code && code !== 0) process.stderr.write(`[${service.name}] exited with code ${code}\n`) })
  return child
})

const stop = signal => {
  if (stopping) return
  stopping = true
  children.forEach(child => {
    if (child.killed || !child.pid) return
    if (isWindows) {
      spawn('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' })
    } else {
      child.kill(signal)
    }
  })
  setTimeout(() => process.exit(0), 1_000)
}

process.on('SIGINT', () => stop('SIGINT'))
process.on('SIGTERM', () => stop('SIGTERM'))
