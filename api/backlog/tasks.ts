import { put, list } from '@vercel/blob'

const BLOB_KEY = 'backlog-tasks.json'
const DEFAULT_DATA = { version: 1, tasks: [] }

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // GET — read tasks from Vercel Blob
  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: BLOB_KEY })
      if (blobs.length === 0) return res.json(DEFAULT_DATA)
      const response = await fetch(blobs[0].url)
      const data = await response.json()
      return res.json(data)
    } catch {
      return res.json(DEFAULT_DATA)
    }
  }

  // PUT — write tasks to Vercel Blob
  if (req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
      await put(BLOB_KEY, body, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
      })
      return res.json({ ok: true })
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Failed to save' })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
