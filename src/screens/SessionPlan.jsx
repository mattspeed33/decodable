import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getStudent, getLatestAnalysis, getLatestSession, getSessions, getAssessments, saveSession } from '../lib/storage'
import { runPrompt } from '../lib/claude'
import { sessionPrompt } from '../prompts/sessionPrompt'
import { bundleForSessionPlan } from '../lib/dataHelpers'
import LoadingState from '../components/LoadingState.jsx'

const blockEmoji = {
  'warm-up': '☀️',
  'phonemic_awareness': '👂',
  'phonics_instruction': '🔤',
  'connected_reading': '📖',
  'encoding_spelling': '✍️',
  'confidence_close': '⭐'
}

const blockColors = {
  'warm-up': 'border-l-[var(--gold)]',
  'phonemic_awareness': 'border-l-[var(--blue)]',
  'phonics_instruction': 'border-l-[var(--primary)]',
  'connected_reading': 'border-l-[var(--green)]',
  'encoding_spelling': 'border-l-purple-400',
  'confidence_close': 'border-l-pink-400'
}

export default function SessionPlan({ studentId }) {
  const params = useParams()
  const id = studentId || params.id
  const navigate = useNavigate()
  const student = getStudent(id)
  const analysis = getLatestAnalysis(id)
  const lastSession = getLatestSession(id)
  const allSessions = getSessions(id)
  const allAssessments = getAssessments(id)

  const [sessionLength, setSessionLength] = useState(student?.session_length_minutes || 50)
  const [lastNotes, setLastNotes] = useState(lastSession?.tutor_notes || '')
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedSession, setExpandedSession] = useState(null)

  function getAssessmentForSession(session) {
    return allAssessments.find(a => a.id === session.assessment_id) || null
  }

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const bundle = bundleForSessionPlan(id, sessionLength, lastNotes)
      const result = await runPrompt({ systemPrompt: sessionPrompt, userMessage: bundle })
      setPlan(JSON.parse(result))
    } catch (err) {
      setError(err.message || 'Failed to generate session plan.')
    } finally {
      setLoading(false)
    }
  }

  function handleSaveSession() {
    const sesNum = (getLatestSession(id)?.ses_number || 0)
    const session = {
      id: crypto.randomUUID(),
      student_id: id,
      assessment_id: assessment?.id,
      date: new Date().toISOString().split('T')[0],
      ses_number: sesNum + 1,
      length_minutes: sessionLength,
      ufli_unit_covered: plan?.ufli_focus_unit || null,
      tutor_notes: '',
      what_went_well: '',
      what_needs_more_work: '',
      homework_assigned: false,
      parent_email_sent: false,
      created_at: new Date().toISOString()
    }
    saveSession(session)
    setPlan(null)
  }

  if (!student || !assessment) {
    return <p className="text-center text-gray-400 py-20">Upload an assessment first.</p>
  }

  if (loading) return <LoadingState messages={['🗓️ Building your session plan...', '🎯 Selecting activities...', '📘 Matching to UFLI scope...']} />

  const inputClass = 'w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'

  return (
    <div className="space-y-8">
      {/* ── PLAN GENERATOR ── */}
      {!plan ? (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="text-2xl font-black text-black tracking-tight">🗓️ Plan Next Session</h2>
            <p className="text-sm text-gray-400 font-semibold mt-0.5">{student.name} &middot; Session {allSessions.length + 1}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-black mb-1">Session Length</label>
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
            <label className="block text-sm font-bold text-black mb-1">Notes from Last Session (optional)</label>
            <textarea className={inputClass + ' h-20'} value={lastNotes} onChange={e => setLastNotes(e.target.value)} placeholder="Anything to carry forward..." />
          </div>

          {error && <div className="rounded-xl bg-[var(--red-light)] p-3 text-sm text-[var(--red)] font-bold">{error}</div>}
        </div>
      ) : (
        <div className="space-y-5">
          <h2 className="text-2xl font-black text-black tracking-tight">🗓️ Session Plan</h2>

          {/* Goal */}
          <div className="bg-[var(--primary-light)] rounded-2xl border-2 border-[var(--primary)] p-5">
            <p className="text-sm font-black text-[var(--primary)]">🎯 Session Goal</p>
            <p className="text-sm text-gray-800 mt-1 font-medium">{plan.session_goal}</p>
            <span className="text-xs bg-white text-[var(--primary)] px-2.5 py-0.5 rounded-full font-bold mt-2 inline-block">📘 Unit {plan.ufli_focus_unit} — {plan.ufli_focus_unit_name}</span>
          </div>

          {/* Blocks */}
          <div className="space-y-3">
            {plan.blocks.map((block, i) => (
              <div key={i} className={`bg-white rounded-2xl border-2 border-gray-100 border-l-4 ${blockColors[block.type] || 'border-l-gray-300'} p-5`}>
                <div className="flex justify-between items-start mb-2">
                  <p className="font-black text-black text-sm">{blockEmoji[block.type] || '📌'} {block.name}</p>
                  <span className="text-xs text-gray-400 font-bold shrink-0 ml-2 bg-gray-50 px-2 py-0.5 rounded-full">{block.time_start}–{block.time_end}</span>
                </div>
                <ul className="space-y-1 mb-2">
                  {(Array.isArray(block.what_to_do) ? block.what_to_do : [block.what_to_do]).map((step, j) => (
                    <li key={j} className="text-sm text-gray-700 flex gap-2"><span className="text-gray-300">&bull;</span><span>{step}</span></li>
                  ))}
                </ul>
                {block.example_words_or_prompts?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {block.example_words_or_prompts.map((w, j) => (
                      <span key={j} className="text-xs bg-[var(--blue-light)] text-[var(--blue)] px-2 py-0.5 rounded-full font-bold">{w}</span>
                    ))}
                  </div>
                )}
                {block.materials_needed?.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2 font-semibold">📦 {block.materials_needed.join(', ')}</p>
                )}
                {block.watch_for && (
                  <p className="text-xs text-[var(--orange)] mt-1.5 font-bold">⚠️ {block.watch_for}</p>
                )}
              </div>
            ))}
          </div>

          {/* Prep Checklist */}
          {plan.prep_checklist?.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
              <h3 className="font-black text-black text-sm mb-2">✅ Prep Checklist</h3>
              <ul className="space-y-1.5">
                {plan.prep_checklist.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2 items-center">
                    <input type="checkbox" className="w-4 h-4 accent-[var(--primary)] rounded" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tutor Reminder */}
          {plan.tutor_reminder && (
            <div className="bg-[var(--gold-light)] rounded-2xl border-2 border-yellow-300 p-5">
              <p className="text-sm font-black text-[var(--orange)]">💡 Tutor Reminder</p>
              <p className="text-sm text-gray-800 mt-1">{plan.tutor_reminder}</p>
            </div>
          )}

          {/* Actions */}
          <div className="action-buttons flex gap-3">
            <button onClick={() => window.print()} className="flex-1 bg-white border-2 border-gray-100 py-3.5 rounded-full font-bold text-black hover:border-[var(--primary)] transition">
              🖨️ Print
            </button>
            <button onClick={handleSaveSession} className="flex-1 bg-[var(--primary)] text-white py-3.5 rounded-full font-bold hover:bg-[var(--primary-hover)] transition shadow-sm">
              ✓ Save Session
            </button>
          </div>
        </div>
      )}

      {/* ── PAST SESSIONS ── */}
      <div>
        <h2 className="text-xl font-black text-black tracking-tight mb-4">📚 Past Sessions</h2>

        {allSessions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-gray-100">
            <span className="text-4xl block mb-2">🗓️</span>
            <p className="text-gray-400 font-bold">No sessions yet</p>
            <p className="text-gray-400 text-sm">Generate your first plan above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allSessions.map(session => {
              const isExpanded = expandedSession === session.id
              const sessionAssessment = getAssessmentForSession(session)
              const sessionAnalysis = sessionAssessment?.ai_analysis || getLatestAnalysis(id)?.ai_analysis

              return (
                <div key={session.id} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden transition-all">
                  {/* Tile header — always visible */}
                  <button
                    onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                    className="w-full p-5 text-left flex items-center gap-4 hover:bg-gray-50 transition"
                  >
                    {/* Session number badge */}
                    <div className="bg-[var(--primary-light)] text-[var(--primary)] w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-lg font-black">{session.ses_number}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-black">Session {session.ses_number}</p>
                      <p className="text-xs text-gray-400 font-semibold">{session.date} &middot; {session.length_minutes} min</p>
                    </div>

                    {/* Badges */}
                    <div className="flex gap-2 items-center shrink-0">
                      {session.ufli_unit_covered && (
                        <span className="text-[10px] bg-[var(--blue-light)] text-[var(--blue)] px-2 py-0.5 rounded-full font-bold">📘 Unit {session.ufli_unit_covered}</span>
                      )}
                      {session.homework_assigned && (
                        <span className="text-[10px] bg-[var(--green-light)] text-[var(--green)] px-2 py-0.5 rounded-full font-bold">✏️ HW</span>
                      )}
                      {session.parent_email_sent && (
                        <span className="text-[10px] bg-[var(--primary-light)] text-[var(--primary)] px-2 py-0.5 rounded-full font-bold">✉️ Email</span>
                      )}
                      <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                      {/* Notes */}
                      {session.tutor_notes && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">📝 Session Notes</p>
                          <p className="text-sm text-gray-700">{session.tutor_notes}</p>
                        </div>
                      )}

                      {session.what_went_well && (
                        <div className="bg-[var(--green-light)] rounded-xl p-3">
                          <p className="text-xs font-bold text-[var(--green)] mb-1">💪 What Went Well</p>
                          <p className="text-sm text-gray-800">{session.what_went_well}</p>
                        </div>
                      )}

                      {session.what_needs_more_work && (
                        <div className="bg-[var(--orange-light)] rounded-xl p-3">
                          <p className="text-xs font-bold text-[var(--orange)] mb-1">🎯 Needs More Work</p>
                          <p className="text-sm text-gray-800">{session.what_needs_more_work}</p>
                        </div>
                      )}

                      {/* Assessment snapshot if linked */}
                      {sessionAnalysis && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">📊 Assessment Snapshot</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs bg-[var(--blue-light)] text-[var(--blue)] px-2.5 py-0.5 rounded-full font-bold">📖 {sessionAnalysis.passage_level_reached}</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold" style={{
                              background: sessionAnalysis.fluency_estimate_pct >= 80 ? 'var(--green-light)' : sessionAnalysis.fluency_estimate_pct >= 50 ? 'var(--orange-light)' : 'var(--red-light)',
                              color: sessionAnalysis.fluency_estimate_pct >= 80 ? 'var(--green)' : sessionAnalysis.fluency_estimate_pct >= 50 ? 'var(--orange)' : 'var(--red)'
                            }}>🎯 {sessionAnalysis.fluency_estimate_pct}% fluency</span>
                            {sessionAnalysis.ufli_placement && (
                              <span className="text-xs bg-[var(--primary-light)] text-[var(--primary)] px-2.5 py-0.5 rounded-full font-bold">📘 Unit {sessionAnalysis.ufli_placement.current_working_unit}</span>
                            )}
                          </div>
                          {sessionAnalysis.strengths?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Strengths</p>
                              <ul className="space-y-0.5">
                                {sessionAnalysis.strengths.map((s, i) => (
                                  <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-[var(--green)]">✓</span>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {sessionAnalysis.priority_gaps?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Focus Areas</p>
                              <ul className="space-y-0.5">
                                {sessionAnalysis.priority_gaps.map((g, i) => (
                                  <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-[var(--red)]">●</span><span className="font-semibold">{g.gap}</span></li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Empty state if no notes at all */}
                      {!session.tutor_notes && !session.what_went_well && !session.what_needs_more_work && !sessionAnalysis && (
                        <p className="text-sm text-gray-400 text-center py-4">No notes recorded for this session.</p>
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
