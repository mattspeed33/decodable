import { requireUser } from './auth.js'
import { sql } from './db.js'

// Whitelists to keep table/column names out of template strings going into SQL.
const ALLOWED_ORDER = new Set(['created_at', 'updated_at', 'date', 'date_sent'])
const ALLOWED_DIR = new Set(['asc', 'desc'])

/**
 * Builds the GET (list) + POST (upsert) handler for `api/{resource}/index.js`.
 *
 * Options:
 *   table          SQL table name (also used as identifier, so trust the caller)
 *   columns        promoted columns stored alongside data jsonb (e.g. ['student_id', 'date'])
 *   orderBy        column to ORDER BY when listing (default 'created_at')
 *   orderDir       'asc' | 'desc' (default 'desc')
 *   scopeColumns   list filter columns honored from req.query (e.g. ['student_id'])
 *   hasUpdatedAt   whether the table has an updated_at column (default true)
 *
 * On read, returns `{ id, ...data }` so the API shape matches what the
 * frontend stores in localStorage today (id + flat fields).
 */
export function makeCollectionHandler({
  table,
  columns = [],
  orderBy = 'created_at',
  orderDir = 'desc',
  scopeColumns = [],
  hasUpdatedAt = true,
}) {
  if (!ALLOWED_ORDER.has(orderBy)) throw new Error(`Invalid orderBy: ${orderBy}`)
  if (!ALLOWED_DIR.has(orderDir)) throw new Error(`Invalid orderDir: ${orderDir}`)

  return async (req, res) => {
    const userId = await requireUser(req, res)
    if (!userId) return

    if (req.method === 'GET') {
      const params = [userId]
      let where = 'user_id = $1'
      for (const col of scopeColumns) {
        if (req.query[col]) {
          params.push(req.query[col])
          where += ` AND ${col} = $${params.length}`
        }
      }
      const rows = await sql.query(
        `SELECT id, data FROM ${table}
         WHERE ${where}
         ORDER BY ${orderBy} ${orderDir.toUpperCase()} NULLS LAST`,
        params,
      )
      return res.status(200).json(rows.map(r => ({ id: r.id, ...r.data })))
    }

    if (req.method === 'POST') {
      const { id, ...data } = req.body || {}
      if (!id) return res.status(400).json({ error: 'Missing id' })

      const insertCols = ['id', 'user_id', 'data', ...columns]
      const placeholders = insertCols.map((_, i) => `$${i + 1}`)
      const values = [id, userId, JSON.stringify(data), ...columns.map(c => data[c] ?? null)]

      const updateAssignments = ['data = EXCLUDED.data']
      if (hasUpdatedAt) updateAssignments.push('updated_at = now()')
      for (const c of columns) updateAssignments.push(`${c} = EXCLUDED.${c}`)

      await sql.query(
        `INSERT INTO ${table} (${insertCols.join(', ')})
         VALUES (${placeholders.join(', ')})
         ON CONFLICT (id) DO UPDATE SET ${updateAssignments.join(', ')}
           WHERE ${table}.user_id = $2`,
        values,
      )

      return res.status(200).json({ id, ...data })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

/**
 * Builds the GET (one) + DELETE handler for `api/{resource}/[id].js`.
 * All queries are scoped by user_id so users can never read/delete each
 * other's rows even if they guess an id.
 */
export function makeItemHandler({ table }) {
  return async (req, res) => {
    const userId = await requireUser(req, res)
    if (!userId) return

    const { id } = req.query

    if (req.method === 'GET') {
      const rows = await sql.query(
        `SELECT id, data FROM ${table} WHERE user_id = $1 AND id = $2 LIMIT 1`,
        [userId, id],
      )
      if (rows.length === 0) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json({ id: rows[0].id, ...rows[0].data })
    }

    if (req.method === 'DELETE') {
      await sql.query(`DELETE FROM ${table} WHERE user_id = $1 AND id = $2`, [userId, id])
      return res.status(204).end()
    }

    res.setHeader('Allow', 'GET, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  }
}
