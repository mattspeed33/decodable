import { useState, useEffect } from 'react'
import { Info, Pencil } from 'lucide-react'
import { getStudent, saveStudent, getLatestAnalysis, saveAnalysis, getLatestAssessment } from '../../lib/storage'
import { useAsync } from '../../lib/useAsync'
import { runPrompt } from '../../lib/claude'
import LoadingState from '../../components/LoadingState.jsx'
import { BtnPrimary, BtnSecondary, Card } from '../../components/v4/primitives.jsx'

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const ENGAGEMENT_OPTIONS = [
  { value: 4, label: '4 weeks' },
  { value: 8, label: '8 weeks' },
  { value: 12, label: '12 weeks' },
  { value: 999, label: 'Ongoing' },
]

const arcRegeneratePrompt = `You are a literacy instructional coach. Given a student's existing assessment analysis and a new engagement length, regenerate ONLY the week arc plan.

Pace the skill progression across the new number of weeks:
- For 4 weeks: focus tightly on 1-2 priority gaps, reassess in the final week
- For 8 weeks: address 2-3 gaps with deeper reinforcement cycles, reassess at weeks 4 and 8
- For 12 weeks: systematic progression through all gaps, reassess at weeks 4, 8, and 12
The final week should always be a reassessment + review week.
Each week: focus is a short phrase, activity_type lists 2-3 activities.

Respond in valid JSON only. Return an array of week objects:
[{ "week": 1, "focus": "", "ufli_unit": 0, "activity_type": "" }]`

export default function ProfileTab({ studentId, onRefresh, defaultEditing = false }) {
  const { data: student, loading, refresh } = useAsync(() => getStudent(studentId), [studentId])
  const { data: latestAssessment } = useAsync(() => getLatestAssessment(studentId), [studentId])
  const [editing, setEditing] = useState(defaultEditing)
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [regenerating, setRegenerating] = useState(false)

  // Initialize form from loaded student. Re-syncs if student is refreshed.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (student && !form) setForm({ ...student })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student])

  if (loading || !student) return <p className="text-center text-[var(--v4-ink-3)] py-10 text-[13px] font-medium">Loading…</p>

  function update(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaveError(null)
    const oldEngagement = student.total_sessions_planned
    const newEngagement = form.total_sessions_planned
    const engagementChanged = oldEngagement !== newEngagement

    try {
      await saveStudent(form)
    } catch (err) {
      setSaveError(err?.message || 'Could not save changes. Check your connection and try again.')
      return
    }

    if (engagementChanged) {
      const analysisRecord = await getLatestAnalysis(studentId)
      if (analysisRecord?.ai_analysis) {
        const newWeeks = newEngagement === 999 ? 4 : newEngagement
        setRegenerating(true)
        try {
          const a = analysisRecord.ai_analysis
          const context = `
STUDENT: ${form.name}, ${form.grade} grade
NEW ENGAGEMENT LENGTH: ${newWeeks} weeks
CURRENT UFLI UNIT: ${a.ufli_placement?.current_working_unit} — ${a.ufli_placement?.current_unit_name}
PRIORITY GAPS:
${a.priority_gaps?.map(g => `- ${g.gap}: ${g.why_it_matters}`).join('\n')}
PATTERNS TO WATCH:
${a.patterns_to_watch?.map(p => `- ${p}`).join('\n')}
          `.trim()

          const result = await runPrompt({ systemPrompt: arcRegeneratePrompt, userMessage: context })
          const newArc = JSON.parse(result)

          const updatedAnalysis = {
            ...analysisRecord,
            ai_analysis: {
              ...analysisRecord.ai_analysis,
              week_arc: newArc,
              four_week_arc: undefined,
            },
          }
          await saveAnalysis(updatedAnalysis)
        } catch (err) {
          console.error('Failed to regenerate arc:', err)
        } finally {
          setRegenerating(false)
        }
      }
    }

    setEditing(false)
    setSaved(true)
    refresh()
    onRefresh?.()
    setTimeout(() => setSaved(false), 2000)
  }

  const inputClass = 'w-full border border-[var(--v4-border)] rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--v4-ink)] bg-[var(--v4-surface)]'
  const labelClass = 'block text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-1'
  const valueClass = 'text-[13px] font-medium text-[var(--v4-ink)]'

  if (regenerating) {
    return <LoadingState messages={['Updating the week plan…', 'Repacing skill progression…', 'Almost done…']} />
  }

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <BtnSecondary onClick={() => { setForm({ ...student }); setEditing(true) }}>
            <Pencil className="w-3.5 h-3.5" /> Edit
          </BtnSecondary>
        </div>

        <Card>
          <h3 className="text-[15px] font-bold text-[var(--v4-ink)] mb-4">Student</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><p className={labelClass}>Name</p><p className={valueClass}>{student.name}</p></div>
            <div><p className={labelClass}>Grade</p><p className={valueClass}>{student.grade}</p></div>
            <div><p className={labelClass}>Age</p><p className={valueClass}>{student.age}</p></div>
            <div><p className={labelClass}>Status</p><p className={valueClass}>{(student.status ?? 'active') === 'inactive' ? 'Inactive' : 'Active'}</p></div>
            <div><p className={labelClass}>Session Type</p><p className={valueClass}>{student.session_type}</p></div>
            <div><p className={labelClass}>Session Length</p><p className={valueClass}>{student.session_length_minutes} min</p></div>
            <div><p className={labelClass}>Tutor</p><p className={valueClass}>{student.tutor_name}</p></div>
          </div>
        </Card>

        <Card>
          <h3 className="text-[15px] font-bold text-[var(--v4-ink)] mb-4">Schedule</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><p className={labelClass}>Session Day</p><p className={valueClass}>{student.session_day || '—'}</p></div>
            <div><p className={labelClass}>Session Time</p><p className={valueClass}>{student.session_time || '—'}</p></div>
            <div><p className={labelClass}>Engagement Length</p><p className={valueClass}>{student.total_sessions_planned === 999 ? 'Ongoing' : `${student.total_sessions_planned} weeks`}</p></div>
            <div><p className={labelClass}>Start Date</p><p className={valueClass}>{student.start_date}</p></div>
          </div>
        </Card>

        <Card>
          <h3 className="text-[15px] font-bold text-[var(--v4-ink)] mb-4">Parent</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><p className={labelClass}>Parent Name</p><p className={valueClass}>{student.parent_name || '—'}</p></div>
            <div><p className={labelClass}>Parent Email</p><p className={valueClass}>{student.parent_email || '—'}</p></div>
          </div>
        </Card>

        <Card>
          <h3 className="text-[15px] font-bold text-[var(--v4-ink)] mb-3">Intake Notes</h3>
          <p className="text-[13px] text-[var(--v4-ink-2)] leading-relaxed">
            {student.notes_from_parent || 'No intake notes recorded.'}
          </p>
        </Card>

        {student.curriculum_flags && (
          <Card>
            <h3 className="text-[15px] font-bold text-[var(--v4-ink)] mb-3">Curriculum Frameworks</h3>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(student.curriculum_flags).filter(([, v]) => v).map(([key]) => (
                <span key={key} className="text-[10.5px] bg-[var(--v4-purple-lt)] text-[var(--v4-purple)] px-1.5 py-0.5 rounded font-semibold capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </Card>
        )}

        {saved && (
          <div className="rounded-md bg-[var(--v4-green-lt)] text-[var(--v4-green)] px-3 py-2 text-[12.5px] font-medium text-center">Changes saved.</div>
        )}
      </div>
    )
  }

  if (!form) return null

  const engagementWillChange = form.total_sessions_planned !== student.total_sessions_planned
  const hasAssessment = !!latestAssessment

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-[var(--v4-ink)]">Edit Student</h3>
          <button
            onClick={() => { setForm({ ...student }); setEditing(false); setSaveError(null) }}
            className="text-[12px] font-medium text-[var(--v4-ink-3)] hover:text-[var(--v4-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--v4-ink)] focus-visible:outline-offset-2 rounded-sm px-1"
          >
            Cancel
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Name</label>
            <input className={inputClass} value={form.name} onChange={e => update('name', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Grade</label>
            <select className={inputClass} value={form.grade} onChange={e => update('grade', e.target.value)}>
              <option value="K">K</option><option value="1st">1st</option><option value="2nd">2nd</option><option value="3rd">3rd</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Age</label>
            <input className={inputClass} type="number" value={form.age} onChange={e => update('age', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass} value={form.status ?? 'active'} onChange={e => update('status', e.target.value)}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Session Type</label>
            <select className={inputClass} value={form.session_type} onChange={e => update('session_type', e.target.value)}>
              <option value="1:1">1:1</option><option value="Pod">Pod</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Session Length</label>
            <select className={inputClass} value={form.session_length_minutes} onChange={e => update('session_length_minutes', Number(e.target.value))}>
              {[30, 45, 50, 60, 65, 90].map(m => <option key={m} value={m}>{m} min</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Tutor Name</label>
            <input className={inputClass} value={form.tutor_name} onChange={e => update('tutor_name', e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="text-[15px] font-bold text-[var(--v4-ink)]">Schedule</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Session Day</label>
            <select className={inputClass} value={form.session_day || ''} onChange={e => update('session_day', e.target.value)}>
              <option value="">Select day…</option>
              {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Session Time</label>
            <input className={inputClass} type="time" value={form.session_time || ''} onChange={e => update('session_time', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Engagement Length</label>
            <select className={inputClass} value={form.total_sessions_planned} onChange={e => update('total_sessions_planned', Number(e.target.value))}>
              {ENGAGEMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Start Date</label>
            <input className={inputClass} type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)} />
          </div>
        </div>

        {engagementWillChange && hasAssessment && (
          <div className="flex items-start gap-2.5 text-[12px] text-[var(--v4-ink-2)]">
            <Info className="w-4 h-4 text-[var(--v4-blue)] mt-0.5 shrink-0" />
            <p>
              Changing engagement length will regenerate the week plan from the latest assessment. This takes a few seconds.
            </p>
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <h3 className="text-[15px] font-bold text-[var(--v4-ink)]">Parent</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Parent Name</label>
            <input className={inputClass} value={form.parent_name} onChange={e => update('parent_name', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Parent Email</label>
            <input className={inputClass} type="email" value={form.parent_email} onChange={e => update('parent_email', e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="text-[15px] font-bold text-[var(--v4-ink)]">Intake Notes</h3>
        <textarea className={inputClass + ' h-28 resize-none'} value={form.notes_from_parent} onChange={e => update('notes_from_parent', e.target.value)} />
      </Card>

      {saveError && (
        <div className="rounded-md bg-[var(--v4-red-lt)] px-3 py-2 text-[12.5px] text-[var(--v4-red)] font-medium">{saveError}</div>
      )}

      <BtnPrimary onClick={handleSave} className="w-full justify-center py-2.5">
        {engagementWillChange && hasAssessment ? 'Save and Update Week Plan' : 'Save Changes'}
      </BtnPrimary>
    </div>
  )
}
