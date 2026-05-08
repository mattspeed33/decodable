import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getStudent, getAssessments, getSessions } from '../lib/storage'
import { runPrompt } from '../lib/claude'
import { reportPrompt } from '../prompts/reportPrompt'
import LoadingState from '../components/LoadingState.jsx'

const DEFAULT_SKILLS = [
  { name: 'Alphabet Knowledge', baseline: '', current: '', status: '' },
  { name: 'Print Concepts', baseline: '', current: '', status: '' },
  { name: 'Phonological Awareness', baseline: '', current: '', status: '' },
  { name: 'Phonics Decoding', baseline: '', current: '', status: '' },
  { name: 'Phonics Automaticity', baseline: '', current: '', status: '' },
  { name: 'Sight Word Fluency', baseline: '', current: '', status: '' },
  { name: 'Oral Reading Fluency', baseline: '', current: '', status: '' },
  { name: 'Vocabulary', baseline: '', current: '', status: '' },
  { name: 'Reading Comprehension', baseline: '', current: '', status: '' },
  { name: 'Spelling & Encoding', baseline: '', current: '', status: '' },
  { name: 'Writing & Expression', baseline: '', current: '', status: '' },
]

const STATUS_OPTIONS = ['', 'Mastered', 'Progressing', 'Needs Work', 'Not Assessed']
const STATUS_COLORS = {
  'Mastered': { bg: 'bg-[var(--green-light)]', text: 'text-[var(--green)]', dot: 'var(--green)' },
  'Progressing': { bg: 'bg-[var(--gold-light)]', text: 'text-[var(--orange)]', dot: 'var(--orange)' },
  'Needs Work': { bg: 'bg-[var(--red-light)]', text: 'text-[var(--red)]', dot: 'var(--red)' },
  'Not Assessed': { bg: 'bg-gray-50', text: 'text-gray-400', dot: '#d1d5db' },
}

function getSettings() {
  return JSON.parse(localStorage.getItem('decodable_settings') || '{}')
}

export default function ReportCard() {
  const { id } = useParams()
  const student = getStudent(id)
  const assessments = getAssessments(id)
  const sessions = getSessions(id)
  const settings = getSettings()

  const firstAssessment = assessments.length > 0 ? assessments[assessments.length - 1] : null
  const latestAssessment = assessments.length > 0 ? assessments[0] : null
  const firstA = firstAssessment?.ai_analysis
  const latestA = latestAssessment?.ai_analysis

  const [skills, setSkills] = useState(DEFAULT_SKILLS)
  const [strengths, setStrengths] = useState(['', '', ''])
  const [workingOn, setWorkingOn] = useState(['', '', ''])
  const [whatNext, setWhatNext] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Editable header fields
  const [headerFields, setHeaderFields] = useState({
    studentName: student?.name || '',
    grade: student?.grade || '',
    age: student?.age || '',
    tutorName: settings.tutor_name || student?.tutor_name || '',
    businessName: settings.business_name || '',
    startDate: student?.start_date || '',
    endDate: new Date().toISOString().split('T')[0],
    engagement: student?.total_sessions_planned === 999 ? 'Ongoing' : `${student?.total_sessions_planned || 4}-Week`,
    sessionsCompleted: sessions.length,
    fluencyStart: firstA?.fluency_estimate_pct || '',
    fluencyCurrent: latestA?.fluency_estimate_pct || '',
    ufliStart: firstA?.ufli_placement?.current_working_unit || '',
    ufliCurrent: latestA?.ufli_placement?.current_working_unit || '',
  })

  function updateHeader(key, value) {
    setHeaderFields(h => ({ ...h, [key]: value }))
  }

  function updateSkill(index, field, value) {
    setSkills(s => s.map((skill, i) => i === index ? { ...skill, [field]: value } : skill))
  }

  function updateListItem(setter, index, value) {
    setter(list => list.map((item, i) => i === index ? value : item))
  }

  function addListItem(setter) {
    setter(list => [...list, ''])
  }

  function removeListItem(setter, index) {
    setter(list => list.filter((_, i) => i !== index))
  }

  async function handleAutoPopulate() {
    if (!firstAssessment || !latestAssessment) {
      setError('Need at least one assessment to auto-populate.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const context = `
STUDENT: ${student.name}, ${student.grade} grade, age ${student.age}
ENGAGEMENT: ${headerFields.engagement} (${sessions.length} sessions completed)
DATE RANGE: ${headerFields.startDate} to ${headerFields.endDate}

FIRST ASSESSMENT (${firstAssessment.date}):
Passage level: ${firstA.passage_level_reached}
Fluency: ${firstA.fluency_estimate_pct}%
UFLI Unit: ${firstA.ufli_placement?.current_working_unit} — ${firstA.ufli_placement?.current_unit_name}
Scarborough's Rope:
${Object.entries(firstA.scarboroughs_rope || {}).map(([k, v]) => `  ${k}: ${v}`).join('\n')}
Hegarty: mastered ${firstA.hegarty_placement?.highest_mastered}, breaks at ${firstA.hegarty_placement?.breaking_down_at}
Strengths: ${firstA.strengths?.join('; ')}
Gaps: ${firstA.priority_gaps?.map(g => g.gap).join('; ')}

LATEST ASSESSMENT (${latestAssessment.date}):
Passage level: ${latestA.passage_level_reached}
Fluency: ${latestA.fluency_estimate_pct}%
UFLI Unit: ${latestA.ufli_placement?.current_working_unit} — ${latestA.ufli_placement?.current_unit_name}
Scarborough's Rope:
${Object.entries(latestA.scarboroughs_rope || {}).map(([k, v]) => `  ${k}: ${v}`).join('\n')}
Hegarty: mastered ${latestA.hegarty_placement?.highest_mastered}, breaks at ${latestA.hegarty_placement?.breaking_down_at}
Strengths: ${latestA.strengths?.join('; ')}
Gaps: ${latestA.priority_gaps?.map(g => g.gap).join('; ')}
Patterns to watch: ${latestA.patterns_to_watch?.join('; ')}
      `.trim()

      const result = await runPrompt({ systemPrompt: reportPrompt, userMessage: context })
      const parsed = JSON.parse(result)

      if (parsed.skills) setSkills(parsed.skills)
      if (parsed.strengths) setStrengths(parsed.strengths)
      if (parsed.working_on) setWorkingOn(parsed.working_on)
      if (parsed.what_next) setWhatNext(parsed.what_next)
    } catch (err) {
      setError(err.message || 'Auto-populate failed.')
    } finally {
      setLoading(false)
    }
  }

  if (!student) return <p className="text-center text-gray-400 py-20">Student not found.</p>
  if (loading) return <LoadingState messages={['📊 Analyzing progress...', '✍️ Writing parent-friendly summaries...', '📋 Building the report card...']} />

  const inputClass = 'w-full border-2 border-gray-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white'
  const smallInput = 'border-2 border-gray-100 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white'

  return (
    <div className="space-y-5">
      {/* Action bar — hidden on print */}
      <div className="action-buttons flex items-center justify-between">
        <h2 className="text-2xl font-black text-black tracking-tight">📋 Report Card</h2>
        <div className="flex gap-2">
          <button
            onClick={handleAutoPopulate}
            disabled={!firstAssessment}
            className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-[var(--primary-hover)] transition shadow-sm disabled:opacity-40"
          >
            ✨ Auto-populate Report Card
          </button>
          <button onClick={() => window.print()} className="bg-white border-2 border-gray-100 px-5 py-2.5 rounded-full text-xs font-bold text-black hover:border-[var(--primary)] transition">
            🖨️ Print
          </button>
        </div>
      </div>

      {error && <div className="action-buttons rounded-xl bg-[var(--red-light)] p-3 text-sm text-[var(--red)] font-bold">{error}</div>}

      {/* ── PRINTABLE REPORT ── */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 print:border-0 print:rounded-none print:p-0">

        {/* Header */}
        <div className="border-b-2 border-gray-200 pb-5 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-black print:text-3xl">Student Progress Report</h1>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="font-bold text-black">
                  <input className={`${smallInput} w-32 print:border-0 print:p-0`} value={headerFields.studentName} onChange={e => updateHeader('studentName', e.target.value)} />
                </span>
                <span className="text-gray-500">
                  <input className={`${smallInput} w-16 print:border-0 print:p-0`} value={headerFields.grade} onChange={e => updateHeader('grade', e.target.value)} /> grade &middot; Age <input className={`${smallInput} w-10 print:border-0 print:p-0`} value={headerFields.age} onChange={e => updateHeader('age', e.target.value)} />
                </span>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p><input className={`${smallInput} w-40 text-right print:border-0 print:p-0`} value={headerFields.tutorName} onChange={e => updateHeader('tutorName', e.target.value)} /></p>
              <p><input className={`${smallInput} w-40 text-right print:border-0 print:p-0`} value={headerFields.businessName} onChange={e => updateHeader('businessName', e.target.value)} placeholder="Business name (optional)" /></p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center print:bg-gray-100">
              <p className="text-lg font-black text-black">
                <input className={`${smallInput} w-12 text-center text-lg font-black print:border-0 print:p-0`} value={headerFields.sessionsCompleted} onChange={e => updateHeader('sessionsCompleted', e.target.value)} />
              </p>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Sessions</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Engagement</p>
              <input className={`${smallInput} w-full text-center font-bold print:border-0 print:p-0`} value={headerFields.engagement} onChange={e => updateHeader('engagement', e.target.value)} />
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Fluency</p>
              <p className="text-sm">
                <input className={`${smallInput} w-10 text-center print:border-0 print:p-0`} value={headerFields.fluencyStart} onChange={e => updateHeader('fluencyStart', e.target.value)} />
                <span className="text-gray-400 mx-1">→</span>
                <input className={`${smallInput} w-10 text-center font-bold print:border-0 print:p-0`} value={headerFields.fluencyCurrent} onChange={e => updateHeader('fluencyCurrent', e.target.value)} />
                <span className="text-gray-400">%</span>
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">UFLI Unit</p>
              <p className="text-sm">
                <input className={`${smallInput} w-10 text-center print:border-0 print:p-0`} value={headerFields.ufliStart} onChange={e => updateHeader('ufliStart', e.target.value)} />
                <span className="text-gray-400 mx-1">→</span>
                <input className={`${smallInput} w-10 text-center font-bold print:border-0 print:p-0`} value={headerFields.ufliCurrent} onChange={e => updateHeader('ufliCurrent', e.target.value)} />
              </p>
            </div>
          </div>
        </div>

        {/* Skills Table */}
        <div className="mb-6">
          <h3 className="font-black text-black text-sm mb-3">Skill Progress</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                <th className="text-left py-1.5 w-[22%]">Skill Area</th>
                <th className="text-left py-1.5 w-[28%]">Baseline</th>
                <th className="text-left py-1.5 w-[28%]">Current</th>
                <th className="text-left py-1.5 w-[22%]">Status</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill, i) => {
                const sc = STATUS_COLORS[skill.status] || STATUS_COLORS['Not Assessed']
                return (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="py-2 text-xs font-bold text-black">{skill.name}</td>
                    <td className="py-2">
                      <input className={`${smallInput} w-full print:border-0 print:p-0`} value={skill.baseline} onChange={e => updateSkill(i, 'baseline', e.target.value)} placeholder="—" />
                    </td>
                    <td className="py-2">
                      <input className={`${smallInput} w-full print:border-0 print:p-0`} value={skill.current} onChange={e => updateSkill(i, 'current', e.target.value)} placeholder="—" />
                    </td>
                    <td className="py-2">
                      <select
                        className={`${smallInput} print:border-0 print:p-0 print:appearance-none ${sc.text} font-bold`}
                        value={skill.status}
                        onChange={e => updateSkill(i, 'status', e.target.value)}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || '—'}</option>)}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Strengths */}
        <div className="mb-5">
          <h3 className="font-black text-black text-sm mb-2">Strengths & Wins</h3>
          <div className="space-y-1.5">
            {strengths.map((s, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-[var(--green)] mt-1 shrink-0">✓</span>
                <input className={`${inputClass} print:border-0 print:p-0`} value={s} onChange={e => updateListItem(setStrengths, i, e.target.value)} placeholder="Add a strength..." />
                <button onClick={() => removeListItem(setStrengths, i)} className="text-gray-300 hover:text-[var(--red)] text-xs action-buttons shrink-0">✕</button>
              </div>
            ))}
            <button onClick={() => addListItem(setStrengths)} className="text-xs font-bold text-[var(--primary)] hover:underline action-buttons">+ Add</button>
          </div>
        </div>

        {/* Working On */}
        <div className="mb-5">
          <h3 className="font-black text-black text-sm mb-2">What We're Working On</h3>
          <div className="space-y-1.5">
            {workingOn.map((s, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-[var(--orange)] mt-1 shrink-0">●</span>
                <input className={`${inputClass} print:border-0 print:p-0`} value={s} onChange={e => updateListItem(setWorkingOn, i, e.target.value)} placeholder="Add a focus area..." />
                <button onClick={() => removeListItem(setWorkingOn, i)} className="text-gray-300 hover:text-[var(--red)] text-xs action-buttons shrink-0">✕</button>
              </div>
            ))}
            <button onClick={() => addListItem(setWorkingOn)} className="text-xs font-bold text-[var(--primary)] hover:underline action-buttons">+ Add</button>
          </div>
        </div>

        {/* What's Next */}
        <div className="mb-4">
          <h3 className="font-black text-black text-sm mb-2">What's Next</h3>
          <textarea
            className={`${inputClass} h-20 print:border-0 print:p-0`}
            value={whatNext}
            onChange={e => setWhatNext(e.target.value)}
            placeholder="Recommendations for continued practice..."
          />
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 pt-3 flex justify-between text-[10px] text-gray-400">
          <span>{headerFields.tutorName}{headerFields.businessName ? ` · ${headerFields.businessName}` : ''}</span>
          <span>Generated by Decodable · {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}
