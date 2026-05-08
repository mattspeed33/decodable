import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { getStudent, getLatestAssessment, saveEmail, getLatestSession } from '../lib/storage'
import { runPrompt } from '../lib/claude'
import { emailPrompt } from '../prompts/emailPrompt'
import { bundleForEmail } from '../lib/dataHelpers'
import LoadingState from '../components/LoadingState.jsx'

export default function ParentEmail({ studentId }) {
  const params = useParams()
  const id = studentId || params.id
  const student = getStudent(id)
  const assessment = getLatestAssessment(id)
  const lastSession = getLatestSession(id)

  const [notes, setNotes] = useState('')
  const [email, setEmail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const bundle = bundleForEmail(id, notes)
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
    const subject = encodeURIComponent(email.subject)
    const body = encodeURIComponent(email.body)
    window.open(`mailto:${student.parent_email}?subject=${subject}&body=${body}`)
  }

  function handleSave() {
    const record = {
      id: crypto.randomUUID(),
      student_id: id,
      session_number: lastSession?.ses_number || 1,
      date_sent: new Date().toISOString().split('T')[0],
      subject: email.subject,
      body: email.body,
      summary_for_next_prompt: `Session ${lastSession?.ses_number || 1}: ${notes || 'General session update'}`,
      created_at: new Date().toISOString()
    }
    saveEmail(record)
    setSaved(true)
  }

  if (!student || !assessment) {
    return <p className="text-center text-gray-400 py-20">Upload an assessment first.</p>
  }

  if (loading) return <LoadingState messages={['Drafting the parent email...', 'Translating to parent-friendly language...', 'Polishing the tone...']} />

  const inputClass = 'w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'

  if (!email) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-black text-black tracking-tight">Parent Email</h2>
        <p className="text-sm text-gray-500">{student.name} &rarr; {student.parent_name || 'Parent'}</p>

        <div>
          <label className="block text-sm font-bold text-black mb-1">Any specific wins or notes from today (optional)</label>
          <textarea className={inputClass + ' h-24'} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        {error && <div className="rounded-2xl border-2 border-gray-100 p-4 text-sm text-red-600">{error}</div>}

        <button onClick={handleGenerate} className="w-full bg-[var(--primary)] text-white py-3 rounded-full font-semibold hover:bg-[var(--primary-hover)] transition">
          Draft Email
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h2 className="text-3xl font-black text-black tracking-tight">Parent Email</h2>

      <div className="rounded-2xl border-2 border-gray-100 p-6">
        <p className="font-bold text-black mb-3">Subject: {email.subject}</p>
        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{email.body}</div>
      </div>

      {email.tutor_note && (
        <div className="tutor-note-private rounded-2xl border-2 border-gray-100 bg-pink-50 p-5">
          <p className="text-xs font-bold text-black mb-1">Tutor Note (private)</p>
          <p className="text-sm text-gray-700">{email.tutor_note}</p>
        </div>
      )}

      <div className="action-buttons space-y-3">
        <button onClick={handleCopy} className="w-full bg-[var(--primary)] text-white py-3 rounded-full font-semibold hover:bg-[var(--primary-hover)] transition">
          {copied ? 'Copied!' : 'Copy Email'}
        </button>
        {student.parent_email && (
          <button onClick={handleMailto} className="w-full bg-white border-2 border-gray-100 py-3 rounded-full font-semibold text-black hover:border-black transition">
            Open in Mail
          </button>
        )}
        <div className="flex gap-3">
          <button onClick={handleGenerate} className="flex-1 bg-white border-2 border-gray-100 py-3 rounded-full font-semibold text-black hover:border-black transition">
            Regenerate
          </button>
          <button
            onClick={handleSave}
            disabled={saved}
            className="flex-1 bg-white border-2 border-gray-100 py-3 rounded-full font-semibold text-black hover:border-black transition disabled:opacity-40"
          >
            {saved ? 'Saved!' : 'Save to Log'}
          </button>
        </div>
      </div>
    </div>
  )
}
