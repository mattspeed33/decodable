import { useState, useReducer } from 'react'
import { useParams } from 'react-router-dom'
import { getCategoryById, getDefaultPdfPath } from '../lib/skillsCategories'

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
  const { categoryId } = useParams()
  const category = getCategoryById(categoryId)
  const [uploading, setUploading] = useState(false)
  const [, refresh] = useReducer(x => x + 1, 0)

  const custom = getCustomTemplates()[categoryId] || null

  if (!category) {
    return <p className="text-center text-gray-400 py-20">Category not found.</p>
  }

  const defaultPdfPath = getDefaultPdfPath(category.id)

  function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = { name: file.name, dataUrl: ev.target.result, uploadedAt: new Date().toISOString() }
      saveCustomTemplate(categoryId, data)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-black tracking-tight">{category.label}</h2>
        <span className={`text-xs px-3 py-1 rounded-full font-bold ${custom ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-gray-100 text-gray-500'}`}>
          {custom ? 'Custom uploaded' : 'Default only'}
        </span>
      </div>

      {/* PDF Preview */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
        <iframe
          src={custom ? custom.dataUrl : defaultPdfPath}
          className="w-full h-[600px]"
          title={`${category.label} PDF`}
        />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href={custom ? custom.dataUrl : defaultPdfPath}
          target="_blank"
          rel="noreferrer"
          className="text-center bg-[var(--primary)] text-white py-3 rounded-full font-bold hover:bg-[var(--primary-hover)] transition"
        >
          📄 Open {custom ? 'Custom' : 'Default'} PDF
        </a>
        <a
          href={custom ? custom.dataUrl : defaultPdfPath}
          download={custom ? custom.name : `${category.id}.pdf`}
          className="text-center bg-white border-2 border-gray-100 py-3 rounded-full font-bold text-black hover:border-[var(--primary)] transition"
        >
          📥 Download PDF
        </a>
      </div>

      {/* Custom upload */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 space-y-3">
        <h3 className="font-black text-black text-sm">📤 Upload Custom Template</h3>
        <p className="text-xs text-gray-500">Replace the default with your own PDF for this assessment category.</p>

        {custom && (
          <div className="flex items-center justify-between bg-[var(--green-light)] rounded-xl p-3">
            <div>
              <p className="text-xs font-bold text-[var(--green)]">Custom template active</p>
              <p className="text-[10px] text-gray-500">{custom.name} &middot; {new Date(custom.uploadedAt).toLocaleDateString()}</p>
            </div>
            <button onClick={handleRemove} className="text-[10px] font-bold text-[var(--red)] hover:underline">Remove</button>
          </div>
        )}

        <div className="flex gap-3 items-center">
          <label className="flex-1 bg-white border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-[var(--primary)] transition">
            <p className="text-xs font-bold text-gray-500">{uploading ? 'Uploading...' : 'Click to upload PDF'}</p>
            <input type="file" accept="application/pdf" onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>
        </div>
      </div>

      {/* Print button */}
      <button onClick={() => window.print()} className="w-full bg-white border-2 border-gray-100 py-3 rounded-full font-bold text-black hover:border-[var(--primary)] transition">
        🖨️ Print
      </button>
    </div>
  )
}
