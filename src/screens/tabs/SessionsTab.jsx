import { useState, useEffect } from 'react'
import { Plus, Sparkles, FileText, PencilLine, Target, ChevronDown, Printer, ArrowLeft } from 'lucide-react'
import { getStudent, getLatestAssessment, getLatestAnalysis, getLatestSession, getSessions, getAssessments, saveSession, saveAnalysis } from '../../lib/storage'
import { useAsync } from '../../lib/useAsync'
import { runPrompt, compressImage } from '../../lib/claude'
import { sessionPrompt } from '../../prompts/sessionPrompt'
import { getAnalysisPrompt } from '../../prompts/analysisPrompt'
import { bundleForSessionPlan } from '../../lib/dataHelpers'
import LoadingState from '../../components/LoadingState.jsx'
import PhotoUploader from '../../components/PhotoUploader.jsx'
import { SESSION_TEMPLATES } from '../../lib/sessionTemplates'
import { BtnPrimary, BtnSecondary, Card } from '../../components/v4/primitives.jsx'

const INPUT = 'w-full border border-[var(--v4-border)] rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--v4-ink)] bg-[var(--v4-surface)]'
const LABEL = 'block text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-1'

function relativeDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })
}

const blockBorder = {
  'warm-up': 'border-l-[var(--v4-amber)]',
  'phonemic_awareness': 'border-l-[var(--v4-blue)]',
  'phonics_instruction': 'border-l-[var(--v4-purple)]',
  'connected_reading': 'border-l-[var(--v4-green)]',
  'encoding_spelling': 'border-l-purple-400',
  'confidence_close': 'border-l-pink-400',
}

function QuickStartForm({ student, onGenerate }) {
  const [reading, setReading] = useState('')
  const [concerns, setConcerns] = useState('')
  const [triedBefore, setTriedBefore] = useState('')
  const [strengths, setStrengths] = useState('')
  const [sessionLen, setSessionLen] = useState(student?.session_length_minutes || 50)

  function handleSubmit() {
    onGenerate(`
STUDENT: ${student.name}, ${student.grade} grade, age ${student.age}
SESSION TYPE: ${student.session_type}
SESSION LENGTH TODAY: ${sessionLen} minutes
SESSIONS COMPLETED: 0 (first session)
TUTOR NAME: ${student.tutor_name || 'Tutor'}

QUICK ASSESSMENT (teacher observations, no formal assessment yet):
Reading level estimate: ${reading || 'Not sure yet'}
Parent/teacher concerns: ${concerns || 'None noted'}
What has been tried before: ${triedBefore || 'Unknown'}
Observed strengths: ${strengths || 'Not yet observed'}

NOTES FROM LAST SESSION:
No previous session — this is session 1. Use this as a getting-to-know-you session.
Focus on building rapport and doing informal observation while working through activities.
    `.trim())
  }

  return (
    <Card className="space-y-3">
      <p className="text-[13px] font-semibold text-[var(--v4-ink)]">Quick student snapshot</p>
      <p className="text-[12px] text-[var(--v4-ink-3)]">Answer what you can. This generates a first session plan.</p>

      <div>
        <label className={LABEL}>Reading level estimate</label>
        <select className={INPUT} value={reading} onChange={e => setReading(e.target.value)}>
          <option value="">Not sure yet</option>
          <option value="Pre-K level — not reading yet">Pre-K — not reading yet</option>
          <option value="K level — knows some letters, early CVC">K — knows some letters</option>
          <option value="Early 1st — reading simple words">Early 1st — simple words</option>
          <option value="Late 1st — reading short sentences">Late 1st — short sentences</option>
          <option value="2nd grade level">2nd grade level</option>
          <option value="3rd grade level">3rd grade level</option>
        </select>
      </div>
      <div>
        <label className={LABEL}>Main concerns</label>
        <textarea className={INPUT + ' h-16 resize-none'} value={concerns} onChange={e => setConcerns(e.target.value)} placeholder="Struggles to sound out new words, guesses instead of reading…" />
      </div>
      <div>
        <label className={LABEL}>What has been tried before</label>
        <textarea className={INPUT + ' h-16 resize-none'} value={triedBefore} onChange={e => setTriedBefore(e.target.value)} placeholder="School reading support, other tutoring, parent practice…" />
      </div>
      <div>
        <label className={LABEL}>Strengths you've noticed</label>
        <textarea className={INPUT + ' h-16 resize-none'} value={strengths} onChange={e => setStrengths(e.target.value)} placeholder="Loves stories, knows letter names, good listener…" />
      </div>
      <div>
        <label className={LABEL}>Session length</label>
        <select className={INPUT} value={sessionLen} onChange={e => setSessionLen(Number(e.target.value))}>
          {[30, 45, 50, 60, 65, 90].map(m => <option key={m} value={m}>{m} min</option>)}
        </select>
      </div>
      <BtnPrimary onClick={handleSubmit} className="w-full justify-center py-2 mt-1">
        Generate first session plan
      </BtnPrimary>
    </Card>
  )
}

export default function SessionsTab({ studentId, onRefresh }) {
  const { data: student } = useAsync(() => getStudent(studentId), [studentId])
  const { data: assessment } = useAsync(() => getLatestAssessment(studentId), [studentId])
  const { data: lastSession } = useAsync(() => getLatestSession(studentId), [studentId])
  const { data: allSessions = [], refresh: refreshSessions } = useAsync(() => getSessions(studentId), [studentId])
  const { data: allAssessments = [] } = useAsync(() => getAssessments(studentId), [studentId])
  const { data: latestAnalysis } = useAsync(() => getLatestAnalysis(studentId), [studentId])
  const analysis = latestAnalysis?.ai_analysis

  const [mode, setMode] = useState(null)
  const [sessionLength, setSessionLength] = useState(50)
  const [lastNotes, setLastNotes] = useState('')
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [planNotes, setPlanNotes] = useState({ tutor_notes: '', what_went_well: '', what_needs_more_work: '' })

  const [logForm, setLogForm] = useState({
    date: new Date().toISOString().split('T')[0],
    length_minutes: 50,
    tutor_notes: '',
    what_went_well: '',
    what_needs_more_work: '',
  })
  const [logPhotos, setLogPhotos] = useState([])
  const [logAnalyzing, setLogAnalyzing] = useState(false)
  const [logError, setLogError] = useState(null)
  const [logSaved, setLogSaved] = useState(false)
  const [expandedSession, setExpandedSession] = useState(null)

  useEffect(() => {
    if (student?.session_length_minutes) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessionLength(student.session_length_minutes)
      setLogForm(f => ({ ...f, length_minutes: student.session_length_minutes }))
    }
  }, [student?.session_length_minutes])
  useEffect(() => {
    if (lastSession?.tutor_notes) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastNotes(lastSession.tutor_notes)
    }
  }, [lastSession?.tutor_notes])

  const weekArc = analysis?.week_arc || analysis?.four_week_arc
  const currentWeek = weekArc?.[Math.min(allSessions.length, (weekArc?.length || 1) - 1)]

  async function handleGenerate() {
    setLoading(true); setError(null)
    try {
      const bundle = await bundleForSessionPlan(studentId, sessionLength, lastNotes)
      const result = await runPrompt({ systemPrompt: sessionPrompt, userMessage: bundle })
      setPlan(JSON.parse(result))
    } catch (err) {
      setError(err.message || 'Failed to generate session plan.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSavePlan() {
    const sesNum = (lastSession?.ses_number || 0)
    await saveSession({
      id: crypto.randomUUID(),
      student_id: studentId,
      assessment_id: assessment?.id,
      date: new Date().toISOString().split('T')[0],
      ses_number: sesNum + 1,
      length_minutes: sessionLength,
      ufli_unit_covered: plan?.ufli_focus_unit || null,
      tutor_notes: planNotes.tutor_notes,
      what_went_well: planNotes.what_went_well,
      what_needs_more_work: planNotes.what_needs_more_work,
      homework_assigned: false, parent_email_sent: false,
      created_at: new Date().toISOString(),
    })
    setPlan(null)
    setMode(null)
    setPlanNotes({ tutor_notes: '', what_went_well: '', what_needs_more_work: '' })
    refreshSessions()
    onRefresh?.()
  }

  async function handleLogSession() {
    setLogAnalyzing(true); setLogError(null)
    try {
      let assessmentId = assessment?.id || null
      if (logPhotos.length > 0) {
        const images = await Promise.all(logPhotos.map(p => compressImage(p.file)))
        const engagementWeeks = student.total_sessions_planned === 999 ? 4 : (student.total_sessions_planned || 4)
        const userMessage = `
Analyze this literacy assessment for ${student.name}, ${student.grade} grade, age ${student.age}.
Session type: ${student.session_type}
Engagement length: ${engagementWeeks} weeks
Notes from parent: ${student.notes_from_parent || 'None'}
Previous sessions completed: ${allSessions.length}
        `.trim()
        const result = await runPrompt({ systemPrompt: getAnalysisPrompt(engagementWeeks), userMessage, images })
        const parsed = JSON.parse(result)
        const newAnalysis = {
          id: crypto.randomUUID(),
          student_id: studentId,
          date: logForm.date,
          assessment_ids: [],
          ai_analysis: parsed,
          created_at: new Date().toISOString(),
        }
        await saveAnalysis(newAnalysis)
        assessmentId = newAnalysis.id
      }
      const sesNum = (lastSession?.ses_number || 0)
      await saveSession({
        id: crypto.randomUUID(),
        student_id: studentId,
        assessment_id: assessmentId,
        date: logForm.date,
        ses_number: sesNum + 1,
        length_minutes: logForm.length_minutes,
        ufli_unit_covered: null,
        tutor_notes: logForm.tutor_notes,
        what_went_well: logForm.what_went_well,
        what_needs_more_work: logForm.what_needs_more_work,
        homework_assigned: false, parent_email_sent: false,
        created_at: new Date().toISOString(),
      })
      setLogSaved(true)
      refreshSessions()
      onRefresh?.()
      setLogForm({ date: new Date().toISOString().split('T')[0], length_minutes: student?.session_length_minutes || 50, tutor_notes: '', what_went_well: '', what_needs_more_work: '' })
      setLogPhotos([])
      setTimeout(() => { setLogSaved(false); setMode(null) }, 2000)
    } catch (err) {
      setLogError(err.message || 'Failed to save session.')
    } finally {
      setLogAnalyzing(false)
    }
  }

  if (!student) return null

  // Zero-assessment state
  if (!assessment && !analysis) {
    return (
      <div className="space-y-4">
        <h3 className="text-[15px] font-bold text-[var(--v4-ink)]">Get started</h3>
        <p className="text-[12.5px] text-[var(--v4-ink-2)]">No assessments yet. Choose how to start your first session.</p>

        <div className="grid grid-cols-2 gap-2.5">
          <ActionTile
            icon={<ClipboardIcon />}
            title="Start Intake Session"
            sub="Run the full intake, then get an AI plan."
            onClick={() => setMode('intake')}
          />
          <ActionTile
            icon={<Sparkles className="w-4 h-4" />}
            title="Quick Start"
            sub="Answer a few questions to get a plan."
            onClick={() => setMode('quick-start')}
          />
        </div>

        {mode === 'intake' && (
          <div className="bg-[var(--v4-blue-lt)] rounded-md p-3 text-[12.5px] text-[var(--v4-blue)] font-medium">
            Go to the Assessments tab to complete the intake assessment first, then come back here.
          </div>
        )}

        {mode === 'quick-start' && (
          <QuickStartForm student={student} onGenerate={async (context) => {
            setLoading(true); setError(null)
            try {
              const result = await runPrompt({ systemPrompt: sessionPrompt, userMessage: context })
              setPlan(JSON.parse(result))
              setMode('plan')
            } catch (err) {
              setError(err.message || 'Failed to generate session plan.')
            } finally {
              setLoading(false)
            }
          }} />
        )}

        {error && <Banner tone="red">{error}</Banner>}
      </div>
    )
  }

  if (loading) return <LoadingState messages={['🗓️ Building your session plan...', '🎯 Selecting activities...', '📘 Matching to UFLI scope...']} />
  if (logAnalyzing) return <LoadingState messages={['📝 Saving session...', '📸 Analyzing assessment photos...', '💾 Wrapping up...']} />

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-baseline justify-between">
        <h3 className="text-[15px] font-bold text-[var(--v4-ink)]">Sessions</h3>
        {!mode && !plan && (
          <div className="flex items-center gap-2">
            <BtnSecondary onClick={() => setMode('log')}><PencilLine className="w-3.5 h-3.5" /> Log</BtnSecondary>
            <BtnSecondary onClick={() => setMode('template')}><FileText className="w-3.5 h-3.5" /> Template</BtnSecondary>
            <BtnPrimary onClick={() => setMode('plan')}><Plus className="w-3.5 h-3.5" /> Plan Session</BtnPrimary>
          </div>
        )}
      </div>

      {/* THIS WEEK CONTEXT */}
      {!mode && !plan && analysis && (
        <Card className="space-y-3">
          <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px]">
            Session {allSessions.length + 1} context
          </p>
          {currentWeek && (
            <div className="bg-[var(--v4-blue-lt)] rounded-md p-3 flex items-start gap-2.5">
              <Target className="w-4 h-4 text-[var(--v4-blue)] mt-0.5 shrink-0" />
              <div>
                <p className="text-[11.5px] font-semibold text-[var(--v4-blue)]">This week's focus</p>
                <p className="text-[13.5px] font-semibold text-[var(--v4-ink)]">{currentWeek.focus}</p>
                <p className="text-[11.5px] text-[var(--v4-ink-3)]">{currentWeek.activity_type}</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {analysis.ufli_placement && (
              <div className="bg-[var(--v4-purple-lt)] rounded-md p-3">
                <p className="text-[10.5px] font-semibold text-[var(--v4-purple)] uppercase tracking-[0.6px]">UFLI Unit</p>
                <p className="text-[16px] font-bold text-[var(--v4-purple)]">{analysis.ufli_placement.current_working_unit}</p>
                <p className="text-[10.5px] text-[var(--v4-ink-3)]">{analysis.ufli_placement.current_unit_name}</p>
              </div>
            )}
            {lastSession && (
              <div className="bg-[var(--v4-surface-2)] rounded-md p-3">
                <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px]">Last session</p>
                <p className="text-[12px] text-[var(--v4-ink-2)] mt-0.5 line-clamp-2">{lastSession.what_needs_more_work || lastSession.tutor_notes || 'No notes'}</p>
              </div>
            )}
          </div>
          {analysis.priority_gaps?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mr-1">Gaps</span>
              {analysis.priority_gaps.map((g, i) => (
                <span key={i} className="text-[10.5px] bg-[var(--v4-red-lt)] text-[var(--v4-red)] px-1.5 py-0.5 rounded font-semibold">{g.gap}</span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* PLAN MODE */}
      {mode === 'plan' && !plan && (
        <Card className="space-y-3">
          <ModeHeader title={`Plan Session ${allSessions.length + 1}`} onBack={() => setMode(null)} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Length</label>
              <select className={INPUT} value={sessionLength} onChange={e => setSessionLength(Number(e.target.value))}>
                {[30, 45, 50, 60, 65, 90].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <BtnPrimary onClick={handleGenerate} className="w-full justify-center py-2"><Sparkles className="w-3.5 h-3.5" /> Generate</BtnPrimary>
            </div>
          </div>
          <div>
            <label className={LABEL}>Carry-forward notes (optional)</label>
            <textarea className={INPUT + ' h-16 resize-none'} value={lastNotes} onChange={e => setLastNotes(e.target.value)} placeholder="From last session…" />
          </div>
          {error && <Banner tone="red">{error}</Banner>}
        </Card>
      )}

      {/* GENERATED PLAN */}
      {plan && (
        <div className="space-y-4">
          <ModeHeader title="Session Plan" onBack={() => { setPlan(null); setMode(null) }} />

          <div className="bg-[var(--v4-purple-lt)] rounded-md p-4 border border-[var(--v4-purple-lt)]">
            <p className="text-[13.5px] font-semibold text-[var(--v4-purple)]"><Target className="w-3.5 h-3.5 inline mr-1.5" />{plan.session_goal}</p>
            <span className="text-[10.5px] bg-white text-[var(--v4-purple)] px-1.5 py-0.5 rounded font-semibold mt-2 inline-block">
              Unit {plan.ufli_focus_unit} — {plan.ufli_focus_unit_name}
            </span>
          </div>

          <div className="space-y-2">
            {plan.blocks.map((block, i) => (
              <Card key={i} padding="p-3" className={`border-l-4 ${blockBorder[block.type] || 'border-l-[var(--v4-ink-4)]'}`}>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[13px] font-semibold text-[var(--v4-ink)]">{block.name}</p>
                  <span className="text-[10.5px] text-[var(--v4-ink-3)] font-semibold bg-[var(--v4-surface-3)] px-1.5 py-0.5 rounded">{block.time_start}–{block.time_end}</span>
                </div>
                <ul className="space-y-0.5 mb-1">
                  {(Array.isArray(block.what_to_do) ? block.what_to_do : [block.what_to_do]).map((step, j) => (
                    <li key={j} className="text-[12.5px] text-[var(--v4-ink-2)] flex gap-1.5"><span className="text-[var(--v4-ink-4)]">•</span>{step}</li>
                  ))}
                </ul>
                {block.example_words_or_prompts?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {block.example_words_or_prompts.map((w, j) => (
                      <span key={j} className="text-[10.5px] bg-[var(--v4-blue-lt)] text-[var(--v4-blue)] px-1.5 py-0.5 rounded font-semibold">{w}</span>
                    ))}
                  </div>
                )}
                {block.watch_for && <p className="text-[11.5px] text-[var(--v4-amber)] mt-1 font-semibold">⚠ {block.watch_for}</p>}
              </Card>
            ))}
          </div>

          {plan.prep_checklist?.length > 0 && (
            <Card padding="p-3">
              <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-1.5">Prep</p>
              <ul className="space-y-1">
                {plan.prep_checklist.map((item, i) => (
                  <li key={i} className="text-[12.5px] text-[var(--v4-ink-2)] flex gap-2 items-center">
                    <input type="checkbox" className="w-3.5 h-3.5 accent-[var(--v4-ink)]" /> {item}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {plan.tutor_reminder && (
            <div className="bg-[var(--v4-amber-lt)] rounded-md p-3 border border-[var(--v4-amber-lt)]">
              <p className="text-[10.5px] font-semibold text-[var(--v4-amber)] uppercase tracking-[0.6px]">Reminder</p>
              <p className="text-[12.5px] text-[var(--v4-ink-2)] mt-0.5">{plan.tutor_reminder}</p>
            </div>
          )}

          <Card padding="p-3" className="space-y-2.5">
            <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px]">Session Feedback</p>
            <div>
              <label className={LABEL}>Notes</label>
              <textarea className={INPUT + ' h-14 resize-none'} value={planNotes.tutor_notes} onChange={e => setPlanNotes(n => ({ ...n, tutor_notes: e.target.value }))} placeholder="What did you cover today?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>What went well</label>
                <textarea className={INPUT + ' h-14 resize-none'} value={planNotes.what_went_well} onChange={e => setPlanNotes(n => ({ ...n, what_went_well: e.target.value }))} placeholder="Wins from today…" />
              </div>
              <div>
                <label className={LABEL}>Needs more work</label>
                <textarea className={INPUT + ' h-14 resize-none'} value={planNotes.what_needs_more_work} onChange={e => setPlanNotes(n => ({ ...n, what_needs_more_work: e.target.value }))} placeholder="What to focus on next…" />
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-2">
            <BtnSecondary onClick={() => window.print()}><Printer className="w-3.5 h-3.5" /> Print</BtnSecondary>
            <BtnPrimary onClick={handleSavePlan} className="ml-auto">Save Session</BtnPrimary>
          </div>
        </div>
      )}

      {/* LOG MODE */}
      {mode === 'log' && !plan && (
        <Card className="space-y-3">
          <ModeHeader title={`Log Session ${allSessions.length + 1}`} onBack={() => setMode(null)} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Date</label>
              <input className={INPUT} type="date" value={logForm.date} onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Length</label>
              <select className={INPUT} value={logForm.length_minutes} onChange={e => setLogForm(f => ({ ...f, length_minutes: Number(e.target.value) }))}>
                {[30, 45, 50, 60, 65, 90].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL}>Notes</label>
            <textarea className={INPUT + ' h-16 resize-none'} value={logForm.tutor_notes} onChange={e => setLogForm(f => ({ ...f, tutor_notes: e.target.value }))} placeholder="What did you cover today?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>What went well</label>
              <textarea className={INPUT + ' h-16 resize-none'} value={logForm.what_went_well} onChange={e => setLogForm(f => ({ ...f, what_went_well: e.target.value }))} placeholder="Wins from today…" />
            </div>
            <div>
              <label className={LABEL}>Needs more work</label>
              <textarea className={INPUT + ' h-16 resize-none'} value={logForm.what_needs_more_work} onChange={e => setLogForm(f => ({ ...f, what_needs_more_work: e.target.value }))} placeholder="What to focus on next…" />
            </div>
          </div>
          <div>
            <label className={LABEL}>Assessment photos (optional)</label>
            <p className="text-[11.5px] text-[var(--v4-ink-3)] mb-2">Upload photos of any assessments from this session — they'll be analyzed automatically.</p>
            <PhotoUploader photos={logPhotos} setPhotos={setLogPhotos} />
          </div>
          {logError && <Banner tone="red">{logError}</Banner>}
          {logSaved ? (
            <Banner tone="green">Session logged.{logPhotos.length > 0 ? ' Assessment saved.' : ''}</Banner>
          ) : (
            <BtnPrimary onClick={handleLogSession} className="w-full justify-center py-2">
              {logPhotos.length > 0 ? 'Log Session & Analyze' : 'Log Session'}
            </BtnPrimary>
          )}
        </Card>
      )}

      {/* TEMPLATE PICKER */}
      {mode === 'template' && !plan && (
        <div className="space-y-3">
          <ModeHeader title="Lesson Plan Templates" onBack={() => setMode(null)} />
          <div className="grid grid-cols-2 gap-2.5">
            {SESSION_TEMPLATES.map(tmpl => (
              <button
                key={tmpl.id}
                onClick={() => {
                  const ufli = analysis?.ufli_placement
                  setPlan({
                    ...tmpl,
                    ufli_focus_unit: tmpl.ufli_focus_unit || ufli?.current_working_unit || null,
                    ufli_focus_unit_name: tmpl.ufli_focus_unit_name === 'To be determined' || tmpl.ufli_focus_unit_name === 'Current working pattern'
                      ? (ufli?.current_unit_name || tmpl.ufli_focus_unit_name)
                      : tmpl.ufli_focus_unit_name,
                  })
                }}
                className="bg-[var(--v4-surface)] rounded-[10px] border border-[var(--v4-border)] p-4 text-left hover:border-[var(--v4-border-2)] hover:shadow-sm transition-all"
              >
                <span className="text-xl block mb-1">{tmpl.icon}</span>
                <p className="text-[13px] font-semibold text-[var(--v4-ink)]">{tmpl.name}</p>
                <p className="text-[11.5px] text-[var(--v4-ink-3)] mt-0.5">{tmpl.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PAST SESSIONS */}
      {!plan && (
        <div>
          <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-2">Past Sessions</p>
          {allSessions.length === 0 ? (
            <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] px-4 py-8 text-center">
              <p className="text-[12.5px] text-[var(--v4-ink-3)]">No sessions yet</p>
            </div>
          ) : (
            <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] overflow-hidden">
              {allSessions.map((session, i) => {
                const isExpanded = expandedSession === session.id
                const sa = allAssessments.find(a => a.id === session.assessment_id)?.ai_analysis || latestAnalysis?.ai_analysis
                const hasNotes = session.tutor_notes || session.what_went_well || session.what_needs_more_work
                return (
                  <div key={session.id} className={i === allSessions.length - 1 ? '' : 'border-b border-[var(--v4-border)]'}>
                    <button
                      onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-[var(--v4-surface-2)]"
                    >
                      <div className="w-8 h-8 rounded-md bg-[var(--v4-purple-lt)] text-[var(--v4-purple)] flex items-center justify-center shrink-0 font-bold text-[12px]">
                        {session.ses_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-semibold text-[var(--v4-ink)]">Session {session.ses_number}</p>
                        <p className="text-[11.5px] text-[var(--v4-ink-3)] mt-0.5">{relativeDate(session.date)} · {session.length_minutes} min</p>
                      </div>
                      <div className="flex gap-1.5 items-center shrink-0">
                        {session.ufli_unit_covered && <span className="text-[10.5px] bg-[var(--v4-blue-lt)] text-[var(--v4-blue)] px-1.5 py-0.5 rounded font-semibold">Unit {session.ufli_unit_covered}</span>}
                        {hasNotes && <span className="text-[10.5px] bg-[var(--v4-green-lt)] text-[var(--v4-green)] px-1.5 py-0.5 rounded font-semibold">Notes</span>}
                        <ChevronDown className={`w-3.5 h-3.5 text-[var(--v4-ink-4)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 pl-[60px] bg-[var(--v4-surface-2)] border-t border-[var(--v4-border)] pt-3 space-y-2.5">
                        {session.tutor_notes && (
                          <div>
                            <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px]">Notes</p>
                            <p className="text-[12.5px] text-[var(--v4-ink-2)] mt-0.5">{session.tutor_notes}</p>
                          </div>
                        )}
                        {session.what_went_well && (
                          <div className="bg-[var(--v4-green-lt)] rounded-md p-2.5">
                            <p className="text-[10.5px] font-semibold text-[var(--v4-green)] uppercase tracking-[0.6px]">Went well</p>
                            <p className="text-[12.5px] text-[var(--v4-ink-2)] mt-0.5">{session.what_went_well}</p>
                          </div>
                        )}
                        {session.what_needs_more_work && (
                          <div className="bg-[var(--v4-amber-lt)] rounded-md p-2.5">
                            <p className="text-[10.5px] font-semibold text-[var(--v4-amber)] uppercase tracking-[0.6px]">Needs work</p>
                            <p className="text-[12.5px] text-[var(--v4-ink-2)] mt-0.5">{session.what_needs_more_work}</p>
                          </div>
                        )}
                        {sa && (
                          <div className="bg-white border border-[var(--v4-border)] rounded-md p-2.5 space-y-1.5">
                            <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px]">Assessment</p>
                            <div className="flex flex-wrap gap-1.5">
                              <span className="text-[10.5px] bg-[var(--v4-blue-lt)] text-[var(--v4-blue)] px-1.5 py-0.5 rounded font-semibold">{sa.passage_level_reached}</span>
                              {sa.fluency_estimate_pct != null && (
                                <span className="text-[10.5px] font-semibold" style={{ color: sa.fluency_estimate_pct >= 80 ? 'var(--v4-green)' : 'var(--v4-amber)' }}>{sa.fluency_estimate_pct}%</span>
                              )}
                              {sa.ufli_placement && <span className="text-[10.5px] bg-[var(--v4-purple-lt)] text-[var(--v4-purple)] px-1.5 py-0.5 rounded font-semibold">Unit {sa.ufli_placement.current_working_unit}</span>}
                            </div>
                          </div>
                        )}
                        {!hasNotes && !sa && (
                          <p className="text-[12.5px] text-[var(--v4-ink-3)] text-center">No notes recorded.</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ModeHeader({ title, onBack }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[14px] font-semibold text-[var(--v4-ink)]">{title}</p>
      <button onClick={onBack} className="flex items-center gap-1 text-[11.5px] text-[var(--v4-ink-3)] hover:text-[var(--v4-ink)] font-medium">
        <ArrowLeft className="w-3 h-3" /> Back
      </button>
    </div>
  )
}

function ActionTile({ icon, title, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-[var(--v4-surface)] rounded-[10px] border border-[var(--v4-border)] p-4 text-left hover:border-[var(--v4-border-2)] transition-colors"
    >
      <div className="w-7 h-7 rounded-md bg-[var(--v4-surface-3)] text-[var(--v4-ink-2)] flex items-center justify-center mb-2">{icon}</div>
      <p className="text-[13px] font-semibold text-[var(--v4-ink)]">{title}</p>
      <p className="text-[11.5px] text-[var(--v4-ink-3)] mt-0.5">{sub}</p>
    </button>
  )
}

function ClipboardIcon() {
  return <FileText className="w-4 h-4" />
}

function Banner({ tone, children }) {
  const tones = {
    red:   'bg-[var(--v4-red-lt)] text-[var(--v4-red)]',
    green: 'bg-[var(--v4-green-lt)] text-[var(--v4-green)]',
    amber: 'bg-[var(--v4-amber-lt)] text-[var(--v4-amber)]',
  }
  return <div className={`rounded-md px-3 py-2 text-[12.5px] font-medium ${tones[tone]}`}>{children}</div>
}
