const API_BASE_URL = import.meta.env.VITE_SKILLS_API_BASE_URL || 'http://localhost:4000'

async function parseJson(response) {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.')
  }
  return payload
}

export async function fetchSkillsCategories() {
  const response = await fetch(`${API_BASE_URL}/api/skills/categories`)
  return parseJson(response)
}

export async function fetchCategoryTemplate(categoryId) {
  const response = await fetch(`${API_BASE_URL}/api/skills/categories/${categoryId}/template`)
  return parseJson(response)
}

export async function uploadCategoryTemplate(categoryId, file) {
  const body = new FormData()
  body.append('template', file)
  const response = await fetch(`${API_BASE_URL}/api/skills/categories/${categoryId}/template`, {
    method: 'POST',
    body,
  })
  return parseJson(response)
}

export function getTemplateFileUrl(filePath) {
  if (!filePath) return null
  return `${API_BASE_URL}${filePath}`
}
