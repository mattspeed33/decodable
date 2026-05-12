import { useState } from 'react'
import { Mail, Sparkles, Copy, Send, RotateCcw, Save, X } from 'lucide-react'
import { getStudent, getLatestAssessment, getLatestSession, getEmailLog, saveEmail } from '../../lib/storage'
import { useAsync } from '../../lib/useAsync'
import { runPrompt } from '../../lib/claude'
import { emailPrompt } from '../../prompts/emailPrompt'
import { bundleForEmail } from '../../lib/dataHelpers'
import LoadingState from '../../components/LoadingState.jsx'
import { BtnPrimary, BtnSecondary } from '../../components/v4/primitives.jsx'

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '')
}

// Stable color per name so a parent's avatar doesn't reshuffle on rerender.
const AVATAR_BGS = [
  ['#ede9fe', '#7c3aed'], // purple
  ['#dbeafe', '#2563eb'], // blue
  ['#dcfce7', '#16a34a'], // green
  ['#fef3c7', '#d97706'], // amber
  ['#ccfbf1', '#0d9488'], // teal
  ['#fee2e2', '#dc2626'], // red
]
function avatarColors(seed) {
  if (!seed) return AVATAR_BGS[0]
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_BGS[h % AVATAR_BGS.length]
}

function relativeDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })
}

function snippet(body, max = 140) {
  if (!body) return ''
  const clean = body.replace(/\s+/g, ' ').trim()
  return clean.length > max ? clean.slice(0, max) + '…' : clean
}

export default function ParentHubTab({ studentId }) {
  const { data: student } = useAsync(() => getStudent(studentId), [studentId])
  const { data: assessment } = useAsync(() => getLatestAssessment(studentId), [studentId])
  const { data: lastSession } = useAsync(() => getLatestSession(studentId), [studentId])
  const { data: emails = [], refresh: refreshEmails } = useAsync(() => getEmailLog(studentId), [studentId])

  const [composing, setComposing] = useState(false)
  const [notes, setNotes] = useState('')
  const [draft, setDraft] = useState(null) // generated email object { subject, body, tutor_note }
  const [drafting, setDrafting] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [savedDraft, setSavedDraft] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  async function handleDraft() {
    setDrafting(true)
    setError(null)
    try {
      const bundle = await bundleForEmail(studentId, notes)
      const result = await runPrompt({ systemPrompt: emailPrompt, userMessage: bundle })
      setDraft(JSON.parse(result))
    } catch (err) {
      setError(err.message || 'Failed to generate email.')
    } finally {
      setDrafting(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleMailto() {
    window.open(`mailto:${student.parent_email}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`)
  }

  async function handleSaveDraft() {
    await saveEmail({
      id: crypto.randomUUID(),
      student_id: studentId,
      session_number: lastSession?.ses_number || 1,
      date_sent: new Date().toISOString().split('T')[0],
      subject: draft.subject,
      body: draft.body,
      summary_for_next_prompt: `Session ${lastSession?.ses_number || 1}: ${notes || 'General session update'}`,
      created_at: new Date().toISOString(),
    })
    setSavedDraft(true)
    refreshEmails()
  }

  function closeDraft() {
    setComposing(false)
    setDraft(null)
    setNotes('')
    setSavedDraft(false)
    setError(null)
  }

  if (!student || !assessment) {
    return (
      <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] px-4 py-12 text-center">
        <Mail className="w-6 h-6 mx-auto mb-2 text-[var(--v4-ink-3)]" />
        <p className="text-[13px] font-medium text-[var(--v4-ink-2)]">Upload an assessment first</p>
        <p className="text-[12px] text-[var(--v4-ink-3)] mt-0.5">Email drafts use the analysis to personalize.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-baseline justify-between">
        <h3 className="text-[15px] font-bold text-[var(--v4-ink)]">Emails</h3>
        <div className="flex items-center gap-2">
          <span className="text-[11.5px] text-[var(--v4-ink-3)]">
            {student.parent_email || 'No parent email on file'}
          </span>
          {!composing && !draft && (
            <BtnPrimary onClick={() => setComposing(true)}>
              <Sparkles className="w-3.5 h-3.5" /> Draft Email
            </BtnPrimary>
          )}
        </div>
      </div>

      {/* COMPOSE / DRAFT */}
      {composing && !draft && (
        <DraftCard
          notes={notes}
          setNotes={setNotes}
          onGenerate={handleDraft}
          onCancel={closeDraft}
          loading={drafting}
          error={error}
        />
      )}

      {drafting && <LoadingState messages={['✉️ Drafting email...', '💬 Polishing the tone...']} />}

      {draft && (
        <GeneratedDraftCard
          email={draft}
          parentEmail={student.parent_email}
          copied={copied}
          saved={savedDraft}
          onCopy={handleCopy}
          onMailto={handleMailto}
          onSave={handleSaveDraft}
          onRegen={() => { setDraft(null); handleDraft() }}
          onClose={closeDraft}
        />
      )}

      {/* EMAIL LIST */}
      {emails.length === 0 && !composing && !draft ? (
        <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] px-4 py-10 text-center">
          <Mail className="w-5 h-5 mx-auto mb-2 text-[var(--v4-ink-3)]" />
          <p className="text-[13px] font-medium text-[var(--v4-ink-2)]">No sent emails yet</p>
          <p className="text-[12px] text-[var(--v4-ink-3)] mt-0.5">Click Draft Email above to compose the first one.</p>
        </div>
      ) : (
        <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] overflow-hidden">
          {emails.map((e, i) => (
            <EmailRow
              key={e.id}
              email={e}
              parent={student.parent_name}
              parentEmail={student.parent_email}
              expanded={expandedId === e.id}
              onToggle={() => setExpandedId(expandedId === e.id ? null : e.id)}
              isLast={i === emails.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── EMAIL ROW (Attio-style) ─────────────────────────────────────────────────

function EmailRow({ email, parent, parentEmail, expanded, onToggle, isLast }) {
  const [bg, fg] = avatarColors(parent || 'Parent')
  return (
    <div className={`${isLast ? '' : 'border-b border-[var(--v4-border)]'}`}>
      <button
        onClick={onToggle}
        className="w-full grid items-start gap-3 px-4 py-3 text-left hover:bg-[var(--v4-surface-2)] transition-colors"
        style={{ gridTemplateColumns: '32px 1fr auto' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 mt-0.5"
          style={{ background: bg, color: fg }}
        >
          {initials(parent)}
        </div>
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold text-[var(--v4-ink)] truncate">{email.subject || 'Untitled'}</div>
          <div className="text-[11.5px] text-[var(--v4-ink-3)] truncate mt-0.5">
            {parent || 'Parent'}{parentEmail ? ` · ${parentEmail}` : ''}
          </div>
          <div className="text-[12px] text-[var(--v4-ink-2)] truncate mt-1 flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-[var(--v4-ink-3)] shrink-0" />
            <span className="truncate">{snippet(email.body, 110)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          {email.session_number && (
            <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded bg-[var(--v4-purple-lt)] text-[var(--v4-purple)]">
              S{email.session_number}
            </span>
          )}
          <span className="text-[11.5px] text-[var(--v4-ink-3)] whitespace-nowrap">{relativeDate(email.date_sent)}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pl-[60px] border-t border-[var(--v4-border)] bg-[var(--v4-surface-2)]">
          <div className="text-[13px] text-[var(--v4-ink)] whitespace-pre-wrap leading-relaxed mt-3">
            {email.body}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DRAFT / GENERATE CARDS ──────────────────────────────────────────────────

function DraftCard({ notes, setNotes, onGenerate, onCancel, error }) {
  return (
    <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-[var(--v4-ink)]">Draft Progress Email</p>
        <button onClick={onCancel} className="text-[var(--v4-ink-3)] hover:text-[var(--v4-ink)]">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div>
        <label className="block text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-1">
          Wins or notes from today (optional)
        </label>
        <textarea
          className="w-full border border-[var(--v4-border)] rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--v4-ink)] bg-[var(--v4-surface)] h-20 resize-none"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Anything specific to highlight…"
        />
      </div>
      {error && (
        <div className="rounded-md bg-[var(--v4-red-lt)] px-3 py-2 text-[12px] text-[var(--v4-red)] font-medium">{error}</div>
      )}
      <BtnPrimary onClick={onGenerate} className="w-full justify-center py-2">
        <Sparkles className="w-3.5 h-3.5" /> Generate Draft
      </BtnPrimary>
    </div>
  )
}

function GeneratedDraftCard({ email, parentEmail, copied, saved, onCopy, onMailto, onSave, onRegen, onClose }) {
  return (
    <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--v4-border)] flex items-center justify-between bg-[var(--v4-surface-2)]">
        <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px]">Draft</p>
        <button onClick={onClose} className="text-[var(--v4-ink-3)] hover:text-[var(--v4-ink)]">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="px-4 py-4 space-y-2">
        <p className="text-[14px] font-semibold text-[var(--v4-ink)]">{email.subject}</p>
        <div className="text-[13px] text-[var(--v4-ink-2)] whitespace-pre-wrap leading-relaxed">{email.body}</div>
        {email.tutor_note && (
          <div className="mt-3 bg-[var(--v4-amber-lt)] rounded-md p-3">
            <p className="text-[10px] font-bold text-[var(--v4-amber)] uppercase tracking-[0.6px]">Tutor note (private)</p>
            <p className="text-[12.5px] text-[var(--v4-ink-2)] mt-1">{email.tutor_note}</p>
          </div>
        )}
      </div>
      <div className="px-4 py-3 border-t border-[var(--v4-border)] flex items-center gap-2 flex-wrap">
        <BtnPrimary onClick={onCopy}>
          <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied' : 'Copy'}
        </BtnPrimary>
        {parentEmail && (
          <BtnSecondary onClick={onMailto}>
            <Send className="w-3.5 h-3.5" /> Open in Mail
          </BtnSecondary>
        )}
        <BtnSecondary onClick={onSave} disabled={saved} className={saved ? 'opacity-50' : ''}>
          <Save className="w-3.5 h-3.5" /> {saved ? 'Saved' : 'Save'}
        </BtnSecondary>
        <BtnSecondary onClick={onRegen} className="ml-auto">
          <RotateCcw className="w-3.5 h-3.5" /> Redo
        </BtnSecondary>
      </div>
    </div>
  )
}
