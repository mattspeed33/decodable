import { useState, useReducer } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Download, Printer, Upload, Trash2 } from 'lucide-react'
import { getCategoryById, getDefaultPdfPath } from '../lib/skillsCategories'
import { BtnSecondary, Card } from '../components/v4/primitives.jsx'

const STORAGE_KEY = 'decodable_custom_templates'

function getCustomTemplates() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
}

function saveCustomTemplate(categoryId, data) {
  const all = getCustomTemplates()
  all[categoryId] = data
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

function removeCustomTemplate(categoryId) {
  const all = getCustomTemplates()
  delete all[categoryId]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export default function AssessmentTemplateDetail() {
  const navigate = useNavigate()
  const { categoryId } = useParams()
  const category = getCategoryById(categoryId)
  const [uploading, setUploading] = useState(false)
  const [, refresh] = useReducer(x => x + 1, 0)

  const custom = getCustomTemplates()[categoryId] || null

  if (!category) {
    return <p className="text-center text-[var(--v4-ink-3)] py-20 text-sm font-medium">Category not found.</p>
  }

  const defaultPdfPath = getDefaultPdfPath(category.id)
  const pdfPath = custom ? custom.dataUrl : defaultPdfPath
  const fileName = custom ? custom.name : `${category.id}.pdf`

  function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      saveCustomTemplate(categoryId, {
        name: file.name,
        dataUrl: ev.target.result,
        uploadedAt: new Date().toISOString(),
      })
      setUploading(false)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleRemove() {
    removeCustomTemplate(categoryId)
    refresh()
  }

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <button
        onClick={() => navigate('/templates')}
        className="flex items-center gap-1 text-[11.5px] text-[var(--v4-ink-3)] hover:text-[var(--v4-ink)] font-medium"
      >
        <ArrowLeft className="w-3 h-3" /> Library
      </button>

      <div className="flex items-baseline justify-between">
        <h2 className="text-[22px] font-bold text-[var(--v4-ink)] tracking-[-0.5px]">{category.label}</h2>
        <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
          custom
            ? 'bg-[var(--v4-green-lt)] text-[var(--v4-green)]'
            : 'bg-[var(--v4-surface-3)] text-[var(--v4-ink-3)]'
        }`}>
          {custom ? 'Custom uploaded' : 'Default only'}
        </span>
      </div>

      {/* PDF preview */}
      <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] overflow-hidden">
        <iframe
          src={pdfPath}
          className="w-full h-[600px]"
          title={`${category.label} PDF`}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={pdfPath}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[var(--v4-ink)] text-white text-[12.5px] font-semibold hover:bg-[#0d0a08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--v4-ink)] focus-visible:outline-offset-2"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Open {custom ? 'Custom' : 'Default'} PDF
        </a>
        <a
          href={pdfPath}
          download={fileName}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--v4-surface)] border border-[var(--v4-border)] text-[12.5px] font-medium text-[var(--v4-ink-2)] hover:bg-[var(--v4-surface-3)]"
        >
          <Download className="w-3.5 h-3.5" /> Download
        </a>
        <BtnSecondary onClick={() => window.print()}>
          <Printer className="w-3.5 h-3.5" /> Print
        </BtnSecondary>
      </div>

      {/* Custom upload */}
      <Card padding="p-4" className="space-y-2.5">
        <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px]">Upload Custom Template</p>
        <p className="text-[12px] text-[var(--v4-ink-3)]">
          Replace the default with your own PDF for this category.
        </p>

        {custom && (
          <div className="flex items-center justify-between bg-[var(--v4-green-lt)] rounded-md p-2.5">
            <div>
              <p className="text-[11.5px] font-semibold text-[var(--v4-green)]">Custom template active</p>
              <p className="text-[10.5px] text-[var(--v4-ink-3)]">
                {custom.name} &middot; {new Date(custom.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--v4-ink-3)] hover:text-[var(--v4-red)] hover:bg-white"
              title="Remove custom template"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <label className="block bg-[var(--v4-surface)] border border-dashed border-[var(--v4-border-2)] rounded-md p-3 text-center cursor-pointer hover:border-[var(--v4-ink)] transition-colors">
          <Upload className="w-4 h-4 mx-auto mb-1 text-[var(--v4-ink-3)]" />
          <p className="text-[12px] font-medium text-[var(--v4-ink-2)]">
            {uploading ? 'Uploading…' : 'Click to upload PDF'}
          </p>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </Card>
    </div>
  )
}
