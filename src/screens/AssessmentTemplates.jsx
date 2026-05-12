import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
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

// Stable per-category tone so each card's icon background is consistent.
const TONES = ['blue', 'purple', 'green', 'amber', 'teal']
function toneFor(id) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return TONES[h % TONES.length]
}
const TONE_BG = {
  blue:   'bg-[var(--v4-blue-lt)]',
  purple: 'bg-[var(--v4-purple-lt)]',
  green:  'bg-[var(--v4-green-lt)]',
  amber:  'bg-[var(--v4-amber-lt)]',
  teal:   'bg-[var(--v4-teal-lt)]',
}

export default function AssessmentTemplates() {
  const navigate = useNavigate()
  const customTemplates = getCustomTemplates()

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[22px] font-bold text-[var(--v4-ink)] tracking-[-0.5px]">Assessment Library</h2>
        <span className="text-[11.5px] text-[var(--v4-ink-3)]">
          {SKILLS_CATEGORIES.length} assessments
        </span>
      </div>

      <p className="text-[12.5px] text-[var(--v4-ink-3)]">
        Each assessment has a built-in PDF template. Click any category to view, download, print, or upload your own version.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {SKILLS_CATEGORIES.map(category => {
          const hasCustom = !!customTemplates[category.id]
          const tone = toneFor(category.id)
          return (
            <button
              key={category.id}
              onClick={() => navigate(`/skills/${category.id}`)}
              className="group bg-[var(--v4-surface)] rounded-[10px] border border-[var(--v4-border)] p-4 text-left hover:border-[var(--v4-border-2)] transition-colors flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div className={`w-9 h-9 rounded-md flex items-center justify-center text-lg ${TONE_BG[tone]}`}>
                  {ICONS[category.id] || '📋'}
                </div>
                {hasCustom && (
                  <span className="text-[10px] bg-[var(--v4-green-lt)] text-[var(--v4-green)] px-1.5 py-0.5 rounded font-semibold">
                    Custom
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-[13.5px] font-semibold text-[var(--v4-ink)]">{category.label}</p>
                <p className="text-[11.5px] text-[var(--v4-ink-3)] mt-0.5 line-clamp-2">{category.desc}</p>
              </div>
              <div className="flex items-center text-[11.5px] text-[var(--v4-ink-3)] group-hover:text-[var(--v4-ink)]">
                Open
                <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
