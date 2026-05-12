import { useState } from 'react'
import { Plus, FileText, Pencil, Trash2 } from 'lucide-react'
import { getStudent, getAnalyses, getSessions, getReportCards, saveReportCard, deleteReportCard } from '../../lib/storage'
import { useAsync } from '../../lib/useAsync'
import { BtnPrimary } from '../../components/v4/primitives.jsx'
import { runPrompt } from '../../lib/claude'
import { reportPrompt } from '../../prompts/reportPrompt'
import { GRADE_LEVELS, GRADE_LEVEL_MAP, getStatus, getLevelPercent, SKILL_BENCHMARKS } from '../../lib/gradeLevels'
import LoadingState from '../../components/LoadingState.jsx'

const SKILL_CONFIG = [
  { key: 'phonological_awareness', label: 'Phonological Awareness', icon: '👂', benchKey: 'phonological-awareness' },
  { key: 'alphabet_knowledge', label: 'Alphabet Knowledge', icon: '🔤', benchKey: 'alphabet-knowledge' },
  { key: 'phonics_decoding', label: 'Phonics & Decoding', icon: '📖', benchKey: 'phonics-decoding' },
  { key: 'phonics_automaticity', label: 'Phonics Automaticity', icon: '⚡', benchKey: 'phonics-automaticity' },
  { key: 'sight_words', label: 'Sight Words', icon: '👀', benchKey: 'sight-words' },
  { key: 'oral_reading_fluency', label: 'Oral Reading Fluency', icon: '🗣️', benchKey: 'oral-reading-fluency' },
  { key: 'spelling_encoding', label: 'Spelling & Encoding', icon: '✏️', benchKey: 'spelling-encoding' },
  { key: 'vocabulary', label: 'Vocabulary', icon: '💬', benchKey: 'vocabulary' },
  { key: 'reading_comprehension', label: 'Comprehension', icon: '🧠', benchKey: 'reading-comprehension' },
  { key: 'print_concepts', label: 'Print Concepts', icon: '📄', benchKey: 'print-concepts' },
  { key: 'writing_expression', label: 'Writing', icon: '📝', benchKey: 'writing-expression' },
]

const LEVEL_OPTIONS = [
  { value: '', label: 'Not set' },
  ...GRADE_LEVELS.map(g => ({ value: g.key, label: g.label })),
  { value: 'not-assessed', label: 'Not Assessed' },
]

function getSettings() {
  return JSON.parse(localStorage.getItem('decodable_settings') || '{}')
}

function emptySkillLevels() {
  return Object.fromEntries(SKILL_CONFIG.map(s => [s.key, '']))
}

function SkillBar({ skill, level, studentGrade, onChangeLevel, readOnly }) {
  const status = getStatus(level, studentGrade)
  const pct = level && level !== 'not-assessed' ? getLevelPercent(level) : 0
  const levelInfo = GRADE_LEVEL_MAP[level]
  const benchmark = SKILL_BENCHMARKS[skill.benchKey]?.[level]

  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{skill.icon}</span>
          <p className="text-sm font-black text-black">{skill.label}</p>
        </div>
        <div className="flex items-center gap-2">
          {level && level !== 'not-assessed' && levelInfo && (
            <span className="text-xs font-bold text-black">{levelInfo.label}</span>
          )}
          {status.emoji && <span className="text-sm">{status.emoji}</span>}
          <span className="text-[10px] font-bold" style={{ color: status.color }}>{status.label}</span>
        </div>
      </div>

      <div className="relative">
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          {pct > 0 && (
            <div
              className="h-3 rounded-full transition-all"
              style={{ width: `${pct}%`, background: status.color }}
            />
          )}
        </div>
        <div className="flex justify-between mt-1">
          {['PK', 'K', '1st', '2nd', '3rd'].map((label, i) => (
            <span key={i} className="text-[8px] text-gray-400 font-bold">{label}</span>
          ))}
        </div>
      </div>

      {benchmark && (
        <p className="text-[10px] text-gray-400 mt-1">{benchmark}</p>
      )}

      {!readOnly && (
        <select
          className="action-buttons mt-1 text-[10px] text-gray-400 bg-transparent border-0 p-0 focus:outline-none cursor-pointer hover:text-[var(--primary)]"
          value={level || ''}
          onChange={e => onChangeLevel(e.target.value)}
        >
          {LEVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </div>
  )
}

function ReportCardEditor({ studentId, existingReport, onSave, onCancel }) {
  const { data: student, loading: studentLoading } = useAsync(() => getStudent(studentId), [studentId])
  const { data: sessions = [] } = useAsync(() => getSessions(studentId), [studentId])
  const { data: analyses = [] } = useAsync(() => getAnalyses(studentId), [studentId])
  const settings = getSettings()

  const firstA = analyses.length > 0 ? analyses[analyses.length - 1]?.ai_analysis : null
  const latestA = analyses.length > 0 ? analyses[0]?.ai_analysis : null

  const [name, setName] = useState(existingReport?.name || `Report Card — ${new Date().toLocaleDateString()}`)
  const [skillLevels, setSkillLevels] = useState(existingReport?.skillLevels || emptySkillLevels())
  const [strengths, setStrengths] = useState(existingReport?.strengths || ['', '', ''])
  const [workingOn, setWorkingOn] = useState(existingReport?.workingOn || ['', '', ''])
  const [parentSummary, setParentSummary] = useState(existingReport?.parentSummary || '')
  const [tutorName, setTutorName] = useState(existingReport?.tutorName || settings.tutor_name || student?.tutor_name || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function updateLevel(key, value) {
    setSkillLevels(prev => ({ ...prev, [key]: value }))
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

BASELINE ASSESSMENT:
Fluency: ${firstA.fluency_estimate_pct}%, Passage: ${firstA.passage_level_reached}
UFLI: Unit ${firstA.ufli_placement?.current_working_unit} — ${firstA.ufli_placement?.current_unit_name}
Scarborough's Rope: ${Object.entries(firstA.scarboroughs_rope || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}
Hegarty: mastered ${firstA.hegarty_placement?.highest_mastered}, breaks at ${firstA.hegarty_placement?.breaking_down_at}
Strengths: ${firstA.strengths?.join('; ')}
Gaps: ${firstA.priority_gaps?.map(g => `${g.gap} (${g.why_it_matters})`).join('; ')}

LATEST ASSESSMENT:
Fluency: ${latestA?.fluency_estimate_pct}%, Passage: ${latestA?.passage_level_reached}
UFLI: Unit ${latestA?.ufli_placement?.current_working_unit} — ${latestA?.ufli_placement?.current_unit_name}
Scarborough's Rope: ${Object.entries(latestA?.scarboroughs_rope || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}
Hegarty: mastered ${latestA?.hegarty_placement?.highest_mastered}, breaks at ${latestA?.hegarty_placement?.breaking_down_at}
Strengths: ${latestA?.strengths?.join('; ')}
Gaps: ${latestA?.priority_gaps?.map(g => g.gap).join('; ')}
Patterns: ${latestA?.patterns_to_watch?.join('; ')}
      `.trim()
      const result = await runPrompt({ systemPrompt: reportPrompt, userMessage: context })
      const parsed = JSON.parse(result)
      if (parsed.skills) {
        setSkillLevels(prev => {
          const merged = { ...prev }
          for (const [key, val] of Object.entries(parsed.skills)) {
            if (!merged[key]) merged[key] = val
          }
          return merged
        })
      }
      if (parsed.strengths) {
        setStrengths(prev => prev.map((existing, i) => existing || parsed.strengths[i] || ''))
      }
      if (parsed.working_on) {
        setWorkingOn(prev => prev.map((existing, i) => existing || parsed.working_on[i] || ''))
      }
      if (parsed.parent_summary) {
        setParentSummary(prev => prev || parsed.parent_summary)
      }
    } catch (err) {
      setError(err.message || 'Failed to auto-populate.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    const report = {
      id: existingReport?.id || crypto.randomUUID(),
      student_id: studentId,
      name,
      date: existingReport?.date || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      skillLevels,
      strengths,
      workingOn,
      parentSummary,
      tutorName,
    }
    await saveReportCard(report)
    onSave()
  }

  if (studentLoading || !student) return <LoadingState messages={['Loading…']} />
  if (loading) return <LoadingState messages={['📊 Mapping skills to grade levels...', '✍️ Writing the parent summary...', '📋 Building the report...']} />

  const statusCounts = { ahead: 0, 'on-track': 0, behind: 0, unknown: 0 }
  SKILL_CONFIG.forEach(skill => {
    const level = skillLevels[skill.key]
    if (!level || level === 'not-assessed') { statusCounts.unknown++; return }
    const s = getStatus(level, student.grade)
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1
  })

  const hasData = Object.values(skillLevels).some(v => v && v !== 'not-assessed')

  return (
    <div className="space-y-5">
      {/* Actions */}
      <div className="action-buttons flex items-center justify-between">
        <button onClick={onCancel} className="text-xs font-bold text-gray-400 hover:text-black transition">
          ← Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleAutoPopulate}
            disabled={!firstA}
            className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-[var(--primary-hover)] transition shadow-sm disabled:opacity-40"
          >
            ✨ Auto-populate
          </button>
          <button onClick={handleSave} className="bg-black text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-gray-800 transition shadow-sm">
            💾 Save
          </button>
          <button onClick={() => window.print()} className="bg-white border-2 border-gray-100 px-5 py-2.5 rounded-full text-xs font-bold text-black hover:border-[var(--primary)] transition">
            🖨️ Print
          </button>
        </div>
      </div>

      {error && <div className="action-buttons rounded-2xl bg-[var(--red-light)] p-3 text-sm text-[var(--red)] font-bold">{error}</div>}

      {/* Report name */}
      <input
        className="action-buttons w-full text-lg font-black text-black bg-transparent border-b-2 border-dashed border-gray-200 py-2 focus:outline-none focus:border-[var(--primary)] print:border-0"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Report card name..."
      />

      {/* ══ REPORT CARD ══ */}
      <div className="bg-white rounded-3xl shadow-sm print:shadow-none print:rounded-none overflow-hidden">

        {/* Header */}
        <div className="p-8 pb-6 border-b border-gray-100 print:p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Progress Report</p>
              <h1 className="text-3xl font-black text-black tracking-tight mt-1">{student.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{student.grade} Grade &middot; Age {student.age} &middot; {sessions.length} sessions</p>
            </div>
            <div className="text-right">
              <input className="text-sm font-bold text-black text-right bg-transparent border-b border-dashed border-gray-200 focus:outline-none focus:border-[var(--primary)] print:border-0 w-40" value={tutorName} onChange={e => setTutorName(e.target.value)} placeholder="Tutor name" />
              {settings.business_name && <p className="text-[10px] text-gray-400 mt-0.5">{settings.business_name}</p>}
              <p className="text-[10px] text-gray-400 mt-0.5">{student.start_date} — {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {hasData && (
            <div className="flex gap-3 mt-5">
              {statusCounts.ahead > 0 && (
                <div className="flex items-center gap-1.5 bg-[var(--green-light)] rounded-full px-3 py-1.5">
                  <span>🟢</span>
                  <span className="text-xs font-black" style={{ color: 'var(--green)' }}>{statusCounts.ahead} Ahead</span>
                </div>
              )}
              {statusCounts['on-track'] > 0 && (
                <div className="flex items-center gap-1.5 bg-[var(--gold-light)] rounded-full px-3 py-1.5">
                  <span>🟡</span>
                  <span className="text-xs font-black" style={{ color: 'var(--orange)' }}>{statusCounts['on-track']} On Track</span>
                </div>
              )}
              {statusCounts.behind > 0 && (
                <div className="flex items-center gap-1.5 bg-[var(--red-light)] rounded-full px-3 py-1.5">
                  <span>🔴</span>
                  <span className="text-xs font-black" style={{ color: 'var(--red)' }}>{statusCounts.behind} Behind</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Skill bars */}
        <div className="px-8 py-4 print:px-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Skills by Grade Level</p>
          {SKILL_CONFIG.map(skill => (
            <SkillBar
              key={skill.key}
              skill={skill}
              level={skillLevels[skill.key]}
              studentGrade={student.grade}
              onChangeLevel={v => updateLevel(skill.key, v)}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="px-8 pb-4 print:px-6">
          <div className="flex gap-5 text-[10px] text-gray-400 font-bold">
            <span className="flex items-center gap-1">🟢 Ahead — above grade level</span>
            <span className="flex items-center gap-1">🟡 On Track — at or near grade level</span>
            <span className="flex items-center gap-1">🔴 Behind — more than one level below</span>
          </div>
        </div>

        {/* Strengths + Working On */}
        <div className="px-8 py-5 border-t border-gray-100 print:px-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl p-4" style={{ background: 'var(--green-light)' }}>
              <p className="text-xs font-black mb-2" style={{ color: 'var(--green)' }}>💪 Strengths & Wins</p>
              <div className="space-y-1.5">
                {strengths.map((s, i) => (
                  <div key={i} className="flex gap-1.5 items-start">
                    <span style={{ color: 'var(--green)' }} className="text-xs mt-1 shrink-0">✓</span>
                    <textarea
                      ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }}
                      className="flex-1 text-xs text-gray-800 bg-transparent border-b border-green-200 py-0.5 focus:outline-none focus:border-[var(--green)] print:border-0 resize-none overflow-hidden"
                      rows={1}
                      value={s}
                      onChange={e => { updateList(setStrengths, i, e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                      placeholder="Add a strength..."
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ background: 'var(--gold-light)' }}>
              <p className="text-xs font-black mb-2" style={{ color: 'var(--orange)' }}>🎯 What We're Working On</p>
              <div className="space-y-1.5">
                {workingOn.map((s, i) => (
                  <div key={i} className="flex gap-1.5 items-start">
                    <span style={{ color: 'var(--orange)' }} className="text-xs mt-1 shrink-0">●</span>
                    <textarea
                      ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }}
                      className="flex-1 text-xs text-gray-800 bg-transparent border-b border-orange-200 py-0.5 focus:outline-none focus:border-[var(--orange)] print:border-0 resize-none overflow-hidden"
                      rows={1}
                      value={s}
                      onChange={e => { updateList(setWorkingOn, i, e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                      placeholder="Add a focus area..."
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Parent summary */}
        <div className="px-8 py-5 border-t border-gray-100 print:px-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Summary</p>
          <textarea
            className="w-full text-sm text-gray-700 leading-relaxed bg-transparent border-b border-dashed border-gray-200 focus:outline-none focus:border-[var(--primary)] print:border-0 resize-none h-20"
            value={parentSummary}
            onChange={e => setParentSummary(e.target.value)}
            placeholder="Auto-populated summary will appear here, or write your own..."
          />
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-100 flex justify-between text-[9px] text-gray-400 print:px-6">
          <span>{tutorName}{settings.business_name ? ` · ${settings.business_name}` : ''}</span>
          <span>Decodable · {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}

function ReportCardView({ report, studentId, onEdit, onBack }) {
  const { data: student } = useAsync(() => getStudent(studentId), [studentId])
  const { data: sessions = [] } = useAsync(() => getSessions(studentId), [studentId])
  const settings = getSettings()
  if (!student) return null

  const statusCounts = { ahead: 0, 'on-track': 0, behind: 0, unknown: 0 }
  SKILL_CONFIG.forEach(skill => {
    const level = report.skillLevels[skill.key]
    if (!level || level === 'not-assessed') { statusCounts.unknown++; return }
    const s = getStatus(level, student.grade)
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1
  })
  const hasData = Object.values(report.skillLevels).some(v => v && v !== 'not-assessed')

  return (
    <div className="space-y-5">
      <div className="action-buttons flex items-center justify-between">
        <button onClick={onBack} className="text-xs font-bold text-gray-400 hover:text-black transition">
          ← Back
        </button>
        <div className="flex gap-2">
          <button onClick={onEdit} className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-[var(--primary-hover)] transition shadow-sm">
            ✏️ Edit
          </button>
          <button onClick={() => window.print()} className="bg-white border-2 border-gray-100 px-5 py-2.5 rounded-full text-xs font-bold text-black hover:border-[var(--primary)] transition">
            🖨️ Print
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm print:shadow-none print:rounded-none overflow-hidden">
        <div className="p-8 pb-6 border-b border-gray-100 print:p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Progress Report</p>
              <h1 className="text-3xl font-black text-black tracking-tight mt-1">{student.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{student.grade} Grade &middot; Age {student.age} &middot; {sessions.length} sessions</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-black">{report.tutorName}</p>
              {settings.business_name && <p className="text-[10px] text-gray-400 mt-0.5">{settings.business_name}</p>}
              <p className="text-[10px] text-gray-400 mt-0.5">{student.start_date} — {new Date(report.date).toLocaleDateString()}</p>
            </div>
          </div>

          {hasData && (
            <div className="flex gap-3 mt-5">
              {statusCounts.ahead > 0 && (
                <div className="flex items-center gap-1.5 bg-[var(--green-light)] rounded-full px-3 py-1.5">
                  <span>🟢</span>
                  <span className="text-xs font-black" style={{ color: 'var(--green)' }}>{statusCounts.ahead} Ahead</span>
                </div>
              )}
              {statusCounts['on-track'] > 0 && (
                <div className="flex items-center gap-1.5 bg-[var(--gold-light)] rounded-full px-3 py-1.5">
                  <span>🟡</span>
                  <span className="text-xs font-black" style={{ color: 'var(--orange)' }}>{statusCounts['on-track']} On Track</span>
                </div>
              )}
              {statusCounts.behind > 0 && (
                <div className="flex items-center gap-1.5 bg-[var(--red-light)] rounded-full px-3 py-1.5">
                  <span>🔴</span>
                  <span className="text-xs font-black" style={{ color: 'var(--red)' }}>{statusCounts.behind} Behind</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-8 py-4 print:px-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Skills by Grade Level</p>
          {SKILL_CONFIG.map(skill => (
            <SkillBar
              key={skill.key}
              skill={skill}
              level={report.skillLevels[skill.key]}
              studentGrade={student.grade}
              readOnly
            />
          ))}
        </div>

        <div className="px-8 pb-4 print:px-6">
          <div className="flex gap-5 text-[10px] text-gray-400 font-bold">
            <span className="flex items-center gap-1">🟢 Ahead — above grade level</span>
            <span className="flex items-center gap-1">🟡 On Track — at or near grade level</span>
            <span className="flex items-center gap-1">🔴 Behind — more than one level below</span>
          </div>
        </div>

        {/* Strengths + Working On */}
        {(report.strengths?.some(s => s) || report.workingOn?.some(s => s)) && (
          <div className="px-8 py-5 border-t border-gray-100 print:px-6">
            <div className="grid grid-cols-2 gap-4">
              {report.strengths?.some(s => s) && (
                <div className="rounded-2xl p-4" style={{ background: 'var(--green-light)' }}>
                  <p className="text-xs font-black mb-2" style={{ color: 'var(--green)' }}>💪 Strengths & Wins</p>
                  <ul className="space-y-1">
                    {report.strengths.filter(s => s).map((s, i) => (
                      <li key={i} className="text-xs text-gray-800 flex gap-1.5 items-start">
                        <span style={{ color: 'var(--green)' }} className="mt-0.5 shrink-0">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {report.workingOn?.some(s => s) && (
                <div className="rounded-2xl p-4" style={{ background: 'var(--gold-light)' }}>
                  <p className="text-xs font-black mb-2" style={{ color: 'var(--orange)' }}>🎯 What We're Working On</p>
                  <ul className="space-y-1">
                    {report.workingOn.filter(s => s).map((s, i) => (
                      <li key={i} className="text-xs text-gray-800 flex gap-1.5 items-start">
                        <span style={{ color: 'var(--orange)' }} className="mt-0.5 shrink-0">●</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {report.parentSummary && (
          <div className="px-8 py-5 border-t border-gray-100 print:px-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Summary</p>
            <p className="text-sm text-gray-700 leading-relaxed">{report.parentSummary}</p>
          </div>
        )}

        <div className="px-8 py-4 border-t border-gray-100 flex justify-between text-[9px] text-gray-400 print:px-6">
          <span>{report.tutorName}{settings.business_name ? ` · ${settings.business_name}` : ''}</span>
          <span>Decodable · {new Date(report.date).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}

export default function ReportCardTab({ studentId }) {
  const [view, setView] = useState('list')
  const [selectedReport, setSelectedReport] = useState(null)
  const { data: reports = [], refresh: refreshReports } = useAsync(() => getReportCards(studentId), [studentId])
  const { data: student } = useAsync(() => getStudent(studentId), [studentId])

  if (view === 'new') {
    return (
      <ReportCardEditor
        studentId={studentId}
        onSave={() => { setView('list'); refreshReports() }}
        onCancel={() => setView('list')}
      />
    )
  }

  if (view === 'edit' && selectedReport) {
    return (
      <ReportCardEditor
        studentId={studentId}
        existingReport={selectedReport}
        onSave={() => { setSelectedReport(null); setView('list'); refreshReports() }}
        onCancel={() => { setSelectedReport(null); setView('list') }}
      />
    )
  }

  if (view === 'view' && selectedReport) {
    return (
      <ReportCardView
        report={selectedReport}
        studentId={studentId}
        onEdit={() => setView('edit')}
        onBack={() => { setSelectedReport(null); setView('list') }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[15px] font-bold text-[var(--v4-ink)]">Report Cards</h3>
        <BtnPrimary onClick={() => setView('new')}>
          <Plus className="w-3.5 h-3.5" /> New Report Card
        </BtnPrimary>
      </div>

      {reports.length === 0 ? (
        <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] px-4 py-10 text-center">
          <FileText className="w-5 h-5 mx-auto mb-2 text-[var(--v4-ink-3)]" />
          <p className="text-[13px] font-medium text-[var(--v4-ink-2)]">No report cards yet</p>
          <p className="text-[12px] text-[var(--v4-ink-3)] mt-0.5">Create your first one above.</p>
        </div>
      ) : (
        <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] overflow-hidden">
          {reports.map((report, i) => {
            const filledSkills = Object.values(report.skillLevels || {}).filter(v => v && v !== 'not-assessed').length
            const statusCounts = { ahead: 0, 'on-track': 0, behind: 0 }
            SKILL_CONFIG.forEach(skill => {
              const level = report.skillLevels?.[skill.key]
              if (!level || level === 'not-assessed') return
              const s = getStatus(level, student?.grade)
              if (statusCounts[s.status] !== undefined) statusCounts[s.status]++
            })

            return (
              <div
                key={report.id}
                className={`grid items-center gap-3 px-4 py-3 hover:bg-[var(--v4-surface-2)] ${i === reports.length - 1 ? '' : 'border-b border-[var(--v4-border)]'}`}
                style={{ gridTemplateColumns: '32px 1fr auto auto' }}
              >
                <div className="w-8 h-8 rounded-md bg-[var(--v4-purple-lt)] text-[var(--v4-purple)] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <button
                  onClick={() => { setSelectedReport(report); setView('view') }}
                  className="text-left min-w-0"
                >
                  <p className="text-[13.5px] font-semibold text-[var(--v4-ink)] truncate">{report.name}</p>
                  <p className="text-[11.5px] text-[var(--v4-ink-3)] mt-0.5">
                    {new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' · '}{filledSkills} skill{filledSkills !== 1 ? 's' : ''} rated
                  </p>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  {statusCounts.ahead > 0 && (
                    <span className="text-[10.5px] bg-[var(--v4-green-lt)] text-[var(--v4-green)] px-1.5 py-0.5 rounded font-semibold">
                      {statusCounts.ahead} ahead
                    </span>
                  )}
                  {statusCounts['on-track'] > 0 && (
                    <span className="text-[10.5px] bg-[var(--v4-amber-lt)] text-[var(--v4-amber)] px-1.5 py-0.5 rounded font-semibold">
                      {statusCounts['on-track']} on track
                    </span>
                  )}
                  {statusCounts.behind > 0 && (
                    <span className="text-[10.5px] bg-[var(--v4-red-lt)] text-[var(--v4-red)] px-1.5 py-0.5 rounded font-semibold">
                      {statusCounts.behind} behind
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <IconBtn onClick={() => { setSelectedReport(report); setView('edit') }} title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </IconBtn>
                  <IconBtn
                    onClick={async () => { if (confirm('Delete this report card?')) { await deleteReportCard(report.id); refreshReports() } }}
                    title="Delete"
                    danger
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </IconBtn>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function IconBtn({ children, onClick, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 rounded-md flex items-center justify-center text-[var(--v4-ink-3)] hover:bg-[var(--v4-surface-3)] ${danger ? 'hover:text-[var(--v4-red)]' : 'hover:text-[var(--v4-ink)]'}`}
    >
      {children}
    </button>
  )
}
