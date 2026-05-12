import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudent, getAssessments, getAnalyses, getSessions, saveAssessment, deleteAssessment } from '../../lib/storage'
import { useAsync } from '../../lib/useAsync'
import { runPrompt, compressImage } from '../../lib/claude'
import { getAnalysisPrompt } from '../../prompts/analysisPrompt'
import { serializeFormData } from '../../lib/assessmentFormSchemas'
import { SKILLS_CATEGORIES } from '../../lib/skillsCategories'
import CategoryPicker from '../../components/CategoryPicker.jsx'
import AssessmentForm from '../../components/AssessmentForm.jsx'
import AssessmentSelector from '../../components/AssessmentSelector.jsx'
import LoadingState from '../../components/LoadingState.jsx'

const ICONS = {
  'intake-snapshot': '📸', 'phonological-awareness': '👂', 'alphabet-knowledge': '🔤',
  'phonics-decoding': '📖', 'phonics-automaticity': '⚡', 'sight-word-fluency': '👀',
  'oral-reading-fluency': '🗣️', 'spelling-encoding': '✏️', 'vocabulary': '💬',
  'reading-comprehension': '🧠', 'print-concepts': '📄', 'writing-written-expression': '📝',
}

function getCategoryLabel(id) {
  return SKILLS_CATEGORIES.find(c => c.id === id)?.label || id
}

function getAssessmentSummary(assessment) {
  const fd = assessment.form_data || {}
  const parts = []
  // Pull a few key fields depending on category
  if (fd.reading_level) parts.push(fd.reading_level)
  if (fd.fluency_wcpm) parts.push(`${fd.fluency_wcpm} WCPM`)
  if (fd.wcpm) parts.push(`${fd.wcpm} WCPM`)
  if (fd.words_correct != null && fd.words_total) parts.push(`${fd.words_correct}/${fd.words_total}`)
  if (fd.real_words_correct != null && fd.real_words_total) parts.push(`Real: ${fd.real_words_correct}/${fd.real_words_total}`)
  if (assessment.photos?.length > 0) parts.push(`${assessment.photos.length} photo${assessment.photos.length !== 1 ? 's' : ''}`)
  return parts.join(' · ') || (assessment.entry_method === 'photo' ? 'Photo upload' : 'Digital entry')
}

export default function AssessmentsTab({ studentId, onRefresh, autoStartIntake }) {
  const navigate = useNavigate()
  const { data: student } = useAsync(() => getStudent(studentId), [studentId])
  const { data: sessions = [] } = useAsync(() => getSessions(studentId), [studentId])
  const { data: assessments = [], refresh: refreshAssessments } = useAsync(() => getAssessments(studentId), [studentId])
  const { data: analyses = [] } = useAsync(() => getAnalyses(studentId), [studentId])

  const startWithIntake = autoStartIntake && assessments.length === 0
  const [view, setView] = useState(startWithIntake ? 'form' : 'list')
  const [selectedCategory, setSelectedCategory] = useState(startWithIntake ? 'intake-snapshot' : null)
  const [editingAssessment, setEditingAssessment] = useState(null)
  const [selectedForAnalysis, setSelectedForAnalysis] = useState([])
  const [expandedAnalysisId, setExpandedAnalysisId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  function handleCategorySelected(categoryId) {
    setSelectedCategory(categoryId)
    setView('form')
  }

  async function handleSaveAssessment({ formData, photos, entryMethod }) {
    // Compress photos before saving
    const compressedPhotos = []
    for (const photo of photos) {
      if (photo.file) {
        const compressed = await compressImage(photo.file)
        compressedPhotos.push(compressed)
      } else if (typeof photo === 'string') {
        compressedPhotos.push(photo)
      }
    }

    const assessment = {
      id: editingAssessment?.id || crypto.randomUUID(),
      student_id: studentId,
      date: editingAssessment?.date || new Date().toISOString().split('T')[0],
      category_id: selectedCategory,
      entry_method: entryMethod,
      form_data: formData,
      photos: compressedPhotos,
      notes: formData.notes || '',
      created_at: editingAssessment?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await saveAssessment(assessment)
    setView('list')
    setSelectedCategory(null)
    setEditingAssessment(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    refreshAssessments()
    onRefresh?.()
  }

  async function handleRunAnalysis() {
    const selected = assessments.filter(a => selectedForAnalysis.includes(a.id))
    if (selected.length === 0) return

    setLoading(true)
    setError(null)
    try {
      // Build context from selected assessments
      const textParts = []
      const images = []

      textParts.push(`STUDENT: ${student.name}, ${student.grade} grade, age ${student.age}`)
      textParts.push(`SESSION TYPE: ${student.session_type}`)
      textParts.push(`SESSIONS COMPLETED: ${sessions.length}`)
      textParts.push(`NOTES FROM PARENT: ${student.notes_from_parent || 'None'}`)
      textParts.push('')

      for (const assessment of selected) {
        // Add structured form data
        if (assessment.form_data && Object.keys(assessment.form_data).length > 0) {
          const serialized = serializeFormData(assessment.category_id, assessment.form_data)
          if (serialized) {
            textParts.push(serialized)
            textParts.push(`Date: ${assessment.date}`)
            textParts.push('')
          }
        }
        // Collect photos
        if (assessment.photos) {
          for (const photo of assessment.photos) {
            if (typeof photo === 'string') images.push(photo)
          }
        }
      }

      const engagementWeeks = student.total_sessions_planned === 999 ? 4 : (student.total_sessions_planned || 4)
      const userMessage = textParts.join('\n').trim()

      const result = await runPrompt({
        systemPrompt: getAnalysisPrompt(engagementWeeks),
        userMessage,
        images: images.length > 0 ? images : undefined,
      })
      const parsed = JSON.parse(result)

      // Save as analysis record via AnalysisResult screen
      sessionStorage.setItem('decodable_pending_analysis', JSON.stringify({
        student_id: studentId,
        date: new Date().toISOString().split('T')[0],
        assessment_ids: selectedForAnalysis,
        session_number: sessions.length + 1,
        photo_count: images.length,
        ai_analysis: parsed,
      }))
      navigate(`/students/${studentId}/analysis`)
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
      setLoading(false)
    }
  }

  if (loading) return <LoadingState />

  // ── CATEGORY PICKER ──
  if (view === 'pick-category') {
    return <CategoryPicker onSelect={handleCategorySelected} onCancel={() => setView('list')} />
  }

  // ── ASSESSMENT FORM ──
  if (view === 'form' && selectedCategory) {
    return (
      <AssessmentForm
        categoryId={selectedCategory}
        initialData={editingAssessment?.form_data}
        onSave={handleSaveAssessment}
        onCancel={() => { setView('list'); setSelectedCategory(null); setEditingAssessment(null) }}
      />
    )
  }

  // ── ANALYSIS SELECTOR ──
  if (view === 'select-for-analysis') {
    return (
      <AssessmentSelector
        assessments={assessments}
        selected={selectedForAnalysis}
        setSelected={setSelectedForAnalysis}
        onAnalyze={handleRunAnalysis}
        onCancel={() => setView('list')}
        loading={loading}
      />
    )
  }

  // ── LIST VIEW (default) ──
  const hasAssessments = assessments.length > 0

  return (
    <div className="space-y-5">
      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('pick-category')}
          className="flex-1 bg-[var(--primary)] text-white py-3.5 rounded-full font-bold hover:bg-[var(--primary-hover)] transition shadow-sm"
        >
          📝 New Assessment
        </button>
        {hasAssessments && (
          <button
            onClick={() => { setSelectedForAnalysis(assessments.map(a => a.id)); setView('select-for-analysis') }}
            className="flex-1 bg-black text-white py-3.5 rounded-full font-bold hover:bg-gray-800 transition shadow-sm"
          >
            🧠 Run Analysis
          </button>
        )}
      </div>

      {error && <div className="rounded-2xl bg-[var(--red-light)] p-3 text-sm text-[var(--red)] font-bold">{error}</div>}
      {saved && <div className="rounded-2xl bg-[var(--green-light)] p-3 text-sm text-[var(--green)] font-bold">Assessment saved!</div>}

      {/* Intake CTA for new students */}
      {!hasAssessments && (
        <div className="bg-white rounded-2xl border-2 border-[var(--primary)] p-6 space-y-3">
          <h3 className="font-black text-black">⭐ Start the Intake Assessment</h3>
          <p className="text-sm text-gray-500">Create your first assessment to establish a baseline. You can fill it out digitally or print the paper form.</p>
          <button
            onClick={() => handleCategorySelected('intake-snapshot')}
            className="w-full bg-[var(--primary)] text-white py-3 rounded-full font-bold hover:bg-[var(--primary-hover)] transition"
          >
            📸 Start Intake
          </button>
        </div>
      )}

      {/* Assessments list */}
      {hasAssessments && (
        <div>
          <h3 className="font-black text-black text-lg mb-4">📊 Assessments</h3>
          <div className="space-y-2">
            {assessments.map(assessment => (
              <div key={assessment.id} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] flex items-center justify-center shrink-0">
                    <span className="text-lg">{ICONS[assessment.category_id] || '📋'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-black text-sm">{getCategoryLabel(assessment.category_id)}</p>
                    <p className="text-[10px] text-gray-400 font-semibold">
                      {new Date(assessment.date).toLocaleDateString()}
                      {' · '}
                      {assessment.entry_method === 'digital' ? '📝 Digital' : '📸 Paper'}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">{getAssessmentSummary(assessment)}</p>
                  </div>
                  <div className="action-buttons flex gap-1 shrink-0">
                    <button
                      onClick={() => { setEditingAssessment(assessment); setSelectedCategory(assessment.category_id); setView('form') }}
                      className="text-[10px] font-bold text-gray-300 hover:text-[var(--primary)] transition px-1"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={async () => { if (confirm('Delete this assessment?')) { await deleteAssessment(assessment.id); refreshAssessments(); onRefresh?.() } }}
                      className="text-[10px] font-bold text-gray-300 hover:text-[var(--red)] transition px-1"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis History */}
      {analyses.length > 0 && (
        <div>
          <h3 className="font-black text-black text-lg mb-4">🧠 Analysis History</h3>
          <div className="space-y-3">
            {analyses.map(analysis => {
              const a = analysis.ai_analysis
              const isExpanded = expandedAnalysisId === analysis.id

              return (
                <div key={analysis.id} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setExpandedAnalysisId(isExpanded ? null : analysis.id)}
                    className="w-full p-5 text-left flex items-center gap-4 hover:bg-gray-50 transition"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--blue-light)] flex items-center justify-center shrink-0">
                      <span className="text-lg">🧠</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-black text-sm">Analysis</p>
                      <p className="text-xs text-gray-400 font-semibold">
                        {new Date(analysis.date).toLocaleDateString()}
                        {' · '}
                        {analysis.assessment_ids?.length || 0} assessment{(analysis.assessment_ids?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {a && (
                        <>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{
                            background: a.fluency_estimate_pct >= 80 ? 'var(--green-light)' : a.fluency_estimate_pct >= 50 ? 'var(--orange-light)' : 'var(--red-light)',
                            color: a.fluency_estimate_pct >= 80 ? 'var(--green)' : a.fluency_estimate_pct >= 50 ? 'var(--orange)' : 'var(--red)'
                          }}>{a.fluency_estimate_pct}%</span>
                          {a.ufli_placement && (
                            <span className="text-[10px] bg-[var(--blue-light)] text-[var(--blue)] px-2 py-0.5 rounded-full font-bold">
                              Unit {a.ufli_placement.current_working_unit}
                            </span>
                          )}
                        </>
                      )}
                      <span className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                    </div>
                  </button>

                  {isExpanded && a && (
                    <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs bg-[var(--blue-light)] text-[var(--blue)] px-2.5 py-1 rounded-full font-bold">📖 {a.passage_level_reached}</span>
                        {a.ufli_placement && (
                          <span className="text-xs bg-[var(--primary-light)] text-[var(--primary)] px-2.5 py-1 rounded-full font-bold">📘 Unit {a.ufli_placement.current_working_unit} — {a.ufli_placement.current_unit_name}</span>
                        )}
                      </div>

                      {a.strengths?.length > 0 && (
                        <div className="bg-[var(--green-light)] rounded-xl p-4">
                          <p className="text-xs font-black text-[var(--green)] mb-1.5">💪 Strengths</p>
                          <ul className="space-y-1">
                            {a.strengths.map((s, i) => (
                              <li key={i} className="text-sm text-gray-800 flex gap-2"><span className="text-[var(--green)]">✓</span>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {a.priority_gaps?.length > 0 && (
                        <div className="bg-[var(--red-light)] rounded-xl p-4">
                          <p className="text-xs font-black text-[var(--red)] mb-1.5">🎯 Focus Areas</p>
                          <ul className="space-y-1.5">
                            {a.priority_gaps.map((g, i) => (
                              <li key={i} className="text-sm text-gray-800 flex gap-2">
                                <span className="bg-white text-[var(--red)] text-xs font-black w-5 h-5 rounded-md flex items-center justify-center shrink-0">{g.rank}</span>
                                <span><span className="font-bold">{g.gap}</span> — <span className="text-gray-600">{g.why_it_matters}</span></span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

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

                      {(a.week_arc || a.four_week_arc) && (
                        <div>
                          <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">📅 Week Arc</p>
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

                      <details className="rounded-xl border-2 border-gray-100">
                        <summary className="p-3 text-xs font-black text-gray-400 cursor-pointer">🔬 Detailed breakdown</summary>
                        <div className="px-3 pb-3 space-y-3 border-t border-gray-100 pt-3">
                          {a.scarboroughs_rope && (
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Scarborough's Rope</p>
                              <ul className="space-y-1">
                                {['phonological_awareness', 'decoding', 'sight_recognition', 'vocabulary', 'verbal_reasoning'].map(key => (
                                  <li key={key} className="text-xs flex justify-between">
                                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                                    <span className="font-bold text-black">{a.scarboroughs_rope[key]}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {a.hegarty_placement && (
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Hegarty</p>
                              <p className="text-xs text-gray-700">
                                Through <span className="font-bold text-[var(--green)]">{a.hegarty_placement.highest_mastered}</span>,
                                breaks at <span className="font-bold text-[var(--orange)]">{a.hegarty_placement.breaking_down_at}</span>
                              </p>
                            </div>
                          )}
                          {a.fluency_rationale && (
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Fluency</p>
                              <p className="text-xs text-gray-700">{a.fluency_rationale}</p>
                            </div>
                          )}
                        </div>
                      </details>

                      {a.confidence && <p className="text-[10px] text-gray-300 text-center">Confidence: {a.confidence}</p>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
