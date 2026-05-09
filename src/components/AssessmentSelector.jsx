import { SKILLS_CATEGORIES } from '../lib/skillsCategories'

const ICONS = {
  'intake-snapshot': '📸', 'phonological-awareness': '👂', 'alphabet-knowledge': '🔤',
  'phonics-decoding': '📖', 'phonics-automaticity': '⚡', 'sight-word-fluency': '👀',
  'oral-reading-fluency': '🗣️', 'spelling-encoding': '✏️', 'vocabulary': '💬',
  'reading-comprehension': '🧠', 'print-concepts': '📄', 'writing-written-expression': '📝',
}

function getCategoryLabel(id) {
  return SKILLS_CATEGORIES.find(c => c.id === id)?.label || id
}

export default function AssessmentSelector({ assessments, selected, setSelected, onAnalyze, onCancel, loading }) {
  function toggle(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function selectAll() {
    setSelected(assessments.map(a => a.id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-black text-lg">Select Assessments for Analysis</h3>
        <button onClick={onCancel} className="text-xs font-bold text-gray-400 hover:text-black transition">Cancel</button>
      </div>

      <div className="flex gap-2">
        <button onClick={selectAll} className="text-xs font-bold text-[var(--primary)] hover:underline">Select All</button>
        <button onClick={() => setSelected([])} className="text-xs font-bold text-gray-400 hover:underline">Clear</button>
      </div>

      <div className="space-y-2">
        {assessments.map(assessment => {
          const checked = selected.includes(assessment.id)
          return (
            <button
              key={assessment.id}
              onClick={() => toggle(assessment.id)}
              className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 transition ${
                checked ? 'border-[var(--primary)] bg-[var(--primary-light)]' : 'border-gray-100 bg-white hover:border-gray-300'
              }`}
            >
              <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs shrink-0 ${
                checked ? 'bg-[var(--primary)] border-[var(--primary)] text-white' : 'border-gray-200'
              }`}>
                {checked ? '✓' : ''}
              </span>
              <span className="text-lg">{ICONS[assessment.category_id] || '📋'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-black">{getCategoryLabel(assessment.category_id)}</p>
                <p className="text-[10px] text-gray-400 font-semibold">
                  {new Date(assessment.date).toLocaleDateString()}
                  {' · '}
                  {assessment.entry_method === 'digital' ? '📝 Digital' : '📸 Photos'}
                  {assessment.photos?.length > 0 && ` · ${assessment.photos.length} photo${assessment.photos.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <button
        onClick={onAnalyze}
        disabled={selected.length === 0 || loading}
        className="w-full bg-[var(--primary)] text-white py-3 rounded-full font-bold hover:bg-[var(--primary-hover)] transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {loading ? 'Analyzing...' : `🧠 Analyze ${selected.length} Assessment${selected.length !== 1 ? 's' : ''}`}
      </button>
    </div>
  )
}
