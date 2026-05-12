import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudent, getLatestAssessment, getLatestSession, getEmailLog, getHomeworkSheets, saveEmail } from '../../lib/storage'
import { useAsync } from '../../lib/useAsync'
import { runPrompt } from '../../lib/claude'
import { emailPrompt } from '../../prompts/emailPrompt'
import { bundleForEmail } from '../../lib/dataHelpers'
import LoadingState from '../../components/LoadingState.jsx'

export default function ParentHubTab({ studentId }) {
  const navigate = useNavigate()
  const { data: student } = useAsync(() => getStudent(studentId), [studentId])
  const { data: assessment } = useAsync(() => getLatestAssessment(studentId), [studentId])
  const { data: lastSession } = useAsync(() => getLatestSession(studentId), [studentId])
  const { data: emails = [], refresh: refreshEmails } = useAsync(() => getEmailLog(studentId), [studentId])
  const { data: homework = [] } = useAsync(() => getHomeworkSheets(studentId), [studentId])

  const [section, setSection] = useState('email')
  const [notes, setNotes] = useState('')
  const [email, setEmail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [savedEmail, setSavedEmail] = useState(false)
  const [expandedEmail, setExpandedEmail] = useState(null)

  async function handleDraftEmail() {
    setLoading(true)
    setError(null)
    try {
      const bundle = await bundleForEmail(studentId, notes)
      const result = await runPrompt({ systemPrompt: emailPrompt, userMessage: bundle })
      setEmail(JSON.parse(result))
    } catch (err) {
      setError(err.message || 'Failed to generate email.')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleMailto() {
    window.open(`mailto:${student.parent_email}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`)
  }

  async function handleSaveEmail() {
    await saveEmail({
      id: crypto.randomUUID(),
      student_id: studentId,
      session_number: lastSession?.ses_number || 1,
      date_sent: new Date().toISOString().split('T')[0],
      subject: email.subject,
      body: email.body,
      summary_for_next_prompt: `Session ${lastSession?.ses_number || 1}: ${notes || 'General session update'}`,
      created_at: new Date().toISOString()
    })
    setSavedEmail(true)
    refreshEmails()
  }

  if (!student || !assessment) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border-2 border-gray-100">
        <span className="text-4xl block mb-2">📸</span>
        <p className="text-gray-400 font-bold">Upload an assessment first</p>
      </div>
    )
  }

  const inputClass = 'w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white'

  return (
    <div className="space-y-5">
      {/* Parent info header */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-4 flex items-center gap-3">
        <span className="text-2xl">👨‍👧</span>
        <div>
          <p className="font-bold text-black text-sm">{student.parent_name || 'Parent'}</p>
          <p className="text-xs text-gray-400">{student.parent_email || 'No email on file'}</p>
        </div>
      </div>

      {/* Section toggle */}
      <div className="flex gap-1 rounded-2xl bg-white border-2 border-gray-100 p-1.5">
        <button
          onClick={() => setSection('email')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${section === 'email' ? 'bg-[var(--primary)] text-white' : 'text-gray-400 hover:text-black'}`}
        >
          ✉️ Emails ({emails.length})
        </button>
        <button
          onClick={() => setSection('homework')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${section === 'homework' ? 'bg-[var(--primary)] text-white' : 'text-gray-400 hover:text-black'}`}
        >
          ✏️ Homework ({homework.length})
        </button>
      </div>

      {/* ── EMAIL SECTION ── */}
      {section === 'email' && (
        <div className="space-y-4">
          {loading ? (
            <LoadingState messages={['✉️ Drafting email...', '💬 Polishing the tone...']} />
          ) : !email ? (
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 space-y-4">
              <h3 className="font-black text-black">✉️ Draft Progress Email</h3>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Wins or notes from today (optional)</label>
                <textarea className={inputClass + ' h-20'} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything specific to highlight..." />
              </div>
              {error && <div className="rounded-xl bg-[var(--red-light)] p-3 text-sm text-[var(--red)] font-bold">{error}</div>}
              <button onClick={handleDraftEmail} className="w-full bg-[var(--primary)] text-white py-3 rounded-full font-bold hover:bg-[var(--primary-hover)] transition shadow-sm">
                Draft Email
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
                <p className="font-bold text-black mb-3">Subject: {email.subject}</p>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{email.body}</div>
              </div>

              {email.tutor_note && (
                <div className="bg-[var(--gold-light)] rounded-2xl border-2 border-yellow-300 p-4">
                  <p className="text-[10px] font-bold text-[var(--orange)] uppercase tracking-wide">Tutor note (private)</p>
                  <p className="text-sm text-gray-700 mt-1">{email.tutor_note}</p>
                </div>
              )}

              <div className="flex gap-2.5 flex-wrap">
                <button onClick={handleCopy} className="flex-1 bg-[var(--primary)] text-white py-3 rounded-full font-bold hover:bg-[var(--primary-hover)] transition shadow-sm">
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
                {student.parent_email && (
                  <button onClick={handleMailto} className="flex-1 bg-white border-2 border-gray-100 py-3 rounded-full font-bold text-black hover:border-[var(--primary)] transition">
                    ✉️ Open in Mail
                  </button>
                )}
                <button onClick={handleSaveEmail} disabled={savedEmail} className="bg-white border-2 border-gray-100 py-3 px-5 rounded-full font-bold text-black hover:border-[var(--primary)] transition disabled:opacity-40">
                  {savedEmail ? '✓ Saved' : '💾 Save'}
                </button>
                <button onClick={() => { setEmail(null); setSavedEmail(false) }} className="bg-white border-2 border-gray-100 py-3 px-5 rounded-full font-bold text-gray-400 hover:border-[var(--primary)] hover:text-black transition">
                  ↻ Redo
                </button>
              </div>
            </div>
          )}

          {/* Email history */}
          {emails.length > 0 && (
            <div>
              <h3 className="font-black text-black text-sm mb-3">📬 Sent Emails</h3>
              <div className="space-y-2">
                {emails.map(e => (
                  <div key={e.id} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
                    <button
                      onClick={() => setExpandedEmail(expandedEmail === e.id ? null : e.id)}
                      className="w-full p-4 text-left flex items-center gap-3 hover:bg-gray-50 transition"
                    >
                      <span className="text-lg">✉️</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-black text-sm truncate">{e.subject}</p>
                        <p className="text-[11px] text-gray-400 font-semibold">{e.date_sent} &middot; Session {e.session_number}</p>
                      </div>
                      <span className={`text-gray-300 transition-transform ${expandedEmail === e.id ? 'rotate-180' : ''}`}>▾</span>
                    </button>
                    {expandedEmail === e.id && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{e.body}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HOMEWORK SECTION ── */}
      {section === 'homework' && (
        <div className="space-y-4">
          <button
            onClick={() => navigate(`/students/${studentId}/homework/new`)}
            className="w-full bg-[var(--primary)] text-white py-3.5 rounded-full font-bold hover:bg-[var(--primary-hover)] transition shadow-sm"
          >
            ✏️ Generate New Homework
          </button>

          {homework.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border-2 border-gray-100">
              <span className="text-3xl block mb-2">✏️</span>
              <p className="text-gray-400 font-bold text-sm">No homework assigned yet</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {homework.map(hw => (
                <button
                  key={hw.id}
                  onClick={() => navigate(`/students/${studentId}/homework/${hw.id}`)}
                  className="w-full bg-white rounded-2xl border-2 border-gray-100 p-4 text-left flex items-center gap-3 hover:border-[var(--primary)] transition"
                >
                  <span className="text-lg">📝</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-black text-sm">{hw.skill_focus || 'Homework'}</p>
                    <p className="text-[11px] text-gray-400 font-semibold">Week of {hw.week_of} &middot; {hw.activities?.length || 0} activities</p>
                  </div>
                  <span className="text-gray-300">→</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
