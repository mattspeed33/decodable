import { useState } from 'react'
import { Brain, ChevronDown, Check } from 'lucide-react'
import { getAnalyses } from '../../lib/storage'
import { useAsync } from '../../lib/useAsync'

function relativeDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })
}

export default function AnalysisTab({ studentId }) {
  const { data: analyses = [] } = useAsync(() => getAnalyses(studentId), [studentId])
  const [expandedId, setExpandedId] = useState(null)

  if (analyses.length === 0) {
    return (
      <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] px-4 py-10 text-center">
        <Brain className="w-5 h-5 mx-auto mb-2 text-[var(--v4-ink-3)]" />
        <p className="text-[13px] font-medium text-[var(--v4-ink-2)]">No analyses yet</p>
        <p className="text-[12px] text-[var(--v4-ink-3)] mt-0.5">Run one from the Student Work tab.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <span className="text-[11.5px] text-[var(--v4-ink-3)]">{analyses.length} run{analyses.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] overflow-hidden">
        {analyses.map((analysis, i) => {
          const a = analysis.ai_analysis
          const expanded = expandedId === analysis.id
          return (
            <div key={analysis.id} className={i === analyses.length - 1 ? '' : 'border-b border-[var(--v4-border)]'}>
              <button
                onClick={() => setExpandedId(expanded ? null : analysis.id)}
                aria-expanded={expanded}
                className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-[var(--v4-surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--v4-ink)] focus-visible:-outline-offset-2 transition-colors"
              >
                <div className="w-8 h-8 rounded-md bg-[var(--v4-purple-lt)] text-[var(--v4-purple)] flex items-center justify-center shrink-0">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold text-[var(--v4-ink)]">
                    {a?.passage_level_reached || 'Analysis'}
                  </div>
                  <div className="text-[11.5px] text-[var(--v4-ink-3)] mt-0.5">
                    {(analysis.assessment_ids?.length || 0)} assessment{(analysis.assessment_ids?.length || 0) !== 1 ? 's' : ''}
                    {a?.priority_gaps?.length ? ` · ${a.priority_gaps.length} priority gaps` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a?.fluency_estimate_pct != null && (
                    <span className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded ${fluencyChipClass(a.fluency_estimate_pct)}`}>
                      {a.fluency_estimate_pct}%
                    </span>
                  )}
                  {a?.ufli_placement && (
                    <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded bg-[var(--v4-blue-lt)] text-[var(--v4-blue)]">
                      Unit {a.ufli_placement.current_working_unit}
                    </span>
                  )}
                  <span className="text-[11.5px] text-[var(--v4-ink-3)] whitespace-nowrap">
                    {relativeDate(analysis.date || analysis.created_at)}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[var(--v4-ink-4)] transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {expanded && a && <AnalysisDetail a={a} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function fluencyChipClass(pct) {
  if (pct >= 80) return 'bg-[var(--v4-green-lt)] text-[var(--v4-green)]'
  if (pct >= 50) return 'bg-[var(--v4-amber-lt)] text-[var(--v4-amber)]'
  return 'bg-[var(--v4-red-lt)] text-[var(--v4-red)]'
}

function AnalysisDetail({ a }) {
  return (
    <div className="px-4 py-4 bg-[var(--v4-surface-2)] border-t border-[var(--v4-border)] space-y-4">
      {a.strengths?.length > 0 && (
        <DetailBlock title="Strengths" tone="green">
          <ul className="space-y-1">
            {a.strengths.map((s, i) => (
              <li key={i} className="text-[13px] text-[var(--v4-ink-2)] flex gap-1.5 items-start">
                <Check className="w-3.5 h-3.5 text-[var(--v4-green)] mt-0.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </DetailBlock>
      )}

      {a.priority_gaps?.length > 0 && (
        <DetailBlock title="Focus Areas" tone="red">
          <ul className="space-y-1.5">
            {a.priority_gaps.map((g, i) => (
              <li key={i} className="text-[13px] text-[var(--v4-ink-2)] flex gap-1.5 items-start">
                <span className="bg-[var(--v4-red-lt)] text-[var(--v4-red)] text-[10.5px] font-bold w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5">{g.rank}</span>
                <span><span className="font-semibold text-[var(--v4-ink)]">{g.gap}:</span> <span className="text-[var(--v4-ink-3)]">{g.why_it_matters}</span></span>
              </li>
            ))}
          </ul>
        </DetailBlock>
      )}

      {a.patterns_to_watch?.length > 0 && (
        <DetailBlock title="Watch" tone="amber">
          <ul className="space-y-1">
            {a.patterns_to_watch.map((p, i) => (
              <li key={i} className="text-[13px] text-[var(--v4-ink-2)] flex gap-1.5 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--v4-amber)] mt-2 shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </DetailBlock>
      )}

      {a.ufli_placement && (
        <div className="grid grid-cols-3 gap-2">
          <UfliCell title="Mastered" unit={a.ufli_placement.last_unit_mastered} name={a.ufli_placement.last_unit_name} />
          <UfliCell title="Working on" unit={a.ufli_placement.current_working_unit} name={a.ufli_placement.current_unit_name} current />
          <UfliCell title="Next up" unit={a.ufli_placement.next_unlock_unit} name={a.ufli_placement.next_unlock_name} />
        </div>
      )}

      {(a.week_arc || a.four_week_arc) && (
        <DetailBlock title="Week Arc">
          <ul className="space-y-1">
            {(a.week_arc || a.four_week_arc).map((week, i) => (
              <li key={i} className="text-[13px] flex gap-1.5 items-start">
                <span className="bg-[var(--v4-purple-lt)] text-[var(--v4-purple)] text-[10.5px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0">{week.week}</span>
                <span><span className="font-semibold text-[var(--v4-ink)]">{week.focus}:</span> <span className="text-[var(--v4-ink-3)]">{week.activity_type}</span></span>
              </li>
            ))}
          </ul>
        </DetailBlock>
      )}

      <details className="border border-[var(--v4-border)] rounded-md bg-[var(--v4-surface)]">
        <summary className="px-3 py-2 text-[11.5px] font-semibold text-[var(--v4-ink-3)] cursor-pointer uppercase tracking-[0.6px]">Detailed breakdown</summary>
        <div className="px-3 pb-3 pt-2 border-t border-[var(--v4-border)] space-y-3">
          {a.scarboroughs_rope && (
            <div>
              <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-1">Scarborough's Rope</p>
              <ul className="space-y-0.5">
                {['phonological_awareness', 'decoding', 'sight_recognition', 'vocabulary', 'verbal_reasoning'].map(key => (
                  <li key={key} className="text-[12px] flex justify-between">
                    <span className="text-[var(--v4-ink-2)] capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-semibold text-[var(--v4-ink)]">{a.scarboroughs_rope[key]}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {a.hegarty_placement && (
            <div>
              <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-1">Hegarty</p>
              <p className="text-[12px] text-[var(--v4-ink-2)]">
                Through <span className="font-semibold text-[var(--v4-green)]">{a.hegarty_placement.highest_mastered}</span>,
                breaks at <span className="font-semibold text-[var(--v4-amber)]">{a.hegarty_placement.breaking_down_at}</span>
              </p>
            </div>
          )}
          {a.fluency_rationale && (
            <div>
              <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-1">Fluency</p>
              <p className="text-[12px] text-[var(--v4-ink-2)]">{a.fluency_rationale}</p>
            </div>
          )}
        </div>
      </details>

      {a.confidence && (
        <p className="text-[10.5px] text-[var(--v4-ink-4)] text-center">Confidence: {a.confidence}</p>
      )}
    </div>
  )
}

const EYEBROW_TONE = {
  green: 'text-[var(--v4-green)]',
  red:   'text-[var(--v4-red)]',
  amber: 'text-[var(--v4-amber)]',
}

function DetailBlock({ title, tone, children }) {
  const labelColor = EYEBROW_TONE[tone] || 'text-[var(--v4-ink-3)]'
  return (
    <div>
      <p className={`text-[10.5px] font-semibold uppercase tracking-[0.6px] mb-1.5 ${labelColor}`}>{title}</p>
      {children}
    </div>
  )
}

function UfliCell({ title, unit, name, current }) {
  return (
    <div className={`rounded-md p-2.5 text-center border ${current ? 'border-[var(--v4-ink)]' : 'border-[var(--v4-border)]'} bg-[var(--v4-surface)]`}>
      <p className="text-[10px] uppercase font-semibold tracking-[0.6px] text-[var(--v4-ink-3)]">{title}</p>
      <p className="text-[18px] font-bold mt-0.5 text-[var(--v4-ink)]">{unit}</p>
      <p className="text-[10px] mt-0.5 text-[var(--v4-ink-3)]">{name}</p>
    </div>
  )
}
