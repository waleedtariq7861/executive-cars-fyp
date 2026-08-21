import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const services = [
  { name: 'frontend', command: 'npm', args: ['run', 'dev'], cwd: resolve(root, 'executive-cars-frontend-main') },
  { name: 'backend', command: 'npm', args: ['run', 'dev'], cwd: resolve(root, 'executive-cars-backend-main') },
]
const python = resolve(root, 'ml-service', '.venv', 'bin', 'python')
if (existsSync(python)) services.push({ name: 'ml', command: python, args: ['run.py'], cwd: resolve(root, 'ml-service') })
else process.stdout.write('[ml] .venv not found; backend will use honest comparable-listing fallback.\n')

const children = services.map(service => {
  const child = spawn(service.command, service.args, { cwd: service.cwd, stdio: ['inherit', 'pipe', 'pipe'], env: process.env })
  child.stdout.on('data', data => process.stdout.write(`[${service.name}] ${data}`))
  child.stderr.on('data', data => process.stderr.write(`[${service.name}] ${data}`))
  child.on('exit', code => { if (code && code !== 0) process.stderr.write(`[${service.name}] exited with code ${code}\n`) })
  return child
})

const stop = signal => {
  children.forEach(child => { if (!child.killed) child.kill(signal) })
  setTimeout(() => process.exit(0), 500)
}

process.on('SIGINT', () => stop('SIGINT'))
process.on('SIGTERM', () => stop('SIGTERM'))
