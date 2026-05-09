import { SKILLS_CATEGORIES } from '../lib/skillsCategories'

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

export default function CategoryPicker({ onSelect, onCancel }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-black text-lg">Choose Assessment Type</h3>
        <button onClick={onCancel} className="text-xs font-bold text-gray-400 hover:text-black transition">Cancel</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SKILLS_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="bg-white rounded-2xl border-2 border-gray-100 p-4 text-left hover:border-[var(--primary)] hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{ICONS[cat.id] || '📋'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-black text-sm">{cat.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{cat.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
