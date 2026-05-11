import { requireUser } from '../_lib/auth.js'
import { sql } from '../_lib/db.js'

// GET  /api/students          → list this user's students
// POST /api/students  body=student → upsert by id (matches current saveStudent)
export default async function handler(req, res) {
  const userId = await requireUser(req, res)
  if (!userId) return

  if (req.method === 'GET') {
    const rows = await sql`
      SELECT id, data FROM students
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `
    return res.status(200).json(rows.map(r => ({ id: r.id, ...r.data })))
  }

  if (req.method === 'POST') {
    const { id, ...data } = req.body || {}
    if (!id) return res.status(400).json({ error: 'Missing student id' })

    await sql`
      INSERT INTO students (id, user_id, data)
      VALUES (${id}, ${userId}, ${JSON.stringify(data)}::jsonb)
      ON CONFLICT (id) DO UPDATE
        SET data = EXCLUDED.data, updated_at = now()
        WHERE students.user_id = ${userId}
    `
    return res.status(200).json({ id, ...data })
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
