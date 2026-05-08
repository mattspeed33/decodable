import cors from 'cors'
import express from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import multer from 'multer'
import { SKILLS_CATEGORIES, SKILLS_CATEGORY_IDS } from './skillsCategories.js'
import { readTemplates, saveTemplate, writeTemplates } from './templateStore.js'

const app = express()
const PORT = Number(process.env.PORT || 4000)
const uploadsRoot = path.resolve(process.cwd(), 'server/uploads/skills-templates')

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())
app.use('/files', express.static(path.resolve(process.cwd(), 'server/uploads')))

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { categoryId } = req.params
    const target = path.join(uploadsRoot, categoryId)
    await fs.mkdir(target, { recursive: true })
    cb(null, target)
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '-')
    cb(null, `${timestamp}-${safeName}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')
    if (!isPdf) return cb(new Error('Only PDF files are allowed.'))
    cb(null, true)
  },
})

function assertCategory(req, res, next) {
  if (!SKILLS_CATEGORY_IDS.has(req.params.categoryId)) {
    return res.status(404).json({ error: 'Unknown category.' })
  }
  next()
}

app.get('/api/skills/categories', async (_req, res) => {
  const templates = await readTemplates()
  const categories = SKILLS_CATEGORIES.map((category) => ({
    ...category,
    customTemplate: templates[category.id] || null,
  }))
  res.json({ categories })
})

app.get('/api/skills/categories/:categoryId/template', assertCategory, async (req, res) => {
  const templates = await readTemplates()
  res.json({
    categoryId: req.params.categoryId,
    customTemplate: templates[req.params.categoryId] || null,
  })
})

app.post('/api/skills/categories/:categoryId/template', assertCategory, upload.single('template'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' })
  }

  const relativeFilePath = `/files/skills-templates/${req.params.categoryId}/${req.file.filename}`
  const record = {
    originalName: req.file.originalname,
    fileName: req.file.filename,
    filePath: relativeFilePath,
    uploadedAt: new Date().toISOString(),
  }

  await saveTemplate(req.params.categoryId, record)
  res.status(201).json({ categoryId: req.params.categoryId, customTemplate: record })
})

app.delete('/api/skills/categories/:categoryId/template', assertCategory, async (req, res) => {
  const templates = await readTemplates()
  delete templates[req.params.categoryId]
  await writeTemplates(templates)
  res.json({ ok: true })
})

app.use((err, _req, res, _next) => {
  res.status(400).json({ error: err.message || 'Request failed.' })
})

app.listen(PORT, () => {
  console.log(`Skills API listening on http://localhost:${PORT}`)
})
