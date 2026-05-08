import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudent, getAssessments, getSessions } from '../../lib/storage'
import { runPrompt, compressImage } from '../../lib/claude'
import { getAnalysisPrompt } from '../../prompts/analysisPrompt'
import PhotoUploader from '../../components/PhotoUploader.jsx'
import LoadingState from '../../components/LoadingState.jsx'

const assessmentTypes = ['Snapshot Assessment', 'Spelling Assessment', 'Decodable Reading Check', 'Teacher Notes']

export default function AssessmentsTab({ studentId }) {
  const navigate = useNavigate()
  const student = getStudent(studentId)
  const assessments = getAssessments(studentId)
  const sessions = getSessions(studentId)

  const [showUpload, setShowUpload] = useState(false)
  const [photos, setPhotos] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  function toggleType(type) {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])
  }

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    try {
      const images = await Promise.all(photos.map(p => compressImage(p.file)))
      const engagementWeeks = student.total_sessions_planned === 999 ? 4 : (student.total_sessions_planned || 4)
      const userMessage = `
Analyze this literacy assessment for ${student.name}, ${student.grade} grade, age ${student.age}.
Session type: ${student.session_type}
Engagement length: ${engagementWeeks} weeks
Assessment types included: ${selectedTypes.length > 0 ? selectedTypes.join(', ') : 'Not specified'}
Notes from parent: ${student.notes_from_parent || 'None'}
Previous sessions completed: ${sessions.length}
      `.trim()
      const result = await runPrompt({ systemPrompt: getAnalysisPrompt(engagementWeeks), userMessage, images })
      const parsed = JSON.parse(result)
      sessionStorage.setItem('decodable_pending_analysis', JSON.stringify({
        student_id: studentId,
        date: new Date().toISOString().split('T')[0],
        session_number: sessions.length + 1,
        photo_count: photos.length,
        assessment_types: selectedTypes,
        ai_analysis: parsed
      }))
      navigate(`/students/${studentId}/analysis`)
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingState />

  return (
    <div className="space-y-5">
      {/* Upload section */}
      {!showUpload ? (
        <button
          onClick={() => setShowUpload(true)}
          className="w-full bg-[var(--primary)] text-white py-3.5 rounded-full font-bold hover:bg-[var(--primary-hover)] transition shadow-sm"
        >
          📸 Upload New Assessment
        </button>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-black">📸 Upload Assessment</h3>
            <button onClick={() => { setShowUpload(false); setPhotos([]) }} className="text-xs font-bold text-gray-400 hover:text-black">Cancel</button>
          </div>

          <PhotoUploader photos={photos} setPhotos={setPhotos} />

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Assessment Types (optional)</p>
            <div className="flex flex-wrap gap-2">
              {assessmentTypes.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`text-xs px-3 py-1.5 rounded-full border-2 font-bold transition ${
                    selectedTypes.includes(type)
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                      : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="rounded-xl bg-[var(--red-light)] p-3 text-sm text-[var(--red)] font-bold">{error}</div>}

          <button
            onClick={handleAnalyze}
            disabled={photos.length === 0}
            className="w-full bg-[var(--primary)] text-white py-3 rounded-full font-bold hover:bg-[var(--primary-hover)] transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Run Analysis ({photos.length} photo{photos.length !== 1 ? 's' : ''})
          </button>
        </div>
      )}

      {/* Assessment Timeline */}
      <div>
        <h3 className="font-black text-black text-lg mb-4">📊 Assessment History</h3>

        {assessments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-gray-100">
            <span className="text-4xl block mb-2">📸</span>
            <p className="text-gray-400 font-bold">No assessments yet</p>
            <p className="text-gray-400 text-sm">Upload your first assessment above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assessments.map((assessment, idx) => {
              const a = assessment.ai_analysis
              const isExpanded = expandedId === assessment.id
              const isBaseline = idx === assessments.length - 1
              const prevAssessment = idx < assessments.length - 1 ? assessments[idx + 1] : null
              const prevA = prevAssessment?.ai_analysis

              // Growth deltas
              const fluencyDelta = prevA ? a.fluency_estimate_pct - prevA.fluency_estimate_pct : null
              const ufliDelta = prevA && a.ufli_placement && prevA.ufli_placement
                ? a.ufli_placement.current_working_unit - prevA.ufli_placement.current_working_unit
                : null

              return (
                <div key={assessment.id} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
                  {/* Header — always visible */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : assessment.id)}
                    className="w-full p-5 text-left flex items-center gap-4 hover:bg-gray-50 transition"
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBaseline ? 'bg-[var(--gold-light)] border-2 border-yellow-300' : 'bg-[var(--primary-light)]'}`}>
                        <span className="font-black text-sm" style={{ color: isBaseline ? 'var(--orange)' : 'var(--primary)' }}>
                          {assessment.session_number}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-black text-sm">
                          {isBaseline ? '⭐ Baseline Assessment' : `Assessment ${assessment.session_number}`}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 font-semibold">{assessment.date} &middot; {assessment.photo_count} photos</p>
                    </div>

                    {/* Badges + Growth */}
                    <div className="flex items-center gap-2 shrink-0">
                      {a && (
                        <>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{
                            background: a.fluency_estimate_pct >= 80 ? 'var(--green-light)' : a.fluency_estimate_pct >= 50 ? 'var(--orange-light)' : 'var(--red-light)',
                            color: a.fluency_estimate_pct >= 80 ? 'var(--green)' : a.fluency_estimate_pct >= 50 ? 'var(--orange)' : 'var(--red)'
                          }}>{a.fluency_estimate_pct}%</span>

                          {fluencyDelta !== null && fluencyDelta !== 0 && (
                            <span className={`text-[10px] font-black ${fluencyDelta > 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                              {fluencyDelta > 0 ? '↑' : '↓'}{Math.abs(fluencyDelta)}%
                            </span>
                          )}

                          {a.ufli_placement && (
                            <span className="text-[10px] bg-[var(--blue-light)] text-[var(--blue)] px-2 py-0.5 rounded-full font-bold">
                              Unit {a.ufli_placement.current_working_unit}
                            </span>
                          )}

                          {ufliDelta !== null && ufliDelta > 0 && (
                            <span className="text-[10px] font-black text-[var(--green)]">+{ufliDelta}</span>
                          )}
                        </>
                      )}
                      <span className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && a && (
                    <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                      {/* Snapshot badges */}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs bg-[var(--blue-light)] text-[var(--blue)] px-2.5 py-1 rounded-full font-bold">📖 {a.passage_level_reached}</span>
                        <span className="text-xs bg-[var(--primary-light)] text-[var(--primary)] px-2.5 py-1 rounded-full font-bold">📘 Unit {a.ufli_placement?.current_working_unit} — {a.ufli_placement?.current_unit_name}</span>
                      </div>

                      {/* Strengths */}
                      <div className="bg-[var(--green-light)] rounded-xl p-4">
                        <p className="text-xs font-black text-[var(--green)] mb-1.5">💪 Strengths</p>
                        <ul className="space-y-1">
                          {a.strengths?.map((s, i) => (
                            <li key={i} className="text-sm text-gray-800 flex gap-2"><span className="text-[var(--green)]">✓</span>{s}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Gaps */}
                      <div className="bg-[var(--red-light)] rounded-xl p-4">
                        <p className="text-xs font-black text-[var(--red)] mb-1.5">🎯 Focus Areas</p>
                        <ul className="space-y-1.5">
                          {a.priority_gaps?.map((g, i) => (
                            <li key={i} className="text-sm text-gray-800 flex gap-2">
                              <span className="bg-white text-[var(--red)] text-xs font-black w-5 h-5 rounded-md flex items-center justify-center shrink-0">{g.rank}</span>
                              <span><span className="font-bold">{g.gap}</span> — <span className="text-gray-600">{g.why_it_matters}</span></span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Watch */}
                      {a.patterns_to_watch?.length > 0 && (
                        <div className="bg-[var(--orange-light)] rounded-xl p-4">
                          <p className="text-xs font-black text-[var(--orange)] mb-1.5">⚠️ Watch</p>
                          <ul className="space-y-1">
                            {a.patterns_to_watch.map((p, i) => (
                              <li key={i} className="text-sm text-gray-800 flex gap-2"><span className="text-[var(--orange)]">●</span>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* UFLI */}
                      {a.ufli_placement && (
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-xl bg-gray-50 p-3 border-2 border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Mastered</p>
                            <p className="text-lg font-black text-black">{a.ufli_placement.last_unit_mastered}</p>
                            <p className="text-[10px] text-gray-500">{a.ufli_placement.last_unit_name}</p>
                          </div>
                          <div className="rounded-xl bg-[var(--primary-light)] p-3 border-2 border-[var(--primary)]">
                            <p className="text-[10px] text-[var(--primary)] uppercase font-bold">Working on</p>
                            <p className="text-lg font-black text-[var(--primary)]">{a.ufli_placement.current_working_unit}</p>
                            <p className="text-[10px] text-[var(--primary)]">{a.ufli_placement.current_unit_name}</p>
                          </div>
                          <div className="rounded-xl bg-gray-50 p-3 border-2 border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Next up</p>
                            <p className="text-lg font-black text-black">{a.ufli_placement.next_unlock_unit}</p>
                            <p className="text-[10px] text-gray-500">{a.ufli_placement.next_unlock_name}</p>
                          </div>
                        </div>
                      )}

                      {/* 4-Week Arc */}
                      {(a.week_arc || a.four_week_arc) && (
                        <div>
                          <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">📅 4-Week Arc</p>
                          <ul className="space-y-1.5">
                            {(a.week_arc || a.four_week_arc).map((week, i) => (
                              <li key={i} className="text-sm flex gap-2 items-start">
                                <span className="bg-[var(--primary-light)] text-[var(--primary)] text-xs font-black w-6 h-6 rounded-lg flex items-center justify-center shrink-0">{week.week}</span>
                                <span><span className="font-bold text-black">{week.focus}</span> <span className="text-gray-400">— {week.activity_type}</span></span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Detailed breakdown */}
                      <details className="rounded-xl border-2 border-gray-100">
                        <summary className="p-3 text-xs font-black text-gray-400 cursor-pointer">🔬 Detailed breakdown</summary>
                        <div className="px-3 pb-3 space-y-3 border-t border-gray-100 pt-3">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Scarborough's Rope</p>
                            <ul className="space-y-1">
                              {['phonological_awareness', 'decoding', 'sight_recognition', 'vocabulary', 'verbal_reasoning'].map(key => (
                                <li key={key} className="text-xs flex justify-between">
                                  <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                                  <span className="font-bold text-black">{a.scarboroughs_rope?.[key]}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Hegarty</p>
                            <p className="text-xs text-gray-700">
                              Through <span className="font-bold text-[var(--green)]">{a.hegarty_placement?.highest_mastered}</span>,
                              breaks at <span className="font-bold text-[var(--orange)]">{a.hegarty_placement?.breaking_down_at}</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Fluency</p>
                            <p className="text-xs text-gray-700">{a.fluency_rationale}</p>
                          </div>
                        </div>
                      </details>

                      <p className="text-[10px] text-gray-300 text-center">Confidence: {a.confidence}</p>
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
