import { verifyToken } from '@clerk/backend'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' })
  }

  try {
    await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY })
  } catch {
    return res.status(401).json({ error: 'Invalid auth token' })
  }

  const { systemPrompt, content } = req.body || {}
  if (!systemPrompt || !content) {
    return res.status(400).json({ error: 'Missing systemPrompt or content' })
  }

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    }),
  })

  const data = await anthropicResponse.json().catch(() => ({}))
  return res.status(anthropicResponse.status).json(data)
}
