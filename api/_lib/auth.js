import { verifyToken } from '@clerk/backend'

// Verifies the Clerk session JWT from the Authorization header.
// Returns the Clerk user_id (e.g. "user_2abc...") on success.
// On failure, writes a 401 response and returns null — caller should `return`.
export async function requireUser(req, res) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    res.status(401).json({ error: 'Missing auth token' })
    return null
  }
  try {
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY })
    return payload.sub
  } catch {
    res.status(401).json({ error: 'Invalid auth token' })
    return null
  }
}
