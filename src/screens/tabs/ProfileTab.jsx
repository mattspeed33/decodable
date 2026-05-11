import { useState } from 'react'
import { getStudent, saveStudent, getLatestAnalysis, saveAnalysis, getLatestAssessment } from '../../lib/storage'
import { runPrompt } from '../../lib/claude'
import LoadingState from '../../components/LoadingState.jsx'

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

export default function ProfileTab({ studentId, onRefresh }) {
  const student = getStudent(studentId)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...student })
  const [saved, setSaved] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  if (!student) return null

  function update(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    const oldEngagement = student.total_sessions_planned
    const newEngagement = form.total_sessions_planned
    const engagementChanged = oldEngagement !== newEngagement

    saveStudent(form)

    // If engagement length changed and we have an assessment, regenerate the arc
    if (engagementChanged) {
      const analysisRecord = getLatestAnalysis(studentId)
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

          // Update the analysis with new arc
          const updatedAnalysis = {
            ...analysisRecord,
            ai_analysis: {
              ...analysisRecord.ai_analysis,
              week_arc: newArc,
              four_week_arc: undefined
            }
          }
          saveAnalysis(updatedAnalysis)
        } catch (err) {
          console.error('Failed to regenerate arc:', err)
        } finally {
          setRegenerating(false)
        }
      }
    }

    setEditing(false)
    setSaved(true)
    onRefresh?.()
    setTimeout(() => setSaved(false), 2000)
  }

  const inputClass = 'w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white'
  const labelClass = 'block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1'
  const valueClass = 'text-sm font-semibold text-black'

  if (regenerating) {
    return <LoadingState messages={['🗓️ Updating the week plan...', '📊 Repacing skill progression...', '✅ Almost done...']} />
  }

  if (!editing) {
    return (
      <div className="space-y-4">
        {/* Student Info */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-black">👤 Student Info</h3>
            <button onClick={() => setEditing(true)} className="text-xs font-bold text-[var(--primary)] hover:underline">Edit</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><p className={labelClass}>Name</p><p className={valueClass}>{student.name}</p></div>
            <div><p className={labelClass}>Grade</p><p className={valueClass}>{student.grade}</p></div>
            <div><p className={labelClass}>Age</p><p className={valueClass}>{student.age}</p></div>
            <div><p className={labelClass}>Session Type</p><p className={valueClass}>{student.session_type}</p></div>
            <div><p className={labelClass}>Session Length</p><p className={valueClass}>{student.session_length_minutes} min</p></div>
            <div><p className={labelClass}>Tutor</p><p className={valueClass}>{student.tutor_name}</p></div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
          <h3 className="font-black text-black mb-4">🗓️ Schedule</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={labelClass}>Session Day</p>
              <p className={valueClass}>{student.session_day || '—'}</p>
            </div>
            <div>
              <p className={labelClass}>Session Time</p>
              <p className={valueClass}>{student.session_time || '—'}</p>
            </div>
            <div>
              <p className={labelClass}>Engagement Length</p>
              <p className={valueClass}>
                {student.total_sessions_planned === 999 ? 'Ongoing' : `${student.total_sessions_planned} weeks`}
              </p>
            </div>
            <div>
              <p className={labelClass}>Start Date</p>
              <p className={valueClass}>{student.start_date}</p>
            </div>
          </div>
        </div>

        {/* Parent Info */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
          <h3 className="font-black text-black mb-4">👨‍👧 Parent Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><p className={labelClass}>Parent Name</p><p className={valueClass}>{student.parent_name || '—'}</p></div>
            <div><p className={labelClass}>Parent Email</p><p className={valueClass}>{student.parent_email || '—'}</p></div>
          </div>
        </div>

        {/* Intake Notes */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
          <h3 className="font-black text-black mb-3">📝 Intake Notes</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {student.notes_from_parent || 'No intake notes recorded.'}
          </p>
        </div>

        {/* Curriculum Flags */}
        {student.curriculum_flags && (
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
            <h3 className="font-black text-black mb-3">📚 Curriculum Frameworks</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(student.curriculum_flags).filter(([, v]) => v).map(([key]) => (
                <span key={key} className="text-xs bg-[var(--primary-light)] text-[var(--primary)] px-3 py-1 rounded-full font-bold capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {saved && (
          <div className="bg-[var(--green-light)] text-[var(--green)] rounded-xl p-3 text-sm font-bold text-center">✓ Changes saved</div>
        )}
      </div>
    )
  }

  // Edit mode
  const engagementWillChange = form.total_sessions_planned !== student.total_sessions_planned
  const hasAssessment = !!getLatestAssessment(studentId)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-black">👤 Edit Student</h3>
          <button onClick={() => { setForm({ ...student }); setEditing(false) }} className="text-xs font-bold text-gray-400 hover:text-black">Cancel</button>
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
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 space-y-4">
        <h3 className="font-black text-black">🗓️ Schedule</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Session Day</label>
            <select className={inputClass} value={form.session_day || ''} onChange={e => update('session_day', e.target.value)}>
              <option value="">Select day...</option>
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

        {/* Warning if engagement length is changing */}
        {engagementWillChange && hasAssessment && (
          <div className="bg-[var(--blue-light)] rounded-xl p-3 flex items-start gap-2">
            <span>💡</span>
            <p className="text-xs text-[var(--blue)] font-bold">
              Changing engagement length will regenerate the week plan from your latest assessment. This takes a few seconds.
            </p>
          </div>
        )}
      </div>

      {/* Parent Info */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 space-y-4">
        <h3 className="font-black text-black">👨‍👧 Parent Info</h3>
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
      </div>

      {/* Intake Notes */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 space-y-4">
        <h3 className="font-black text-black">📝 Intake Notes</h3>
        <textarea className={inputClass + ' h-28'} value={form.notes_from_parent} onChange={e => update('notes_from_parent', e.target.value)} />
      </div>

      <button onClick={handleSave} className="w-full bg-[var(--primary)] text-white py-3.5 rounded-full font-bold hover:bg-[var(--primary-hover)] transition shadow-sm">
        {engagementWillChange && hasAssessment ? '✓ Save & Update Week Plan' : '✓ Save Changes'}
      </button>
    </div>
  )
}
