import fs from 'node:fs/promises'
import path from 'node:path'

const DATA_DIR = path.resolve(process.cwd(), 'server/data')
const DATA_FILE = path.join(DATA_DIR, 'skills-templates.json')

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ templates: {} }, null, 2), 'utf8')
  }
}

export async function readTemplates() {
  await ensureStore()
  const raw = await fs.readFile(DATA_FILE, 'utf8')
  const parsed = JSON.parse(raw)
  return parsed.templates || {}
}

export async function writeTemplates(templates) {
  await ensureStore()
  await fs.writeFile(DATA_FILE, JSON.stringify({ templates }, null, 2), 'utf8')
}

export async function saveTemplate(categoryId, templateData) {
  const templates = await readTemplates()
  templates[categoryId] = templateData
  await writeTemplates(templates)
  return templateData
}
