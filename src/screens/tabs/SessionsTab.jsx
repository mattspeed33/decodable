import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudent, getLatestAssessment, getLatestAnalysis, getLatestSession, getSessions, getAssessments, saveSession, saveAnalysis } from '../../lib/storage'
import { runPrompt, compressImage } from '../../lib/claude'
import { sessionPrompt } from '../../prompts/sessionPrompt'
import { getAnalysisPrompt } from '../../prompts/analysisPrompt'
import { bundleForSessionPlan } from '../../lib/dataHelpers'
import LoadingState from '../../components/LoadingState.jsx'
import PhotoUploader from '../../components/PhotoUploader.jsx'
import { SESSION_TEMPLATES } from '../../lib/sessionTemplates'

const blockEmoji = {
  'warm-up': '☀️', 'phonemic_awareness': '👂', 'phonics_instruction': '🔤',
  'connected_reading': '📖', 'encoding_spelling': '✍️', 'confidence_close': '⭐'
}
const blockColors = {
  'warm-up': 'border-l-[var(--gold)]', 'phonemic_awareness': 'border-l-[var(--blue)]',
  'phonics_instruction': 'border-l-[var(--primary)]', 'connected_reading': 'border-l-[var(--green)]',
  'encoding_spelling': 'border-l-purple-400', 'confidence_close': 'border-l-pink-400'
}

export default function SessionsTab({ studentId, onRefresh }) {
  const navigate = useNavigate()
  const student = getStudent(studentId)
  const assessment = getLatestAssessment(studentId)
  const lastSession = getLatestSession(studentId)
  const allSessions = getSessions(studentId)
  const allAssessments = getAssessments(studentId)
  const latestAnalysis = getLatestAnalysis(studentId)
  const analysis = latestAnalysis?.ai_analysis

  const [mode, setMode] = useState(null)

  // Plan state
  const [sessionLength, setSessionLength] = useState(student?.session_length_minutes || 50)
  const [lastNotes, setLastNotes] = useState(lastSession?.tutor_notes || '')
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [planNotes, setPlanNotes] = useState({ tutor_notes: '', what_went_well: '', what_needs_more_work: '' })

  // Log state
  const [logForm, setLogForm] = useState({
    date: new Date().toISOString().split('T')[0],
    length_minutes: student?.session_length_minutes || 50,
    tutor_notes: '',
    what_went_well: '',
    what_needs_more_work: '',
  })
  const [logPhotos, setLogPhotos] = useState([])
  const [logAnalyzing, setLogAnalyzing] = useState(false)
  const [logError, setLogError] = useState(null)
  const [logSaved, setLogSaved] = useState(false)

  // Past sessions
  const [expandedSession, setExpandedSession] = useState(null)

  const currentWeek = (analysis?.week_arc || analysis?.four_week_arc)?.[Math.min(allSessions.length, ((analysis?.week_arc || analysis?.four_week_arc)?.length || 1) - 1)]

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const bundle = bundleForSessionPlan(studentId, sessionLength, lastNotes)
      const result = await runPrompt({ systemPrompt: sessionPrompt, userMessage: bundle })
      setPlan(JSON.parse(result))
    } catch (err) {
      setError(err.message || 'Failed to generate session plan.')
    } finally {
      setLoading(false)
    }
  }

  function handleSavePlan() {
    const sesNum = (lastSession?.ses_number || 0)
    saveSession({
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
      created_at: new Date().toISOString()
    })
    setPlan(null)
    setMode(null)
    setPlanNotes({ tutor_notes: '', what_went_well: '', what_needs_more_work: '' })
    onRefresh?.()
  }

  async function handleLogSession() {
    setLogAnalyzing(true)
    setLogError(null)
    try {
      let assessmentId = assessment?.id || null

      // If photos uploaded, run analysis and save assessment
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
          created_at: new Date().toISOString()
        }
        saveAnalysis(newAnalysis)
        assessmentId = newAnalysis.id
      }

      // Save session
      const sesNum = (lastSession?.ses_number || 0)
      saveSession({
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
        homework_assigned: false,
        parent_email_sent: false,
        created_at: new Date().toISOString()
      })

      setLogSaved(true)
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

  if (!student || !assessment) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border-2 border-gray-100">
        <span className="text-4xl block mb-2">📸</span>
        <p className="text-gray-400 font-bold">Upload an assessment first</p>
        <p className="text-gray-400 text-sm">Sessions are planned based on assessment data.</p>
      </div>
    )
  }

  if (loading) return <LoadingState messages={['🗓️ Building your session plan...', '🎯 Selecting activities...', '📘 Matching to UFLI scope...']} />
  if (logAnalyzing) return <LoadingState messages={['📝 Saving session...', '📸 Analyzing assessment photos...', '💾 Wrapping up...']} />

  const inputClass = 'w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white'

  return (
    <div className="space-y-5">
      {/* Action tiles */}
      {mode === null && !plan && (
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setMode('plan')}
            className="bg-white rounded-2xl border-2 border-gray-100 p-5 text-left hover:border-[var(--primary)] hover:shadow-md transition-all"
          >
            <span className="text-2xl block mb-2">✨</span>
            <p className="font-black text-black text-sm">AI Plan</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Auto-generated plan</p>
          </button>
          <button
            onClick={() => setMode('template')}
            className="bg-white rounded-2xl border-2 border-gray-100 p-5 text-left hover:border-[var(--primary)] hover:shadow-md transition-all"
          >
            <span className="text-2xl block mb-2">📄</span>
            <p className="font-black text-black text-sm">Template</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Pre-built lesson plans</p>
          </button>
          <button
            onClick={() => setMode('log')}
            className="bg-white rounded-2xl border-2 border-gray-100 p-5 text-left hover:border-[var(--primary)] hover:shadow-md transition-all"
          >
            <span className="text-2xl block mb-2">📝</span>
            <p className="font-black text-black text-sm">Log</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Record a past session</p>
          </button>
        </div>
      )}

      {/* ── PLAN MODE ── */}
      {mode === 'plan' && !plan && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-black">🗓️ Plan Session {allSessions.length + 1}</h3>
            <button onClick={() => setMode(null)} className="text-xs font-bold text-gray-400 hover:text-black">← Back</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Length</label>
              <select className={inputClass} value={sessionLength} onChange={e => setSessionLength(Number(e.target.value))}>
                {[30, 45, 50, 60, 65, 90].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleGenerate} className="w-full bg-[var(--primary)] text-white py-2.5 rounded-full font-bold hover:bg-[var(--primary-hover)] transition shadow-sm">
                Generate Plan
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Notes (optional)</label>
            <textarea className={inputClass + ' h-16'} value={lastNotes} onChange={e => setLastNotes(e.target.value)} placeholder="Carry-forward from last session..." />
          </div>
          {error && <div className="rounded-xl bg-[var(--red-light)] p-3 text-sm text-[var(--red)] font-bold">{error}</div>}
        </div>
      )}

      {/* ── GENERATED PLAN ── */}
      {plan && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-black text-lg">🗓️ Session Plan</h3>
            <button onClick={() => { setPlan(null); setMode(null) }} className="text-xs font-bold text-gray-400 hover:text-black">← Back</button>
          </div>

          <div className="bg-[var(--primary-light)] rounded-2xl border-2 border-[var(--primary)] p-5">
            <p className="text-sm font-black text-[var(--primary)]">🎯 {plan.session_goal}</p>
            <span className="text-xs bg-white text-[var(--primary)] px-2.5 py-0.5 rounded-full font-bold mt-2 inline-block">📘 Unit {plan.ufli_focus_unit} — {plan.ufli_focus_unit_name}</span>
          </div>

          <div className="space-y-2.5">
            {plan.blocks.map((block, i) => (
              <div key={i} className={`bg-white rounded-2xl border-2 border-gray-100 border-l-4 ${blockColors[block.type] || 'border-l-gray-300'} p-4`}>
                <div className="flex justify-between items-start mb-1.5">
                  <p className="font-black text-black text-sm">{blockEmoji[block.type] || '📌'} {block.name}</p>
                  <span className="text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-0.5 rounded-full">{block.time_start}–{block.time_end}</span>
                </div>
                <ul className="space-y-0.5 mb-1.5">
                  {(Array.isArray(block.what_to_do) ? block.what_to_do : [block.what_to_do]).map((step, j) => (
                    <li key={j} className="text-sm text-gray-700 flex gap-2"><span className="text-gray-300">&bull;</span>{step}</li>
                  ))}
                </ul>
                {block.example_words_or_prompts?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {block.example_words_or_prompts.map((w, j) => (
                      <span key={j} className="text-[10px] bg-[var(--blue-light)] text-[var(--blue)] px-2 py-0.5 rounded-full font-bold">{w}</span>
                    ))}
                  </div>
                )}
                {block.watch_for && <p className="text-xs text-[var(--orange)] mt-1 font-bold">⚠️ {block.watch_for}</p>}
              </div>
            ))}
          </div>

          {plan.prep_checklist?.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-4">
              <p className="text-xs font-black text-black mb-2">✅ Prep</p>
              <ul className="space-y-1">
                {plan.prep_checklist.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2 items-center"><input type="checkbox" className="w-4 h-4 accent-[var(--primary)]" /> {item}</li>
                ))}
              </ul>
            </div>
          )}

          {plan.tutor_reminder && (
            <div className="bg-[var(--gold-light)] rounded-2xl border-2 border-yellow-300 p-4">
              <p className="text-xs font-black text-[var(--orange)]">💡 Reminder</p>
              <p className="text-sm text-gray-800 mt-0.5">{plan.tutor_reminder}</p>
            </div>
          )}

          {/* Teacher feedback */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 space-y-4">
            <h3 className="font-black text-black text-sm">📝 Session Feedback</h3>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Session Notes</label>
              <textarea className={inputClass + ' h-16'} value={planNotes.tutor_notes} onChange={e => setPlanNotes(n => ({ ...n, tutor_notes: e.target.value }))} placeholder="What did you cover today?" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">💪 What went well</label>
                <textarea className={inputClass + ' h-16'} value={planNotes.what_went_well} onChange={e => setPlanNotes(n => ({ ...n, what_went_well: e.target.value }))} placeholder="Wins from today..." />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">🎯 Needs more work</label>
                <textarea className={inputClass + ' h-16'} value={planNotes.what_needs_more_work} onChange={e => setPlanNotes(n => ({ ...n, what_needs_more_work: e.target.value }))} placeholder="What to focus on next..." />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => window.print()} className="flex-1 bg-white border-2 border-gray-100 py-3 rounded-full font-bold text-black hover:border-[var(--primary)] transition">🖨️ Print</button>
            <button onClick={handleSavePlan} className="flex-1 bg-[var(--primary)] text-white py-3 rounded-full font-bold hover:bg-[var(--primary-hover)] transition shadow-sm">✓ Save Session</button>
          </div>
        </div>
      )}

      {/* ── LOG MODE ── */}
      {mode === 'log' && !plan && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-black">📝 Log Session {allSessions.length + 1}</h3>
            <button onClick={() => setMode(null)} className="text-xs font-bold text-gray-400 hover:text-black">← Back</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Date</label>
              <input className={inputClass} type="date" value={logForm.date} onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Length</label>
              <select className={inputClass} value={logForm.length_minutes} onChange={e => setLogForm(f => ({ ...f, length_minutes: Number(e.target.value) }))}>
                {[30, 45, 50, 60, 65, 90].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Session Notes</label>
            <textarea className={inputClass + ' h-20'} value={logForm.tutor_notes} onChange={e => setLogForm(f => ({ ...f, tutor_notes: e.target.value }))} placeholder="What did you cover today?" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">💪 What went well</label>
              <textarea className={inputClass + ' h-20'} value={logForm.what_went_well} onChange={e => setLogForm(f => ({ ...f, what_went_well: e.target.value }))} placeholder="Wins from today..." />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">🎯 Needs more work</label>
              <textarea className={inputClass + ' h-20'} value={logForm.what_needs_more_work} onChange={e => setLogForm(f => ({ ...f, what_needs_more_work: e.target.value }))} placeholder="What to focus on next..." />
            </div>
          </div>

          {/* Assessment photo upload */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">📸 Assessment Photos (optional)</label>
            <p className="text-xs text-gray-400 mb-3">Upload photos of any assessments from this session. They'll be analyzed automatically.</p>
            <PhotoUploader photos={logPhotos} setPhotos={setLogPhotos} />
          </div>

          {logError && <div className="rounded-xl bg-[var(--red-light)] p-3 text-sm text-[var(--red)] font-bold">{logError}</div>}

          {logSaved ? (
            <div className="bg-[var(--green-light)] text-[var(--green)] rounded-xl p-3 text-sm font-bold text-center">
              ✓ Session logged!{logPhotos.length > 0 ? ' Assessment saved.' : ''}
            </div>
          ) : (
            <button
              onClick={handleLogSession}
              className="w-full bg-[var(--primary)] text-white py-3.5 rounded-full font-bold hover:bg-[var(--primary-hover)] transition shadow-sm"
            >
              {logPhotos.length > 0 ? '📝 Log Session & Analyze Assessment' : '📝 Log Session'}
            </button>
          )}
        </div>
      )}

      {/* ── TEMPLATE PICKER ── */}
      {mode === 'template' && !plan && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-black text-lg">📄 Lesson Plan Templates</h3>
            <button onClick={() => setMode(null)} className="text-xs font-bold text-gray-400 hover:text-black">← Back</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {SESSION_TEMPLATES.map(tmpl => (
              <button
                key={tmpl.id}
                onClick={() => {
                  // Load template into plan, filling in student's UFLI data
                  const ufli = analysis?.ufli_placement
                  setPlan({
                    ...tmpl,
                    ufli_focus_unit: tmpl.ufli_focus_unit || ufli?.current_working_unit || null,
                    ufli_focus_unit_name: tmpl.ufli_focus_unit_name === 'To be determined' || tmpl.ufli_focus_unit_name === 'Current working pattern'
                      ? (ufli?.current_unit_name || tmpl.ufli_focus_unit_name)
                      : tmpl.ufli_focus_unit_name,
                  })
                  setMode('template')
                }}
                className="bg-white rounded-2xl border-2 border-gray-100 p-5 text-left hover:border-[var(--primary)] hover:shadow-md transition-all"
              >
                <span className="text-2xl block mb-2">{tmpl.icon}</span>
                <p className="font-black text-black text-sm">{tmpl.name}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{tmpl.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── PAST SESSIONS ── */}
      <div>
        <h3 className="font-black text-black text-lg mb-3">📚 Past Sessions</h3>
        {allSessions.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border-2 border-gray-100">
            <span className="text-3xl block mb-2">🗓️</span>
            <p className="text-gray-400 font-bold text-sm">No sessions yet</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {allSessions.map(session => {
              const isExpanded = expandedSession === session.id
              const sa = allAssessments.find(a => a.id === session.assessment_id)?.ai_analysis
                || getLatestAnalysis(studentId)?.ai_analysis
              const hasNotes = session.tutor_notes || session.what_went_well || session.what_needs_more_work
              return (
                <div key={session.id} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                    className="w-full p-4 text-left flex items-center gap-3 hover:bg-gray-50 transition"
                  >
                    <div className="bg-[var(--primary-light)] text-[var(--primary)] w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                      <span className="font-black">{session.ses_number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-black text-sm">Session {session.ses_number}</p>
                      <p className="text-[11px] text-gray-400 font-semibold">{session.date} &middot; {session.length_minutes} min</p>
                    </div>
                    <div className="flex gap-1.5 items-center shrink-0">
                      {session.ufli_unit_covered && <span className="text-[10px] bg-[var(--blue-light)] text-[var(--blue)] px-2 py-0.5 rounded-full font-bold">Unit {session.ufli_unit_covered}</span>}
                      {hasNotes && <span className="text-[10px] bg-[var(--green-light)] text-[var(--green)] px-2 py-0.5 rounded-full font-bold">📝</span>}
                      {sa && <span className="text-[10px] bg-[var(--primary-light)] text-[var(--primary)] px-2 py-0.5 rounded-full font-bold">📊</span>}
                      <span className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                      {session.tutor_notes && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">📝 Notes</p>
                          <p className="text-sm text-gray-700 mt-0.5">{session.tutor_notes}</p>
                        </div>
                      )}
                      {session.what_went_well && (
                        <div className="bg-[var(--green-light)] rounded-xl p-3">
                          <p className="text-[10px] font-bold text-[var(--green)]">💪 Went Well</p>
                          <p className="text-sm text-gray-800 mt-0.5">{session.what_went_well}</p>
                        </div>
                      )}
                      {session.what_needs_more_work && (
                        <div className="bg-[var(--orange-light)] rounded-xl p-3">
                          <p className="text-[10px] font-bold text-[var(--orange)]">🎯 Needs Work</p>
                          <p className="text-sm text-gray-800 mt-0.5">{session.what_needs_more_work}</p>
                        </div>
                      )}
                      {sa && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">📊 Assessment</p>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-[10px] bg-[var(--blue-light)] text-[var(--blue)] px-2 py-0.5 rounded-full font-bold">📖 {sa.passage_level_reached}</span>
                            <span className="text-[10px] font-bold" style={{ color: sa.fluency_estimate_pct >= 80 ? 'var(--green)' : 'var(--orange)' }}>🎯 {sa.fluency_estimate_pct}%</span>
                            {sa.ufli_placement && <span className="text-[10px] bg-[var(--primary-light)] text-[var(--primary)] px-2 py-0.5 rounded-full font-bold">📘 Unit {sa.ufli_placement.current_working_unit}</span>}
                          </div>
                          {sa.strengths?.length > 0 && (
                            <ul className="space-y-0.5 mt-1">
                              {sa.strengths.slice(0, 3).map((s, i) => (
                                <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-[var(--green)]">✓</span>{s}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      {!hasNotes && !sa && (
                        <p className="text-sm text-gray-400 text-center py-2">No notes recorded.</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
