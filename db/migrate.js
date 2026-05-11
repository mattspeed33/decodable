import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, 'migrations')

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL not set. Run with: node --env-file=.env.local db/migrate.js')
  process.exit(1)
}

const client = new pg.Client({ connectionString })
await client.connect()

await client.query(`
  create table if not exists _migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )
`)

const applied = new Set(
  (await client.query('select name from _migrations')).rows.map(r => r.name)
)

const files = (await readdir(migrationsDir)).filter(f => f.endsWith('.sql')).sort()
let ran = 0
for (const file of files) {
  if (applied.has(file)) {
    console.log(`skip  ${file} (already applied)`)
    continue
  }
  const sql = await readFile(join(migrationsDir, file), 'utf8')
  await client.query('begin')
  try {
    await client.query(sql)
    await client.query('insert into _migrations (name) values ($1)', [file])
    await client.query('commit')
    console.log(`apply ${file}`)
    ran++
  } catch (err) {
    await client.query('rollback')
    console.error(`fail  ${file}:`, err.message)
    process.exit(1)
  }
}

await client.end()
console.log(ran === 0 ? 'no migrations to run' : `applied ${ran} migration(s)`)
