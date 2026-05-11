import { neon } from '@neondatabase/serverless'

// HTTP-based Neon client. Fast cold starts on Vercel Functions because it
// doesn't open a TCP connection — every query is a fetch.
// Usage: `await sql\`SELECT id, data FROM students WHERE user_id = ${userId}\``
export const sql = neon(process.env.DATABASE_URL)
