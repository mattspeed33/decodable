import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchCategoryTemplate, getTemplateFileUrl, uploadCategoryTemplate } from '../lib/skillsApi'
import { getCategoryById, getDefaultPdfPath } from '../lib/skillsCategories'

export default function AssessmentTemplateDetail() {
  const { categoryId } = useParams()
  const category = getCategoryById(categoryId)
  const [customTemplate, setCustomTemplate] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!categoryId) return
    fetchCategoryTemplate(categoryId)
      .then((data) => {
        setCustomTemplate(data.customTemplate || null)
        setError('')
      })
      .catch((err) => {
        setError(err.message || 'Failed to load template details.')
      })
  }, [categoryId])

  if (!category) {
    return <p className="text-center text-gray-400 py-20">Category not found.</p>
  }

  const defaultPdfPath = getDefaultPdfPath(category.id)
  const customTemplateUrl = customTemplate ? getTemplateFileUrl(customTemplate.filePath) : null

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      setError('')
      const data = await uploadCategoryTemplate(category.id, file)
      setCustomTemplate(data.customTemplate || null)
    } catch (err) {
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-black tracking-tight">{category.label}</h2>
        <span className="text-xs bg-pink-100 text-pink-700 px-3 py-1 rounded-full font-bold">
          {customTemplate ? 'Custom uploaded' : 'Default only'}
        </span>
      </div>

      <div className="template-sheet rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <p className="text-sm text-gray-700">
          Open a default PDF template, or upload your own PDF file for this skill category.
        </p>
        {customTemplate && (
          <p className="text-xs text-gray-500">
            Current custom file: <span className="font-semibold text-black">{customTemplate.originalName}</span>
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="action-buttons non-print space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href={defaultPdfPath} target="_blank" rel="noreferrer" className="text-center bg-[var(--primary)] text-white py-3 rounded-full font-semibold hover:bg-[var(--primary-hover)] transition">
            Open Default PDF
          </a>
          <a href={defaultPdfPath} download className="text-center bg-white border border-gray-200 py-3 rounded-full font-semibold text-black hover:border-black transition">
            Download Default PDF
          </a>
        </div>
        {customTemplateUrl && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href={customTemplateUrl} target="_blank" rel="noreferrer" className="text-center bg-[var(--green)] text-white py-3 rounded-full font-semibold hover:opacity-90 transition">
              Open Custom PDF
            </a>
            <a href={customTemplateUrl} download className="text-center bg-white border border-gray-200 py-3 rounded-full font-semibold text-black hover:border-black transition">
              Download Custom PDF
            </a>
          </div>
        )}
      </div>

      <div className="non-print rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
        <h3 className="font-bold text-black">Upload Custom PDF</h3>
        <p className="text-sm text-gray-600">Upload your own printable template for this category. This file will be saved on the backend.</p>
        <input type="file" accept="application/pdf" onChange={handleUpload} disabled={uploading} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
        <p className="text-xs text-gray-500">{uploading ? 'Uploading...' : 'PDF files only.'}</p>
      </div>
    </div>
  )
}
