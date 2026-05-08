import { useNavigate } from 'react-router-dom'
import { SKILLS_CATEGORIES } from '../lib/skillsCategories'

const CUSTOM_KEY = 'decodable_custom_templates'

function getCustomTemplates() {
  return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '{}')
}

const ICONS = {
  'intake-snapshot': '📸',
  'phonological-awareness': '👂',
  'alphabet-knowledge': '🔤',
  'phonics-decoding': '📖',
  'phonics-automaticity': '⚡',
  'sight-word-fluency': '👀',
  'oral-reading-fluency': '🗣️',
  'spelling-encoding': '✏️',
  'vocabulary': '💬',
  'reading-comprehension': '🧠',
  'print-concepts': '📄',
  'writing-written-expression': '📝',
}

export default function AssessmentTemplates() {
  const navigate = useNavigate()
  const customTemplates = getCustomTemplates()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-black tracking-tight">📋 Assessment Library</h2>
        <span className="text-xs font-bold rounded-full bg-[var(--primary-light)] text-[var(--primary)] px-3 py-1">
          {SKILLS_CATEGORIES.length} assessments
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SKILLS_CATEGORIES.map(category => {
          const hasCustom = !!customTemplates[category.id]
          return (
            <button
              key={category.id}
              onClick={() => navigate(`/skills/${category.id}`)}
              className="bg-white rounded-2xl border-2 border-gray-100 p-5 text-left hover:border-[var(--primary)] hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{ICONS[category.id] || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-black text-sm">{category.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{category.desc}</p>
                </div>
                {hasCustom && (
                  <span className="text-[10px] bg-[var(--green-light)] text-[var(--green)] px-2 py-0.5 rounded-full font-bold shrink-0">Custom</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-100 p-4">
        <p className="text-xs text-gray-500">Each assessment has a built-in PDF template. Click any category to view, download, print, or upload your own custom version.</p>
      </div>
    </div>
  )
}
