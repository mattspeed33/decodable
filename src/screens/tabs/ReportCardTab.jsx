import { useState } from 'react'
import { getStudent, getAssessments, getSessions } from '../../lib/storage'
import { runPrompt } from '../../lib/claude'
import { reportPrompt } from '../../prompts/reportPrompt'
import LoadingState from '../../components/LoadingState.jsx'

const SKILL_AREAS = [
  { key: 'alphabet', name: 'Letter Knowledge', icon: '🔤' },
  { key: 'print', name: 'Print Concepts', icon: '📄' },
  { key: 'phonological', name: 'Sound Awareness', icon: '👂' },
  { key: 'decoding', name: 'Reading New Words', icon: '📖' },
  { key: 'automaticity', name: 'Reading Speed', icon: '⚡' },
  { key: 'sight_words', name: 'Sight Words', icon: '👀' },
  { key: 'fluency', name: 'Reading Fluency', icon: '🗣️' },
  { key: 'vocabulary', name: 'Vocabulary', icon: '💬' },
  { key: 'comprehension', name: 'Comprehension', icon: '🧠' },
  { key: 'spelling', name: 'Spelling', icon: '✏️' },
  { key: 'writing', name: 'Writing', icon: '📝' },
]

const STATUS_OPTIONS = ['', 'Mastered', 'Progressing', 'Needs Work', 'Not Assessed']
const STATUS_STYLES = {
  'Mastered': { bg: 'var(--green-light)', border: 'var(--green)', color: 'var(--green)', label: '✓ Mastered' },
  'Progressing': { bg: 'var(--gold-light)', border: 'var(--orange)', color: 'var(--orange)', label: '↗ Progressing' },
  'Needs Work': { bg: 'var(--red-light)', border: 'var(--red)', color: 'var(--red)', label: '● Needs Work' },
  'Not Assessed': { bg: '#f3f4f6', border: '#d1d5db', color: '#9ca3af', label: '— Not Assessed' },
}

function getSettings() {
  return JSON.parse(localStorage.getItem('decodable_settings') || '{}')
}

export default function ReportCardTab({ studentId }) {
  const student = getStudent(studentId)
  const assessments = getAssessments(studentId)
  const sessions = getSessions(studentId)
  const settings = getSettings()

  const firstA = assessments.length > 0 ? assessments[assessments.length - 1]?.ai_analysis : null
  const latestA = assessments.length > 0 ? assessments[0]?.ai_analysis : null

  const [skills, setSkills] = useState(
    SKILL_AREAS.map(s => ({ ...s, baseline: '', current: '', status: '' }))
  )
  const [strengths, setStrengths] = useState(['', '', ''])
  const [workingOn, setWorkingOn] = useState(['', '', ''])
  const [whatNext, setWhatNext] = useState('')
  const [tutorName, setTutorName] = useState(settings.tutor_name || student?.tutor_name || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function updateSkill(index, field, value) {
    setSkills(s => s.map((skill, i) => i === index ? { ...skill, [field]: value } : skill))
  }

  function updateList(setter, index, value) {
    setter(list => list.map((item, i) => i === index ? value : item))
  }

  async function handleAutoPopulate() {
    if (!firstA) { setError('Need at least one assessment.'); return }
    setLoading(true)
    setError(null)
    try {
      const context = `
STUDENT: ${student.name}, ${student.grade} grade, age ${student.age}
SESSIONS: ${sessions.length} completed
DATES: ${student.start_date} to ${new Date().toISOString().split('T')[0]}

FIRST ASSESSMENT:
Fluency: ${firstA.fluency_estimate_pct}%, Passage: ${firstA.passage_level_reached}
UFLI: Unit ${firstA.ufli_placement?.current_working_unit} — ${firstA.ufli_placement?.current_unit_name}
Rope: ${Object.entries(firstA.scarboroughs_rope || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}
Hegarty: mastered ${firstA.hegarty_placement?.highest_mastered}, breaks at ${firstA.hegarty_placement?.breaking_down_at}
Strengths: ${firstA.strengths?.join('; ')}
Gaps: ${firstA.priority_gaps?.map(g => g.gap).join('; ')}

LATEST ASSESSMENT:
Fluency: ${latestA?.fluency_estimate_pct}%, Passage: ${latestA?.passage_level_reached}
UFLI: Unit ${latestA?.ufli_placement?.current_working_unit} — ${latestA?.ufli_placement?.current_unit_name}
Rope: ${Object.entries(latestA?.scarboroughs_rope || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}
Strengths: ${latestA?.strengths?.join('; ')}
Gaps: ${latestA?.priority_gaps?.map(g => g.gap).join('; ')}
Watch: ${latestA?.patterns_to_watch?.join('; ')}
      `.trim()
      const result = await runPrompt({ systemPrompt: reportPrompt, userMessage: context })
      const parsed = JSON.parse(result)
      if (parsed.skills) {
        setSkills(prev => prev.map((skill, i) => ({
          ...skill,
          baseline: parsed.skills[i]?.baseline || '',
          current: parsed.skills[i]?.current || '',
          status: parsed.skills[i]?.status || '',
        })))
      }
      if (parsed.strengths) setStrengths(parsed.strengths)
      if (parsed.working_on) setWorkingOn(parsed.working_on)
      if (parsed.what_next) setWhatNext(parsed.what_next)
    } catch (err) {
      setError(err.message || 'Failed to auto-populate.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingState messages={['📊 Reviewing progress...', '✍️ Writing the report...', '📋 Almost ready...']} />

  const fluencyStart = firstA?.fluency_estimate_pct
  const fluencyCurrent = latestA?.fluency_estimate_pct
  const fluencyDelta = fluencyStart != null && fluencyCurrent != null ? fluencyCurrent - fluencyStart : null
  const ufliStart = firstA?.ufli_placement?.current_working_unit
  const ufliCurrent = latestA?.ufli_placement?.current_working_unit

  const inputClass = 'w-full border-2 border-gray-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white print:border-0 print:p-0 print:bg-transparent'
  const smallInput = 'border-2 border-gray-100 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white print:border-0 print:p-0 print:bg-transparent'

  return (
    <div className="space-y-5">
      {/* Actions */}
      <div className="action-buttons flex justify-end gap-2">
        <button
          onClick={handleAutoPopulate}
          disabled={!firstA}
          className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-[var(--primary-hover)] transition shadow-sm disabled:opacity-40"
        >
          ✨ Auto-populate Report Card
        </button>
        <button onClick={() => window.print()} className="bg-white border-2 border-gray-100 px-5 py-2.5 rounded-full text-xs font-bold text-black hover:border-[var(--primary)] transition">
          🖨️ Print
        </button>
      </div>

      {error && <div className="action-buttons rounded-2xl bg-[var(--red-light)] p-3 text-sm text-[var(--red)] font-bold">{error}</div>}

      {/* ══ PRINTABLE REPORT ══ */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 print:border-0 print:rounded-none print:p-0">

        {/* Header */}
        <div className="border-b-2 border-gray-200 pb-5 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-black print:text-3xl">Student Progress Report</h1>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="font-bold text-black">{student.name}</span>
                <span className="text-gray-500">{student.grade} grade &middot; Age {student.age}</span>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500">
              <input className={`${smallInput} w-40 text-right`} value={tutorName} onChange={e => setTutorName(e.target.value)} placeholder="Tutor name" />
              {settings.business_name && <p className="mt-0.5">{settings.business_name}</p>}
              <p className="mt-0.5">{student.start_date} — {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--primary-light)' }}>
              <p className="text-3xl font-black" style={{ color: 'var(--primary)' }}>{sessions.length}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mt-1">Sessions</p>
            </div>
            <div className="rounded-2xl p-4 text-center" style={{ background: fluencyDelta > 0 ? 'var(--green-light)' : 'var(--gold-light)' }}>
              <p className="text-xl font-black text-black">
                {fluencyStart != null ? `${fluencyStart}%` : '—'}
                <span className="text-gray-400 mx-1 text-sm">→</span>
                {fluencyCurrent != null ? `${fluencyCurrent}%` : '—'}
              </p>
              {fluencyDelta != null && (
                <p className="text-xs font-black mt-0.5" style={{ color: fluencyDelta > 0 ? 'var(--green)' : fluencyDelta < 0 ? 'var(--red)' : 'var(--orange)' }}>
                  {fluencyDelta > 0 ? '+' : ''}{fluencyDelta}%
                </p>
              )}
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mt-1">Fluency</p>
            </div>
            <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--blue-light)' }}>
              <p className="text-xl font-black text-black">
                {ufliStart || '—'}
                <span className="text-gray-400 mx-1 text-sm">→</span>
                {ufliCurrent || '—'}
              </p>
              {ufliStart && ufliCurrent && ufliCurrent > ufliStart && (
                <p className="text-xs font-black mt-0.5" style={{ color: 'var(--green)' }}>+{ufliCurrent - ufliStart} units</p>
              )}
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mt-1">Reading Level</p>
            </div>
          </div>
        </div>

        {/* Skill areas — grouped by status */}
        {(() => {
          const mastered = skills.filter(s => s.status === 'Mastered')
          const progressing = skills.filter(s => s.status === 'Progressing')
          const needsWork = skills.filter(s => s.status === 'Needs Work')
          const notAssessed = skills.filter(s => s.status === 'Not Assessed' || !s.status)

          const groups = [
            { key: 'mastered', label: 'Solid', emoji: '✅', skills: mastered, bg: 'var(--green-light)', color: 'var(--green)', border: 'var(--green)' },
            { key: 'progressing', label: 'Getting There', emoji: '📈', skills: progressing, bg: 'var(--gold-light)', color: 'var(--orange)', border: 'var(--orange)' },
            { key: 'needs_work', label: 'Needs More Practice', emoji: '💪', skills: needsWork, bg: 'var(--red-light)', color: 'var(--red)', border: 'var(--red)' },
          ].filter(g => g.skills.length > 0)

          return (
            <div className="mb-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Skills Overview</p>

              {/* Grouped cards — parent view */}
              <div className="space-y-3 print:space-y-4">
                {groups.map(group => (
                  <div
                    key={group.key}
                    className="rounded-2xl p-5"
                    style={{ background: group.bg, borderLeft: `5px solid ${group.border}` }}
                  >
                    <p className="text-sm font-black mb-3" style={{ color: group.color }}>
                      {group.emoji} {group.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.skills.map((skill, i) => (
                        <span key={i} className="bg-white/70 rounded-full px-3 py-1.5 text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          {skill.icon} {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {notAssessed.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Not yet assessed: {notAssessed.map(s => s.name).join(', ')}
                  </p>
                )}
              </div>

              {/* Tutor checklist — assign statuses (hidden on print) */}
              <details className="mt-4 action-buttons">
                <summary className="text-xs font-bold text-[var(--primary)] cursor-pointer hover:underline">✏️ Edit skill statuses</summary>
                <div className="mt-3 bg-gray-50 rounded-xl p-4 space-y-2">
                  {skills.map((skill, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <span>{skill.icon}</span> {skill.name}
                      </p>
                      <select
                        className="text-[11px] font-bold rounded-full px-3 py-1 border-2 border-gray-100 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        value={skill.status}
                        onChange={e => updateSkill(i, 'status', e.target.value)}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'Not set'}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )
        })()}

        {/* Strengths + Working On */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="rounded-xl p-4" style={{ background: 'var(--green-light)' }}>
            <p className="text-xs font-black mb-2" style={{ color: 'var(--green)' }}>💪 Strengths & Wins</p>
            <div className="space-y-1.5">
              {strengths.map((s, i) => (
                <div key={i} className="flex gap-1.5 items-start">
                  <span style={{ color: 'var(--green)' }} className="text-xs mt-0.5">✓</span>
                  <input
                    className="flex-1 text-xs text-gray-800 bg-transparent border-b border-green-200 py-0.5 focus:outline-none focus:border-[var(--green)] print:border-0"
                    value={s}
                    onChange={e => updateList(setStrengths, i, e.target.value)}
                    placeholder="Add a strength..."
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: 'var(--gold-light)' }}>
            <p className="text-xs font-black mb-2" style={{ color: 'var(--orange)' }}>🎯 What We're Working On</p>
            <div className="space-y-1.5">
              {workingOn.map((s, i) => (
                <div key={i} className="flex gap-1.5 items-start">
                  <span style={{ color: 'var(--orange)' }} className="text-xs mt-0.5">●</span>
                  <input
                    className="flex-1 text-xs text-gray-800 bg-transparent border-b border-orange-200 py-0.5 focus:outline-none focus:border-[var(--orange)] print:border-0"
                    value={s}
                    onChange={e => updateList(setWorkingOn, i, e.target.value)}
                    placeholder="Add a focus area..."
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="mb-4">
          <div className="rounded-xl p-4" style={{ background: 'var(--blue-light)' }}>
            <p className="text-xs font-black mb-2" style={{ color: 'var(--blue)' }}>🚀 What's Next</p>
            <textarea
              className="w-full text-xs text-gray-800 bg-transparent border-b border-blue-200 py-0.5 focus:outline-none focus:border-[var(--blue)] print:border-0 resize-none h-12"
              value={whatNext}
              onChange={e => setWhatNext(e.target.value)}
              placeholder="Recommendations for continued practice..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 pt-3 flex justify-between text-[10px] text-gray-400">
          <span>{tutorName}{settings.business_name ? ` · ${settings.business_name}` : ''}</span>
          <span>Generated by Decodable · {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}
