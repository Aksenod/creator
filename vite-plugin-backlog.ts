import { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

const BACKLOG_DIR = path.resolve('backlog')
const TASKS_FILE = path.join(BACKLOG_DIR, 'tasks.json')
const SCREENSHOTS_DIR = path.join(BACKLOG_DIR, 'screenshots')

function ensureDirs() {
  if (!fs.existsSync(BACKLOG_DIR)) fs.mkdirSync(BACKLOG_DIR, { recursive: true })
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify({ version: 1, tasks: [] }, null, 2))
  }
}

export default function backlogPlugin(): Plugin {
  return {
    name: 'backlog-api',
    configureServer(server) {
      ensureDirs()

      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/backlog/')) return next()

        // GET /api/backlog/tasks
        if (req.method === 'GET' && req.url === '/api/backlog/tasks') {
          try {
            const data = fs.readFileSync(TASKS_FILE, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(data)
          } catch {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to read tasks' }))
          }
          return
        }

        // PUT /api/backlog/tasks
        if (req.method === 'PUT' && req.url === '/api/backlog/tasks') {
          let body = ''
          req.on('data', (chunk: Buffer) => { body += chunk.toString() })
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body)
              fs.writeFileSync(TASKS_FILE, JSON.stringify(parsed, null, 2))
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true }))
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid JSON' }))
            }
          })
          return
        }

        // POST /api/backlog/screenshot?name=file.png
        if (req.method === 'POST' && req.url?.startsWith('/api/backlog/screenshot')) {
          const url = new URL(req.url, 'http://localhost')
          const name = url.searchParams.get('name')
          if (!name) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Missing name param' }))
            return
          }

          const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_')
          const filePath = path.join(SCREENSHOTS_DIR, safeName)
          const chunks: Buffer[] = []

          req.on('data', (chunk: Buffer) => chunks.push(chunk))
          req.on('end', () => {
            try {
              fs.writeFileSync(filePath, Buffer.concat(chunks))
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ path: `backlog/screenshots/${safeName}` }))
            } catch {
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'Failed to save screenshot' }))
            }
          })
          return
        }

        // GET /api/backlog/screenshot/:name
        if (req.method === 'GET' && req.url?.startsWith('/api/backlog/screenshot/')) {
          const name = req.url.replace('/api/backlog/screenshot/', '')
          const safeName = decodeURIComponent(name).replace(/[^a-zA-Z0-9._-]/g, '_')
          const filePath = path.join(SCREENSHOTS_DIR, safeName)

          if (!fs.existsSync(filePath)) {
            res.statusCode = 404
            res.end('Not found')
            return
          }

          const ext = path.extname(safeName).toLowerCase()
          const mimeMap: Record<string, string> = {
            '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.gif': 'image/gif', '.webp': 'image/webp',
          }
          res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream')
          res.end(fs.readFileSync(filePath))
          return
        }

        next()
      })
    },
  }
}
