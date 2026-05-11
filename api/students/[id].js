import { requireUser } from '../_lib/auth.js'
import { sql } from '../_lib/db.js'

// GET    /api/students/:id  → one student
// DELETE /api/students/:id  → remove
export default async function handler(req, res) {
  const userId = await requireUser(req, res)
  if (!userId) return

  const { id } = req.query

  if (req.method === 'GET') {
    const rows = await sql`
      SELECT id, data FROM students
      WHERE user_id = ${userId} AND id = ${id}
      LIMIT 1
    `
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json({ id: rows[0].id, ...rows[0].data })
  }

  if (req.method === 'DELETE') {
    await sql`DELETE FROM students WHERE user_id = ${userId} AND id = ${id}`
    return res.status(204).end()
  }

  res.setHeader('Allow', 'GET, DELETE')
  return res.status(405).json({ error: 'Method not allowed' })
}
