import pg from 'pg'

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

const tables = await client.query(`
  select table_name from information_schema.tables
  where table_schema = 'public'
  order by table_name
`)

const counts = []
for (const row of tables.rows) {
  const r = await client.query(`select count(*)::int as n from "${row.table_name}"`)
  counts.push({ table: row.table_name, rows: r.rows[0].n })
}
console.table(counts)
await client.end()
