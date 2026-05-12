import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Printer, RefreshCw, Save } from 'lucide-react'
import { getStudent, getLatestAssessment, saveHomeworkSheet } from '../lib/storage'
import { useAsync } from '../lib/useAsync'
import { runPrompt } from '../lib/claude'
import { homeworkPrompt } from '../prompts/homeworkPrompt'
import { bundleForHomework } from '../lib/dataHelpers'
import LoadingState from '../components/LoadingState.jsx'
import { BtnPrimary, BtnSecondary, Card } from '../components/v4/primitives.jsx'

export default function HomeworkSheet() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: student, loading: l1 } = useAsync(() => getStudent(id), [id])
  const { data: assessment, loading: l2 } = useAsync(() => getLatestAssessment(id), [id])

  const [sheet, setSheet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [view, setView] = useState('worksheet')

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const bundle = await bundleForHomework(id)
      const result = await runPrompt({ systemPrompt: homeworkPrompt, userMessage: bundle })
      setSheet(JSON.parse(result))
      setSaved(false)
    } catch (err) {
      setError(err.message || 'Failed to generate homework.')
    } finally {
      setLoading(false)
    }
  }

  // Fire AI generation once both student + assessment are loaded. Ref guard
  // prevents StrictMode double-fire (which would cost a second API call).
  const generatedRef = useRef(false)
  useEffect(() => {
    if (generatedRef.current) return
    if (!student || !assessment) return
    generatedRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, assessment])

  if (l1 || l2) {
    return <p className="text-center text-gray-400 py-20 text-sm font-bold">Loading…</p>
  }

  if (!student || !assessment) {
    return <p className="text-center text-gray-400 py-20">Upload an assessment first.</p>
  }

  if (loading) return <LoadingState messages={['✏️ Creating the worksheet...', '👨‍👧 Writing parent activities...', '📚 Finding a great book...']} />

  if (error) {
    return (
      <div className="max-w-3xl space-y-3">
        <div className="rounded-md bg-[var(--v4-red-lt)] px-3 py-2 text-[12.5px] text-[var(--v4-red)] font-medium">{error}</div>
        <BtnPrimary onClick={generate} className="w-full justify-center py-2.5">Retry</BtnPrimary>
      </div>
    )
  }

  if (!sheet) return null

  async function saveAssignment() {
    const record = {
      id: crypto.randomUUID(),
      student_id: id,
      assessment_id: assessment?.id || null,
      created_at: new Date().toISOString(),
      assigned_at: new Date().toISOString(),
      week_of: sheet.week_of,
      student_name: sheet.student_name || student.name,
      skill_focus: sheet.skill_focus,
      worksheet: sheet.worksheet || null,
      activities: sheet.parent_activities || sheet.activities || [],
      tutor_note_to_parent: sheet.tutor_note_to_parent || '',
      book_recommendation: sheet.book_recommendation || null,
    }
    await saveHomeworkSheet(record)
    setSaved(true)
    navigate(`/students/${id}/homework/${record.id}`)
  }

  const ws = sheet.worksheet

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-[22px] font-bold text-[var(--v4-ink)] tracking-[-0.5px]">Homework</h2>
        <p className="text-[12.5px] text-[var(--v4-ink-3)] mt-0.5">{sheet.student_name || student.name} · Week of {sheet.week_of}</p>
        {sheet.skill_focus && (
          <p className="text-[13px] font-semibold text-[var(--v4-ink)] mt-1">Skill: {sheet.skill_focus}</p>
        )}
      </div>

      {/* View toggle */}
      <div className="inline-flex rounded-md bg-[var(--v4-surface-3)] p-0.5">
        <button
          onClick={() => setView('worksheet')}
          className={`px-3 py-1.5 rounded-[5px] text-[12.5px] font-semibold transition ${view === 'worksheet' ? 'bg-[var(--v4-surface)] text-[var(--v4-ink)] shadow-sm' : 'text-[var(--v4-ink-3)] hover:text-[var(--v4-ink)]'}`}
        >
          Kid Worksheet
        </button>
        <button
          onClick={() => setView('activities')}
          className={`px-3 py-1.5 rounded-[5px] text-[12.5px] font-semibold transition ${view === 'activities' ? 'bg-[var(--v4-surface)] text-[var(--v4-ink)] shadow-sm' : 'text-[var(--v4-ink-3)] hover:text-[var(--v4-ink)]'}`}
        >
          Parent Activities
        </button>
      </div>

      {/* WORKSHEET VIEW */}
      {view === 'worksheet' && ws && (
        <div className="homework-sheet">
          <Card padding="p-7" className="space-y-5">
            <div className="text-center border-b border-dashed border-[var(--v4-border-2)] pb-3">
              <h3 className="text-[20px] font-bold text-[var(--v4-ink)] tracking-[-0.3px]">{ws.title}</h3>
              <p className="text-[12px] text-[var(--v4-ink-3)] mt-1">Name: __________________ &nbsp;&nbsp; Date: __________________</p>
            </div>

            <div className="bg-[var(--v4-purple-lt)] rounded-md p-3">
              <p className="text-[11.5px] font-semibold text-[var(--v4-purple)] uppercase tracking-[0.6px]">Directions</p>
              <p className="text-[13px] text-[var(--v4-ink-2)] mt-0.5">{ws.directions}</p>
            </div>

            {ws.word_bank?.length > 0 && (
              <div className="bg-[var(--v4-blue-lt)] rounded-md p-3">
                <p className="text-[11.5px] font-semibold text-[var(--v4-blue)] uppercase tracking-[0.6px] mb-2">Word bank</p>
                <div className="flex flex-wrap gap-1.5">
                  {ws.word_bank.map((w, i) => (
                    <span key={i} className="text-[13px] font-semibold text-[var(--v4-ink)] bg-white px-2.5 py-0.5 rounded border border-[var(--v4-border)]">{w}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {ws.items?.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="bg-[var(--v4-ink)] text-white w-6 h-6 rounded-md flex items-center justify-center shrink-0 font-bold text-[12px]">{item.number}</span>
                  <div className="flex-1">
                    <p className="text-[13px] text-[var(--v4-ink-2)] font-medium">{item.prompt}</p>
                    <div className="mt-2 border-b border-dotted border-[var(--v4-border-2)] w-48 h-5" />
                  </div>
                </div>
              ))}
            </div>

            {ws.bonus && (
              <div className="bg-[var(--v4-amber-lt)] rounded-md p-3 border border-dashed border-[var(--v4-amber)]">
                <p className="text-[11.5px] font-semibold text-[var(--v4-amber)] uppercase tracking-[0.6px]">Bonus challenge</p>
                <p className="text-[13px] text-[var(--v4-ink-2)] mt-0.5">{ws.bonus.prompt}</p>
                {ws.bonus.type === 'creative' && (
                  <div className="mt-2 border border-dashed border-[var(--v4-border-2)] rounded-md h-20 flex items-center justify-center">
                    <p className="text-[11px] text-[var(--v4-ink-4)] font-medium">Draw or write here</p>
                  </div>
                )}
              </div>
            )}

            <div className="text-center pt-3 border-t border-[var(--v4-border)]">
              <p className="text-[11px] text-[var(--v4-ink-3)]">Great job! Bring this back to your next session.</p>
            </div>
          </Card>
        </div>
      )}

      {view === 'worksheet' && !ws && (
        <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] px-4 py-10 text-center">
          <p className="text-[13px] font-medium text-[var(--v4-ink-2)]">No worksheet generated</p>
          <p className="text-[12px] text-[var(--v4-ink-3)] mt-0.5">Try regenerating.</p>
        </div>
      )}

      {/* PARENT ACTIVITIES VIEW */}
      {view === 'activities' && (
        <div className="space-y-3">
          {(sheet.parent_activities || sheet.activities || []).map((activity, i) => (
            <Card key={i} padding="p-4">
              <div className="flex items-start justify-between mb-1.5">
                <p className="text-[13.5px] font-semibold text-[var(--v4-ink)]">
                  Activity {activity.number}: {activity.name}
                </p>
                <span className="text-[10.5px] text-[var(--v4-ink-3)] font-semibold bg-[var(--v4-surface-3)] px-1.5 py-0.5 rounded whitespace-nowrap shrink-0 ml-2">
                  {activity.time_minutes} min
                </span>
              </div>
              {activity.skill && <p className="text-[11.5px] text-[var(--v4-ink-3)] mb-2">{activity.skill}</p>}
              {activity.materials?.length > 0 && (
                <p className="text-[11.5px] text-[var(--v4-ink-3)] mb-2">
                  <span className="font-semibold">Materials:</span> {activity.materials.join(', ')}
                </p>
              )}
              <div className="space-y-2.5">
                <div>
                  <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-1">Instructions</p>
                  <ol className="text-[13px] text-[var(--v4-ink-2)] list-decimal ml-4 space-y-1">
                    {activity.parent_instructions?.map((step, j) => <li key={j}>{step}</li>)}
                  </ol>
                </div>
                {activity.what_to_say_to_child && (
                  <div className="rounded-md bg-[var(--v4-purple-lt)] p-2.5">
                    <p className="text-[10.5px] font-semibold text-[var(--v4-purple)] uppercase tracking-[0.6px]">What to say</p>
                    <p className="text-[12.5px] text-[var(--v4-ink-2)] italic">"{activity.what_to_say_to_child}"</p>
                  </div>
                )}
                {activity.if_child_struggles && (
                  <div className="rounded-md bg-[var(--v4-amber-lt)] p-2.5">
                    <p className="text-[10.5px] font-semibold text-[var(--v4-amber)] uppercase tracking-[0.6px]">If they struggle</p>
                    <p className="text-[12.5px] text-[var(--v4-ink-2)]">{activity.if_child_struggles}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {sheet.tutor_note_to_parent && (
            <Card padding="p-4">
              <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-1">Note from tutor</p>
              <p className="text-[12.5px] text-[var(--v4-ink-2)]">{sheet.tutor_note_to_parent}</p>
            </Card>
          )}

          {sheet.book_recommendation && (
            <div className="bg-[var(--v4-green-lt)] rounded-[10px] p-4">
              <p className="text-[10.5px] font-semibold text-[var(--v4-green)] uppercase tracking-[0.6px]">Recommended reading</p>
              <p className="text-[13.5px] font-semibold text-[var(--v4-ink)] mt-1">{sheet.book_recommendation.title}</p>
              {sheet.book_recommendation.series && (
                <p className="text-[11.5px] text-[var(--v4-ink-3)]">{sheet.book_recommendation.series}</p>
              )}
              <p className="text-[12px] text-[var(--v4-ink-2)] mt-1">{sheet.book_recommendation.why}</p>
            </div>
          )}
        </div>
      )}

      {/* ACTIONS */}
      <div className="action-buttons flex items-center gap-2">
        {view === 'worksheet' && ws && (
          <BtnSecondary onClick={() => window.print()} className="py-2.5">
            <Printer className="w-3.5 h-3.5" /> Print
          </BtnSecondary>
        )}
        <BtnPrimary onClick={saveAssignment} className="flex-1 justify-center py-2.5">
          <Save className="w-3.5 h-3.5" /> {saved ? 'Saved' : 'Assign & Save'}
        </BtnPrimary>
        <BtnSecondary onClick={generate} className="py-2.5">
          <RefreshCw className="w-3.5 h-3.5" /> Redo
        </BtnSecondary>
      </div>
    </div>
  )
}
