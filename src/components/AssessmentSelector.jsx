import { Check, Sparkles, X } from 'lucide-react'
import { SKILLS_CATEGORIES } from '../lib/skillsCategories'
import { BtnPrimary } from './v4/primitives.jsx'

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
        <h3 className="text-[15px] font-bold text-[var(--v4-ink)]">Select Student Work for Analysis</h3>
        <button onClick={onCancel} className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--v4-ink-3)] hover:bg-[var(--v4-surface-3)] hover:text-[var(--v4-ink)]" title="Cancel">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 text-[11.5px]">
        <button onClick={selectAll} className="text-[var(--v4-ink-2)] hover:text-[var(--v4-ink)] font-medium">Select all</button>
        <span className="text-[var(--v4-ink-4)]">·</span>
        <button onClick={() => setSelected([])} className="text-[var(--v4-ink-3)] hover:text-[var(--v4-ink)] font-medium">Clear</button>
      </div>

      <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] overflow-hidden">
        {assessments.map((assessment, i) => {
          const checked = selected.includes(assessment.id)
          return (
            <button
              key={assessment.id}
              onClick={() => toggle(assessment.id)}
              className={`w-full grid items-center gap-3 px-4 py-3 text-left transition ${
                checked ? 'bg-[var(--v4-purple-lt)]' : 'hover:bg-[var(--v4-surface-2)]'
              } ${i === assessments.length - 1 ? '' : 'border-b border-[var(--v4-border)]'}`}
              style={{ gridTemplateColumns: '20px 32px 1fr auto' }}
            >
              <span
                className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center border ${
                  checked ? 'bg-[var(--v4-ink)] border-[var(--v4-ink)]' : 'border-[var(--v4-border-2)] bg-[var(--v4-surface)]'
                }`}
              >
                {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </span>
              <span className="w-8 h-8 rounded-md bg-[var(--v4-blue-lt)] flex items-center justify-center text-base shrink-0">
                {ICONS[assessment.category_id] || '📋'}
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-[var(--v4-ink)] truncate">{getCategoryLabel(assessment.category_id)}</p>
                <p className="text-[11.5px] text-[var(--v4-ink-3)] truncate mt-0.5">
                  {new Date(assessment.date).toLocaleDateString()}
                  {' · '}
                  {assessment.entry_method === 'digital' ? 'Digital' : 'Photos'}
                  {assessment.photos?.length > 0 && ` · ${assessment.photos.length} photo${assessment.photos.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <BtnPrimary
        onClick={onAnalyze}
        disabled={selected.length === 0 || loading}
        className={`w-full justify-center py-2.5 ${selected.length === 0 || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        {loading ? 'Analyzing…' : `Analyze ${selected.length} Item${selected.length !== 1 ? 's' : ''}`}
      </BtnPrimary>
    </div>
  )
}
