import { ArrowRight } from 'lucide-react'
import { SKILLS_CATEGORIES } from '../lib/skillsCategories'
import { CloseBtn } from './v4/primitives.jsx'

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

export default function CategoryPicker({ onSelect, onCancel }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-[var(--v4-ink)]">Choose Assessment Type</h3>
        <CloseBtn onClick={onCancel} label="Cancel category picker" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {SKILLS_CATEGORIES.map(cat => {
          const tone = toneFor(cat.id)
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className="group bg-[var(--v4-surface)] rounded-[10px] border border-[var(--v4-border)] p-4 text-left hover:border-[var(--v4-border-2)] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-md flex items-center justify-center text-lg shrink-0 ${TONE_BG[tone]}`}>
                  {ICONS[cat.id] || '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-[var(--v4-ink)]">{cat.label}</p>
                  <p className="text-[11.5px] text-[var(--v4-ink-3)] mt-0.5 leading-tight">{cat.desc}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--v4-ink-4)] group-hover:text-[var(--v4-ink-2)] mt-1 shrink-0" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
