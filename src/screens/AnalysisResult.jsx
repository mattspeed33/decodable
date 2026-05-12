import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, ClipboardList, Undo2 } from 'lucide-react'
import { saveAnalysis, getStudent } from '../lib/storage'
import { useAsync } from '../lib/useAsync'
import { BtnPrimary, BtnSecondary, Card } from '../components/v4/primitives.jsx'

export default function AnalysisResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: student } = useAsync(() => getStudent(id), [id])
  const [data] = useState(() => {
    const raw = sessionStorage.getItem('decodable_pending_analysis')
    return raw ? JSON.parse(raw) : null
  })

  if (!data) {
    return (
      <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] px-4 py-12 text-center">
        <p className="text-[13px] font-medium text-[var(--v4-ink-2)]">No analysis data found</p>
        <p className="text-[12px] text-[var(--v4-ink-3)] mt-0.5">Upload an assessment first.</p>
      </div>
    )
  }

  const a = data.ai_analysis

  async function handleSave() {
    const analysis = {
      id: crypto.randomUUID(),
      student_id: data.student_id,
      date: data.date,
      assessment_ids: data.assessment_ids || [],
      ai_analysis: data.ai_analysis,
      created_at: new Date().toISOString(),
    }
    await saveAnalysis(analysis)
    sessionStorage.removeItem('decodable_pending_analysis')
    navigate(`/students/${id}`)
  }

  function handleDiscard() {
    sessionStorage.removeItem('decodable_pending_analysis')
    navigate(`/students/${id}`)
  }

  return (
    <div className="max-w-3xl space-y-5">
      <button
        onClick={() => navigate(`/students/${id}`)}
        className="flex items-center gap-1 text-[11.5px] text-[var(--v4-ink-3)] hover:text-[var(--v4-ink)] font-medium"
      >
        <ArrowLeft className="w-3 h-3" /> {student?.name || 'Student'}
      </button>

      <div className="flex items-baseline justify-between">
        <h2 className="text-[22px] font-bold text-[var(--v4-ink)] tracking-[-0.5px]">Analysis Result</h2>
        <p className="text-[12.5px] text-[var(--v4-ink-3)]">{data.date}</p>
      </div>

      {/* Top badges */}
      <div className="flex flex-wrap gap-1.5">
        <Pill tone="blue">{a.passage_level_reached}</Pill>
        <Pill tone={a.fluency_estimate_pct >= 80 ? 'green' : a.fluency_estimate_pct >= 50 ? 'amber' : 'red'}>
          Fluency {a.fluency_estimate_pct}%
        </Pill>
        <Pill tone="purple">UFLI Unit {a.ufli_placement.current_working_unit}</Pill>
      </div>

      {/* Strengths */}
      {a.strengths?.length > 0 && (
        <Block tone="green" title="What's solid">
          <ul className="space-y-1">
            {a.strengths.map((s, i) => (
              <li key={i} className="text-[13px] text-[var(--v4-ink-2)] flex gap-1.5">
                <span className="text-[var(--v4-green)]">✓</span> {s}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {/* Gaps */}
      {a.priority_gaps?.length > 0 && (
        <Block tone="red" title="Where to focus">
          <ul className="space-y-1.5">
            {a.priority_gaps.map((g, i) => (
              <li key={i} className="text-[13px] text-[var(--v4-ink-2)] flex gap-1.5">
                <span className="bg-white text-[var(--v4-red)] text-[10.5px] font-bold w-4 h-4 rounded flex items-center justify-center shrink-0">{g.rank}</span>
                <span><span className="font-semibold text-[var(--v4-ink)]">{g.gap}</span> — <span className="text-[var(--v4-ink-3)]">{g.why_it_matters}</span></span>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {a.patterns_to_watch?.length > 0 && (
        <Block tone="amber" title="Keep an eye on">
          <ul className="space-y-1">
            {a.patterns_to_watch.map((p, i) => (
              <li key={i} className="text-[13px] text-[var(--v4-ink-2)] flex gap-1.5">
                <span className="text-[var(--v4-amber)]">●</span> {p}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {/* UFLI Placement */}
      <Card>
        <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-3">UFLI Placement</p>
        <div className="grid grid-cols-3 gap-2">
          <UfliCell title="Mastered" unit={a.ufli_placement.last_unit_mastered} name={a.ufli_placement.last_unit_name} />
          <UfliCell title="Working on" unit={a.ufli_placement.current_working_unit} name={a.ufli_placement.current_unit_name} highlight />
          <UfliCell title="Next up" unit={a.ufli_placement.next_unlock_unit} name={a.ufli_placement.next_unlock_name} />
        </div>
      </Card>

      {/* Week arc */}
      {(a.week_arc || a.four_week_arc) && (
        <Card>
          <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-3">
            {(a.week_arc || a.four_week_arc).length}-Week Plan
          </p>
          <ul className="space-y-1.5">
            {(a.week_arc || a.four_week_arc).map((week, i) => (
              <li key={i} className="text-[13px] flex gap-2 items-start">
                <span className="bg-[var(--v4-purple-lt)] text-[var(--v4-purple)] text-[10.5px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0">{week.week}</span>
                <span><span className="font-semibold text-[var(--v4-ink)]">{week.focus}</span> <span className="text-[var(--v4-ink-3)]">— {week.activity_type}</span></span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Detailed breakdown */}
      <details className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)]">
        <summary className="px-4 py-3 text-[11.5px] font-semibold text-[var(--v4-ink-2)] uppercase tracking-[0.6px] cursor-pointer">
          Detailed breakdown
        </summary>
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--v4-border)] pt-3">
          <div>
            <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-1.5">Scarborough's Rope</p>
            <ul className="space-y-1">
              {['phonological_awareness', 'decoding', 'sight_recognition', 'vocabulary', 'verbal_reasoning'].map(key => (
                <li key={key} className="text-[12.5px] flex justify-between">
                  <span className="text-[var(--v4-ink-2)] capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="font-semibold text-[var(--v4-ink)]">{a.scarboroughs_rope[key]}</span>
                </li>
              ))}
              <li className="text-[11.5px] text-[var(--v4-amber)] font-semibold mt-1">Weakest: {a.scarboroughs_rope.weakest_thread}</li>
            </ul>
          </div>
          <div>
            <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-1">Hegarty Phonemic Awareness</p>
            <p className="text-[12.5px] text-[var(--v4-ink-2)]">
              Solid through <span className="font-semibold text-[var(--v4-green)]">{a.hegarty_placement.highest_mastered}</span>, breaking down at <span className="font-semibold text-[var(--v4-amber)]">{a.hegarty_placement.breaking_down_at}</span>
            </p>
            {a.hegarty_placement.notes && <p className="text-[11.5px] text-[var(--v4-ink-3)] mt-0.5">{a.hegarty_placement.notes}</p>}
          </div>
          <div>
            <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-1">Fluency rationale</p>
            <p className="text-[12.5px] text-[var(--v4-ink-2)]">{a.fluency_rationale}</p>
          </div>
        </div>
      </details>

      <p className="text-[10.5px] text-[var(--v4-ink-4)] text-center">Confidence: {a.confidence}</p>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <BtnPrimary onClick={handleSave} className="flex-1 justify-center py-2.5">
          <Save className="w-3.5 h-3.5" /> Save
        </BtnPrimary>
        <BtnSecondary onClick={async () => { await handleSave(); navigate(`/students/${id}`) }} className="flex-1 justify-center py-2.5">
          <ClipboardList className="w-3.5 h-3.5" /> Save & Plan
        </BtnSecondary>
        <BtnSecondary onClick={handleDiscard} className="py-2.5">
          <Undo2 className="w-3.5 h-3.5" /> Redo
        </BtnSecondary>
      </div>
    </div>
  )
}

const TONE = {
  green: 'bg-[var(--v4-green-lt)]',
  red:   'bg-[var(--v4-red-lt)]',
  amber: 'bg-[var(--v4-amber-lt)]',
  blue:  'bg-[var(--v4-blue-lt)]',
  purple:'bg-[var(--v4-purple-lt)]',
}
const TONE_LABEL = {
  green: 'text-[var(--v4-green)]',
  red:   'text-[var(--v4-red)]',
  amber: 'text-[var(--v4-amber)]',
  blue:  'text-[var(--v4-blue)]',
  purple:'text-[var(--v4-purple)]',
}

function Block({ tone, title, children }) {
  return (
    <div className={`rounded-[10px] p-4 ${TONE[tone]}`}>
      <p className={`text-[10.5px] font-semibold uppercase tracking-[0.6px] mb-2 ${TONE_LABEL[tone]}`}>{title}</p>
      {children}
    </div>
  )
}

function Pill({ tone, children }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${TONE[tone]} ${TONE_LABEL[tone]}`}>
      {children}
    </span>
  )
}

function UfliCell({ title, unit, name, highlight }) {
  return (
    <div className={`rounded-md p-2.5 text-center ${highlight ? 'bg-[var(--v4-purple-lt)]' : 'bg-[var(--v4-surface-2)] border border-[var(--v4-border)]'}`}>
      <p className={`text-[10px] uppercase font-semibold tracking-[0.6px] ${highlight ? 'text-[var(--v4-purple)]' : 'text-[var(--v4-ink-3)]'}`}>{title}</p>
      <p className={`text-[18px] font-bold mt-0.5 ${highlight ? 'text-[var(--v4-purple)]' : 'text-[var(--v4-ink)]'}`}>{unit}</p>
      <p className={`text-[10px] mt-0.5 ${highlight ? 'text-[var(--v4-purple)]' : 'text-[var(--v4-ink-3)]'}`}>{name}</p>
    </div>
  )
}
