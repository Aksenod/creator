import { list } from '@vercel/blob'

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).end()

  const { name } = req.query
  if (!name) return res.status(400).json({ error: 'Missing name' })

  const safeName = (name as string).replace(/[^a-zA-Z0-9._-]/g, '_')

  try {
    const { blobs } = await list({ prefix: `backlog-screenshots/${safeName}` })
    if (blobs.length === 0) return res.status(404).end('Not found')

    // Redirect to the blob URL (served by Vercel CDN)
    return res.redirect(308, blobs[0].url)
  } catch {
    return res.status(500).json({ error: 'Failed to read screenshot' })
  }
}
