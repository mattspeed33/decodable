import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getStudent, getLatestAssessment, saveHomeworkSheet } from '../lib/storage'
import { runPrompt } from '../lib/claude'
import { homeworkPrompt } from '../prompts/homeworkPrompt'
import { bundleForHomework } from '../lib/dataHelpers'
import LoadingState from '../components/LoadingState.jsx'

export default function HomeworkSheet() {
  const { id } = useParams()
  const navigate = useNavigate()
  const student = getStudent(id)
  const assessment = getLatestAssessment(id)

  const [sheet, setSheet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [view, setView] = useState('worksheet')

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const bundle = bundleForHomework(id)
      const result = await runPrompt({ systemPrompt: homeworkPrompt, userMessage: bundle })
      setSheet(JSON.parse(result))
      setSaved(false)
    } catch (err) {
      setError(err.message || 'Failed to generate homework.')
    } finally {
      setLoading(false)
    }
  }

  // Fire one AI generation on mount. Ref guard prevents StrictMode double-fire
  // (which would cost a second API call). Effect intentionally has no deps;
  // re-running on student/assessment change would re-generate on every render.
  const generatedRef = useRef(false)
  useEffect(() => {
    if (generatedRef.current) return
    if (!student || !assessment) return
    generatedRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!student || !assessment) {
    return <p className="text-center text-gray-400 py-20">Upload an assessment first.</p>
  }

  if (loading) return <LoadingState messages={['✏️ Creating the worksheet...', '👨‍👧 Writing parent activities...', '📚 Finding a great book...']} />

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border-2 border-red-200 bg-[var(--red-light)] p-4 text-sm text-[var(--red)] font-bold">{error}</div>
        <button onClick={generate} className="w-full bg-[var(--primary)] text-white py-3 rounded-full font-bold hover:bg-[var(--primary-hover)] transition">Retry</button>
      </div>
    )
  }

  if (!sheet) return null

  function saveAssignment() {
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
    saveHomeworkSheet(record)
    setSaved(true)
    navigate(`/students/${id}/homework/${record.id}`)
  }

  const ws = sheet.worksheet

  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-3xl font-black text-black tracking-tight">✏️ Homework</h2>
        <p className="text-sm text-gray-400 font-semibold mt-0.5">{sheet.student_name || student.name} &middot; Week of {sheet.week_of}</p>
        <p className="text-sm font-bold text-black mt-1">Skill: {sheet.skill_focus}</p>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2 rounded-2xl bg-white border-2 border-gray-100 p-2">
        <button
          onClick={() => setView('worksheet')}
          className={`flex-1 py-2 rounded-full text-sm font-bold transition ${view === 'worksheet' ? 'bg-[var(--primary)] text-white' : 'text-gray-500 hover:text-black'}`}
        >
          📝 Kid Worksheet
        </button>
        <button
          onClick={() => setView('activities')}
          className={`flex-1 py-2 rounded-full text-sm font-bold transition ${view === 'activities' ? 'bg-[var(--primary)] text-white' : 'text-gray-500 hover:text-black'}`}
        >
          👨‍👧 Parent Activities
        </button>
      </div>

      {/* ── WORKSHEET VIEW ── */}
      {view === 'worksheet' && ws && (
        <div className="homework-sheet">
          {/* Printable worksheet card */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 space-y-6">
            {/* Header */}
            <div className="text-center border-b-2 border-dashed border-gray-200 pb-4">
              <h3 className="text-2xl font-black text-black">{ws.title}</h3>
              <p className="text-sm text-gray-500 mt-1">Name: __________________ &nbsp;&nbsp; Date: __________________</p>
            </div>

            {/* Directions */}
            <div className="bg-[var(--primary-light)] rounded-xl p-4">
              <p className="text-sm font-bold text-[var(--primary)]">📋 Directions:</p>
              <p className="text-sm text-gray-800 mt-1">{ws.directions}</p>
            </div>

            {/* Word bank */}
            {ws.word_bank?.length > 0 && (
              <div className="bg-[var(--blue-light)] rounded-xl p-4">
                <p className="text-xs font-bold text-[var(--blue)] mb-2">📦 Word Bank</p>
                <div className="flex flex-wrap gap-2">
                  {ws.word_bank.map((w, i) => (
                    <span key={i} className="text-sm font-bold text-black bg-white px-3 py-1 rounded-lg border border-gray-200">{w}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Exercise items */}
            <div className="space-y-4">
              {ws.items?.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="bg-[var(--primary)] text-white w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-black text-sm">{item.number}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 font-medium">{item.prompt}</p>
                    <div className="mt-2 border-b-2 border-dotted border-gray-300 w-48 h-6" />
                  </div>
                </div>
              ))}
            </div>

            {/* Bonus */}
            {ws.bonus && (
              <div className="bg-[var(--gold-light)] rounded-xl p-4 border-2 border-dashed border-yellow-300">
                <p className="text-sm font-black text-[var(--orange)]">⭐ Bonus Challenge!</p>
                <p className="text-sm text-gray-800 mt-1">{ws.bonus.prompt}</p>
                {ws.bonus.type === 'creative' && (
                  <div className="mt-3 border-2 border-dashed border-gray-200 rounded-xl h-24 flex items-center justify-center">
                    <p className="text-xs text-gray-300 font-semibold">Draw or write here!</p>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">Great job! 🌟 Bring this back to your next session.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── WORKSHEET EMPTY STATE ── */}
      {view === 'worksheet' && !ws && (
        <div className="text-center py-12 bg-white rounded-2xl border-2 border-gray-100">
          <span className="text-4xl block mb-2">📝</span>
          <p className="text-gray-400 font-bold">No worksheet generated</p>
          <p className="text-gray-400 text-sm">Try regenerating.</p>
        </div>
      )}

      {/* ── PARENT ACTIVITIES VIEW ── */}
      {view === 'activities' && (
        <div className="space-y-4">
          {(sheet.parent_activities || sheet.activities || []).map((activity, i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-gray-100 p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-black">Activity {activity.number}: {activity.name}</h3>
                <span className="text-xs text-gray-400 shrink-0 ml-2">{activity.time_minutes} min</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">{activity.skill}</p>

              {activity.materials?.length > 0 && (
                <p className="text-xs text-gray-500 mb-3"><span className="font-semibold">📦 Materials:</span> {activity.materials.join(', ')}</p>
              )}

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-black mb-1">Instructions:</p>
                  <ol className="text-sm text-gray-700 list-decimal ml-4 space-y-1">
                    {activity.parent_instructions?.map((step, j) => (
                      <li key={j}>{step}</li>
                    ))}
                  </ol>
                </div>

                {activity.what_to_say_to_child && (
                  <div className="rounded-xl bg-[var(--primary-light)] p-3">
                    <p className="text-xs font-bold text-[var(--primary)]">💬 What to say:</p>
                    <p className="text-sm text-gray-700 italic">"{activity.what_to_say_to_child}"</p>
                  </div>
                )}

                {activity.if_child_struggles && (
                  <div className="rounded-xl bg-[var(--orange-light)] p-3">
                    <p className="text-xs font-bold text-[var(--orange)]">⚠️ If they struggle:</p>
                    <p className="text-sm text-gray-700">{activity.if_child_struggles}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {sheet.tutor_note_to_parent && (
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
              <p className="text-xs font-bold text-black mb-1">📝 Note from tutor</p>
              <p className="text-sm text-gray-700">{sheet.tutor_note_to_parent}</p>
            </div>
          )}

          {sheet.book_recommendation && (
            <div className="bg-[var(--green-light)] rounded-2xl border-2 border-green-200 p-5">
              <p className="text-xs font-bold text-[var(--green)]">📚 Recommended Reading</p>
              <p className="text-sm font-bold text-black mt-1">{sheet.book_recommendation.title}</p>
              {sheet.book_recommendation.series && (
                <p className="text-xs text-gray-500">{sheet.book_recommendation.series}</p>
              )}
              <p className="text-xs text-gray-600 mt-1">{sheet.book_recommendation.why}</p>
            </div>
          )}
        </div>
      )}

      {/* ── ACTIONS ── */}
      <div className="action-buttons flex gap-3">
        {view === 'worksheet' && ws && (
          <button onClick={() => window.print()} className="flex-1 bg-white border-2 border-gray-100 py-3.5 rounded-full font-bold text-black hover:border-[var(--primary)] transition">
            🖨️ Print Worksheet
          </button>
        )}
        <button onClick={saveAssignment} className="flex-1 bg-[var(--primary)] text-white py-3.5 rounded-full font-bold hover:bg-[var(--primary-hover)] transition shadow-sm">
          {saved ? '✓ Saved!' : '✓ Assign & Save'}
        </button>
        <button onClick={generate} className="bg-white border-2 border-gray-100 py-3.5 px-5 rounded-full font-bold text-gray-500 hover:border-[var(--primary)] hover:text-black transition">
          ↻ Redo
        </button>
      </div>
    </div>
  )
}
