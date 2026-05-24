import { useState } from 'react'
import { Plus, FileText, Pencil, Trash2, ArrowLeft, Sparkles, Save, Printer, Check } from 'lucide-react'
import { getStudent, getAnalyses, getSessions, getReportCards, saveReportCard, deleteReportCard } from '../../lib/storage'
import { useAsync } from '../../lib/useAsync'
import { BtnPrimary, BtnSecondary } from '../../components/v4/primitives.jsx'
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
    <div className="py-3.5 border-b border-[var(--v4-border)] last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{skill.icon}</span>
          <p className="text-[13px] font-semibold text-[var(--v4-ink)]">{skill.label}</p>
        </div>
        <div className="flex items-center gap-2">
          {level && level !== 'not-assessed' && levelInfo && (
            <span className="text-[11.5px] font-semibold text-[var(--v4-ink)]">{levelInfo.label}</span>
          )}
          <span className="inline-block w-[7px] h-[7px] rounded-full shrink-0" style={{ background: status.color }} />
          <span className="text-[10.5px] font-semibold" style={{ color: status.color }}>{status.label}</span>
        </div>
      </div>

      <div className="relative">
        <div className="w-full h-2 bg-[var(--v4-surface-3)] rounded-full overflow-hidden">
          {pct > 0 && (
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${pct}%`, background: status.color }}
            />
          )}
        </div>
        <div className="flex justify-between mt-1">
          {['PK', 'K', '1st', '2nd', '3rd'].map((label, i) => (
            <span key={i} className="text-[9px] text-[var(--v4-ink-3)] font-semibold">{label}</span>
          ))}
        </div>
      </div>

      {benchmark && (
        <p className="text-[10.5px] text-[var(--v4-ink-3)] mt-1.5">{benchmark}</p>
      )}

      {!readOnly && (
        <select
          className="action-buttons mt-1 text-[10.5px] text-[var(--v4-ink-3)] bg-transparent border-0 p-0 focus:outline-none cursor-pointer hover:text-[var(--v4-ink)] font-medium"
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
    setError(null)
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
    try {
      await saveReportCard(report)
      onSave()
    } catch (err) {
      setError(err?.message || 'Could not save the report card. Check your connection and try again.')
    }
  }

  if (studentLoading || !student) return <LoadingState messages={['Loading…']} />
  if (loading) return <LoadingState messages={['Mapping skills to grade levels…', 'Writing the parent summary…', 'Building the report…']} />

  const statusCounts = { ahead: 0, 'on-track': 0, behind: 0, unknown: 0 }
  SKILL_CONFIG.forEach(skill => {
    const level = skillLevels[skill.key]
    if (!level || level === 'not-assessed') { statusCounts.unknown++; return }
    const s = getStatus(level, student.grade)
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1
  })

  const hasData = Object.values(skillLevels).some(v => v && v !== 'not-assessed')

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="action-buttons flex items-center justify-between flex-wrap gap-2">
        <BtnSecondary onClick={onCancel}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </BtnSecondary>
        <div className="flex gap-2 flex-wrap">
          <BtnSecondary
            onClick={handleAutoPopulate}
            disabled={!firstA}
            className={!firstA ? 'opacity-40 cursor-not-allowed' : ''}
          >
            <Sparkles className="w-3.5 h-3.5" /> Auto-populate
          </BtnSecondary>
          <BtnSecondary onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5" /> Print
          </BtnSecondary>
          <BtnPrimary onClick={handleSave}>
            <Save className="w-3.5 h-3.5" /> Save
          </BtnPrimary>
        </div>
      </div>

      {error && (
        <div className="action-buttons rounded-md bg-[var(--v4-red-lt)] px-3 py-2 text-[12.5px] text-[var(--v4-red)] font-medium">{error}</div>
      )}

      {/* Report name */}
      <input
        className="action-buttons w-full text-[16px] font-bold text-[var(--v4-ink)] bg-transparent border-b border-dashed border-[var(--v4-border-2)] py-2 focus:outline-none focus:border-[var(--v4-ink)] print:border-0"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Report card name…"
      />

      {/* ══ REPORT CARD ══ */}
      <div className="bg-[var(--v4-surface)] border border-[var(--v4-border)] rounded-[10px] print:border-0 print:rounded-none overflow-hidden">

        {/* Header */}
        <div className="p-7 pb-5 border-b border-[var(--v4-border)] print:p-6">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <p className="text-[10.5px] text-[var(--v4-ink-3)] font-bold uppercase tracking-[0.6px]">Progress Report</p>
              <h1 className="text-[22px] font-bold text-[var(--v4-ink)] tracking-[-0.5px] leading-[1.15] mt-1.5">{student.name}</h1>
              <p className="text-[12.5px] text-[var(--v4-ink-2)] mt-0.5">{student.grade} Grade · Age {student.age} · {sessions.length} sessions</p>
            </div>
            <div className="text-right shrink-0">
              <input
                className="text-[13px] font-semibold text-[var(--v4-ink)] text-right bg-transparent border-b border-dashed border-[var(--v4-border-2)] focus:outline-none focus:border-[var(--v4-ink)] print:border-0 w-40"
                value={tutorName}
                onChange={e => setTutorName(e.target.value)}
                placeholder="Tutor name"
              />
              {settings.business_name && <p className="text-[10.5px] text-[var(--v4-ink-3)] mt-0.5">{settings.business_name}</p>}
              <p className="text-[10.5px] text-[var(--v4-ink-3)] mt-0.5">{student.start_date} to {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {hasData && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {statusCounts.ahead > 0 && (
                <StatusCount tone="green" count={statusCounts.ahead} label="Ahead" />
              )}
              {statusCounts['on-track'] > 0 && (
                <StatusCount tone="amber" count={statusCounts['on-track']} label="On Track" />
              )}
              {statusCounts.behind > 0 && (
                <StatusCount tone="red" count={statusCounts.behind} label="Behind" />
              )}
            </div>
          )}
        </div>

        {/* Skill bars */}
        <div className="px-7 py-4 print:px-6">
          <p className="text-[10.5px] font-bold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-2">Skills by Grade Level</p>
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
        <div className="px-7 pb-4 print:px-6">
          <div className="flex flex-wrap gap-4 text-[10.5px] text-[var(--v4-ink-3)] font-medium">
            <LegendItem tone="green" label="Ahead: above grade level" />
            <LegendItem tone="amber" label="On Track: at or near grade level" />
            <LegendItem tone="red" label="Behind: more than one level below" />
          </div>
        </div>

        {/* Strengths + Working On */}
        <div className="px-7 py-5 border-t border-[var(--v4-border)] print:px-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10.5px] font-bold text-[var(--v4-green)] uppercase tracking-[0.6px] mb-2">Strengths and wins</p>
              <div className="space-y-1.5">
                {strengths.map((s, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Check className="w-3.5 h-3.5 text-[var(--v4-green)] mt-0.5 shrink-0" />
                    <textarea
                      ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }}
                      className="flex-1 text-[12.5px] text-[var(--v4-ink)] bg-transparent border-b border-[var(--v4-border)] py-0.5 focus:outline-none focus:border-[var(--v4-ink)] print:border-0 resize-none overflow-hidden"
                      rows={1}
                      value={s}
                      onChange={e => { updateList(setStrengths, i, e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                      placeholder="Add a strength…"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10.5px] font-bold text-[var(--v4-amber)] uppercase tracking-[0.6px] mb-2">What we're working on</p>
              <div className="space-y-1.5">
                {workingOn.map((s, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--v4-amber)] mt-2 shrink-0" />
                    <textarea
                      ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }}
                      className="flex-1 text-[12.5px] text-[var(--v4-ink)] bg-transparent border-b border-[var(--v4-border)] py-0.5 focus:outline-none focus:border-[var(--v4-ink)] print:border-0 resize-none overflow-hidden"
                      rows={1}
                      value={s}
                      onChange={e => { updateList(setWorkingOn, i, e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                      placeholder="Add a focus area…"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Parent summary */}
        <div className="px-7 py-5 border-t border-[var(--v4-border)] print:px-6">
          <p className="text-[10.5px] font-bold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-2">Summary</p>
          <textarea
            className="w-full text-[13px] text-[var(--v4-ink-2)] leading-relaxed bg-transparent border-b border-dashed border-[var(--v4-border-2)] focus:outline-none focus:border-[var(--v4-ink)] print:border-0 resize-none h-20"
            value={parentSummary}
            onChange={e => setParentSummary(e.target.value)}
            placeholder="Auto-populated summary will appear here, or write your own…"
          />
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-[var(--v4-border)] flex justify-between text-[10.5px] text-[var(--v4-ink-3)] print:px-6">
          <span>{tutorName}{settings.business_name ? ` · ${settings.business_name}` : ''}</span>
          <span>Decodable · {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}

const STATUS_TONE = {
  green: { bg: 'bg-[var(--v4-green-lt)]',  fg: 'text-[var(--v4-green)]',  dot: 'bg-[var(--v4-green)]' },
  amber: { bg: 'bg-[var(--v4-amber-lt)]',  fg: 'text-[var(--v4-amber)]',  dot: 'bg-[var(--v4-amber)]' },
  red:   { bg: 'bg-[var(--v4-red-lt)]',    fg: 'text-[var(--v4-red)]',    dot: 'bg-[var(--v4-red)]'   },
}

function StatusCount({ tone, count, label }) {
  const t = STATUS_TONE[tone]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded ${t.bg}`}>
      <span className={`inline-block w-[7px] h-[7px] rounded-full ${t.dot}`} />
      <span className={`text-[11px] font-semibold ${t.fg}`}>{count} {label}</span>
    </span>
  )
}

function LegendItem({ tone, label }) {
  const t = STATUS_TONE[tone]
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-[7px] h-[7px] rounded-full ${t.dot}`} />
      {label}
    </span>
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
    <div className="space-y-4">
      <div className="action-buttons flex items-center justify-between flex-wrap gap-2">
        <BtnSecondary onClick={onBack}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </BtnSecondary>
        <div className="flex gap-2 flex-wrap">
          <BtnSecondary onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5" /> Print
          </BtnSecondary>
          <BtnPrimary onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" /> Edit
          </BtnPrimary>
        </div>
      </div>

      <div className="bg-[var(--v4-surface)] border border-[var(--v4-border)] rounded-[10px] print:border-0 print:rounded-none overflow-hidden">
        <div className="p-7 pb-5 border-b border-[var(--v4-border)] print:p-6">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <p className="text-[10.5px] text-[var(--v4-ink-3)] font-bold uppercase tracking-[0.6px]">Progress Report</p>
              <h1 className="text-[22px] font-bold text-[var(--v4-ink)] tracking-[-0.5px] leading-[1.15] mt-1.5">{student.name}</h1>
              <p className="text-[12.5px] text-[var(--v4-ink-2)] mt-0.5">{student.grade} Grade · Age {student.age} · {sessions.length} sessions</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[13px] font-semibold text-[var(--v4-ink)]">{report.tutorName}</p>
              {settings.business_name && <p className="text-[10.5px] text-[var(--v4-ink-3)] mt-0.5">{settings.business_name}</p>}
              <p className="text-[10.5px] text-[var(--v4-ink-3)] mt-0.5">{student.start_date} to {new Date(report.date).toLocaleDateString()}</p>
            </div>
          </div>

          {hasData && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {statusCounts.ahead > 0 && (
                <StatusCount tone="green" count={statusCounts.ahead} label="Ahead" />
              )}
              {statusCounts['on-track'] > 0 && (
                <StatusCount tone="amber" count={statusCounts['on-track']} label="On Track" />
              )}
              {statusCounts.behind > 0 && (
                <StatusCount tone="red" count={statusCounts.behind} label="Behind" />
              )}
            </div>
          )}
        </div>

        <div className="px-7 py-4 print:px-6">
          <p className="text-[10.5px] font-bold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-2">Skills by Grade Level</p>
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

        <div className="px-7 pb-4 print:px-6">
          <div className="flex flex-wrap gap-4 text-[10.5px] text-[var(--v4-ink-3)] font-medium">
            <LegendItem tone="green" label="Ahead: above grade level" />
            <LegendItem tone="amber" label="On Track: at or near grade level" />
            <LegendItem tone="red" label="Behind: more than one level below" />
          </div>
        </div>

        {/* Strengths + Working On */}
        {(report.strengths?.some(s => s) || report.workingOn?.some(s => s)) && (
          <div className="px-7 py-5 border-t border-[var(--v4-border)] print:px-6">
            <div className="grid grid-cols-2 gap-6">
              {report.strengths?.some(s => s) && (
                <div>
                  <p className="text-[10.5px] font-bold text-[var(--v4-green)] uppercase tracking-[0.6px] mb-2">Strengths and wins</p>
                  <ul className="space-y-1.5">
                    {report.strengths.filter(s => s).map((s, i) => (
                      <li key={i} className="text-[12.5px] text-[var(--v4-ink)] flex gap-2 items-start">
                        <Check className="w-3.5 h-3.5 text-[var(--v4-green)] mt-0.5 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {report.workingOn?.some(s => s) && (
                <div>
                  <p className="text-[10.5px] font-bold text-[var(--v4-amber)] uppercase tracking-[0.6px] mb-2">What we're working on</p>
                  <ul className="space-y-1.5">
                    {report.workingOn.filter(s => s).map((s, i) => (
                      <li key={i} className="text-[12.5px] text-[var(--v4-ink)] flex gap-2 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--v4-amber)] mt-2 shrink-0" />
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
          <div className="px-7 py-5 border-t border-[var(--v4-border)] print:px-6">
            <p className="text-[10.5px] font-bold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-2">Summary</p>
            <p className="text-[13px] text-[var(--v4-ink-2)] leading-relaxed">{report.parentSummary}</p>
          </div>
        )}

        <div className="px-7 py-4 border-t border-[var(--v4-border)] flex justify-between text-[10.5px] text-[var(--v4-ink-3)] print:px-6">
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
      <div className="flex items-center justify-end gap-2">
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
      aria-label={title}
      className={`w-8 h-8 rounded-md flex items-center justify-center text-[var(--v4-ink-3)] hover:bg-[var(--v4-surface-3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--v4-ink)] focus-visible:outline-offset-2 ${danger ? 'hover:text-[var(--v4-red)]' : 'hover:text-[var(--v4-ink)]'}`}
    >
      {children}
    </button>
  )
}
