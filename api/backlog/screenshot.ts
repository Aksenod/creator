import { put } from '@vercel/blob'

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // POST /api/backlog/screenshot?name=file.png
  if (req.method === 'POST') {
    const name = req.query?.name
    if (!name) return res.status(400).json({ error: 'Missing name param' })

    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_')

    try {
      // req.body is a Buffer in Vercel serverless (raw body)
      const buffer = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(req.body)

      await put(`backlog-screenshots/${safeName}`, buffer, {
        access: 'public',
        addRandomSuffix: false,
      })
      return res.json({ path: `backlog/screenshots/${safeName}` })
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Failed to save screenshot' })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}

export const config = {
  api: { bodyParser: false },
}
