import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ClipboardList, Pencil, Trash2, X, Brain, Upload, Save } from 'lucide-react'
import {
  getStudent, getAssessments, getSessions, getAnalyses,
  saveAssessment, deleteAssessment,
} from '../../lib/storage'
import { useAsync } from '../../lib/useAsync'
import { runPrompt, compressImage } from '../../lib/claude'
import { getAnalysisPrompt } from '../../prompts/analysisPrompt'
import { serializeFormData } from '../../lib/assessmentFormSchemas'
import { SKILLS_CATEGORIES } from '../../lib/skillsCategories'
import CategoryPicker from '../../components/CategoryPicker.jsx'
import AssessmentForm from '../../components/AssessmentForm.jsx'
import AssessmentSelector from '../../components/AssessmentSelector.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import PhotoUploader from '../../components/PhotoUploader.jsx'
import { BtnPrimary, BtnSecondary, Card } from '../../components/v4/primitives.jsx'

const STUDENT_WORK_CATEGORY = 'student-work'

const ICONS = {
  [STUDENT_WORK_CATEGORY]: '📎',
  'intake-snapshot': '📸', 'phonological-awareness': '👂', 'alphabet-knowledge': '🔤',
  'phonics-decoding': '📖', 'phonics-automaticity': '⚡', 'sight-word-fluency': '👀',
  'oral-reading-fluency': '🗣️', 'spelling-encoding': '✏️', 'vocabulary': '💬',
  'reading-comprehension': '🧠', 'print-concepts': '📄', 'writing-written-expression': '📝',
}

function categoryLabel(id) {
  if (id === STUDENT_WORK_CATEGORY) return 'Student Work'
  return SKILLS_CATEGORIES.find(c => c.id === id)?.label || id
}

function photoSrc(photo) {
  if (typeof photo !== 'string') return null
  return photo.startsWith('data:') ? photo : `data:image/jpeg;base64,${photo}`
}

function assessmentSummary(a) {
  const fd = a.form_data || {}
  const parts = []
  if (fd.reading_level) parts.push(fd.reading_level)
  if (fd.fluency_wcpm) parts.push(`${fd.fluency_wcpm} WCPM`)
  if (fd.wcpm) parts.push(`${fd.wcpm} WCPM`)
  if (fd.words_correct != null && fd.words_total) parts.push(`${fd.words_correct}/${fd.words_total}`)
  if (fd.real_words_correct != null && fd.real_words_total) parts.push(`Real: ${fd.real_words_correct}/${fd.real_words_total}`)
  if (a.photos?.length > 0) parts.push(`${a.photos.length} photo${a.photos.length !== 1 ? 's' : ''}`)
  return parts.join(' · ') || (a.entry_method === 'photo' ? 'Photo upload' : 'Digital entry')
}

function relativeDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })
}

export default function AssessmentsTab({ studentId, onRefresh, onJumpToAnalyses, autoStartIntake }) {
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [viewing, setViewing] = useState(null)

  function handleCategorySelected(categoryId) {
    setSelectedCategory(categoryId)
    setView('form')
  }

  async function handleSaveAssessment({ formData, photos, entryMethod }) {
    const compressedPhotos = []
    for (const photo of photos) {
      if (photo.file) compressedPhotos.push(await compressImage(photo.file))
      else if (typeof photo === 'string') compressedPhotos.push(photo)
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

  async function handleSaveUpload({ photos, notes }) {
    const compressedPhotos = []
    for (const photo of photos) {
      if (photo.file) compressedPhotos.push(await compressImage(photo.file))
      else if (typeof photo === 'string') compressedPhotos.push(photo)
    }
    const work = {
      id: crypto.randomUUID(),
      student_id: studentId,
      date: new Date().toISOString().split('T')[0],
      category_id: STUDENT_WORK_CATEGORY,
      entry_method: 'photo',
      form_data: {},
      photos: compressedPhotos,
      notes: notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await saveAssessment(work)
    setView('list')
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
      const textParts = []
      const images = []
      textParts.push(`STUDENT: ${student.name}, ${student.grade} grade, age ${student.age}`)
      textParts.push(`SESSION TYPE: ${student.session_type}`)
      textParts.push(`SESSIONS COMPLETED: ${sessions.length}`)
      textParts.push(`NOTES FROM PARENT: ${student.notes_from_parent || 'None'}`)
      textParts.push('')
      for (const assessment of selected) {
        if (assessment.form_data && Object.keys(assessment.form_data).length > 0) {
          const serialized = serializeFormData(assessment.category_id, assessment.form_data)
          if (serialized) {
            textParts.push(serialized)
            textParts.push(`Date: ${assessment.date}`)
            textParts.push('')
          }
        }
        if (assessment.photos) for (const p of assessment.photos) if (typeof p === 'string') images.push(p)
      }
      const engagementWeeks = student.total_sessions_planned === 999 ? 4 : (student.total_sessions_planned || 4)
      const userMessage = textParts.join('\n').trim()
      const result = await runPrompt({
        systemPrompt: getAnalysisPrompt(engagementWeeks),
        userMessage,
        images: images.length > 0 ? images : undefined,
      })
      const parsed = JSON.parse(result)
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
  if (view === 'upload') {
    return (
      <UploadStudentWorkForm
        onSave={handleSaveUpload}
        onCancel={() => setView('list')}
      />
    )
  }
  if (view === 'pick-category') return <CategoryPicker onSelect={handleCategorySelected} onCancel={() => setView('list')} />
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

  const hasAssessments = assessments.length > 0

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h3 className="text-[15px] font-bold text-[var(--v4-ink)]">Student Work</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {hasAssessments && (
            <BtnSecondary onClick={() => { setSelectedForAnalysis(assessments.map(a => a.id)); setView('select-for-analysis') }}>
              <Sparkles className="w-3.5 h-3.5" /> Run Analysis
            </BtnSecondary>
          )}
          <BtnSecondary onClick={() => setView('pick-category')}>
            <ClipboardList className="w-3.5 h-3.5" /> New Assessment
          </BtnSecondary>
          <BtnPrimary onClick={() => setView('upload')}>
            <Upload className="w-3.5 h-3.5" /> Upload Student Work
          </BtnPrimary>
        </div>
      </div>

      {error && <Banner tone="red">{error}</Banner>}
      {saved && <Banner tone="green">Student work saved.</Banner>}

      {/* CTAs for new students */}
      {!hasAssessments && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="border border-[var(--v4-ink)] rounded-[10px] bg-[var(--v4-surface)] p-4 space-y-2">
            <p className="text-[13px] font-semibold text-[var(--v4-ink)]">Upload student work</p>
            <p className="text-[12.5px] text-[var(--v4-ink-2)]">Snap a photo of any reading or writing the student has done. Decodable will analyze it.</p>
            <BtnPrimary onClick={() => setView('upload')} className="mt-1">
              <Upload className="w-3.5 h-3.5" /> Upload Work
            </BtnPrimary>
          </div>
          <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] p-4 space-y-2">
            <p className="text-[13px] font-semibold text-[var(--v4-ink)]">Start the intake assessment</p>
            <p className="text-[12.5px] text-[var(--v4-ink-2)]">Establish a baseline with a structured assessment. Fill out digitally or print the paper form.</p>
            <BtnSecondary onClick={() => handleCategorySelected('intake-snapshot')} className="mt-1">
              <ClipboardList className="w-3.5 h-3.5" /> Start Intake
            </BtnSecondary>
          </div>
        </div>
      )}

      {/* LIST */}
      {hasAssessments && (
        <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] overflow-hidden">
          {assessments.map((a, i) => {
            const firstPhoto = a.photos?.find(p => typeof p === 'string')
            const thumbSrc = firstPhoto ? photoSrc(firstPhoto) : null
            return (
              <div
                key={a.id}
                onClick={() => setViewing(a)}
                className={`grid items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--v4-surface-2)] ${i === assessments.length - 1 ? '' : 'border-b border-[var(--v4-border)]'}`}
                style={{ gridTemplateColumns: '40px 1fr auto auto' }}
              >
                {thumbSrc ? (
                  <img
                    src={thumbSrc}
                    alt=""
                    className="w-10 h-10 rounded-md object-cover border border-[var(--v4-border)] shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-[var(--v4-blue-lt)] flex items-center justify-center shrink-0 text-base">
                    {ICONS[a.category_id] || '📋'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold text-[var(--v4-ink)] flex items-center gap-1.5">
                    <span className="truncate">{categoryLabel(a.category_id)}</span>
                    <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded bg-[var(--v4-surface-3)] text-[var(--v4-ink-2)]">
                      {a.entry_method === 'digital' ? 'Digital' : 'Paper'}
                    </span>
                  </div>
                  <div className="text-[11.5px] text-[var(--v4-ink-3)] truncate mt-0.5">
                    {assessmentSummary(a)}
                  </div>
                </div>
                <span className="text-[11.5px] text-[var(--v4-ink-3)] whitespace-nowrap">
                  {relativeDate(a.date || a.created_at)}
                </span>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <IconBtn
                    onClick={() => { setEditingAssessment(a); setSelectedCategory(a.category_id); setView('form') }}
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </IconBtn>
                  <IconBtn
                    onClick={async () => { if (confirm('Delete this work?')) { await deleteAssessment(a.id); refreshAssessments(); onRefresh?.() } }}
                    title="Delete"
                    danger
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </IconBtn>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viewing && (
        <WorkLightbox
          work={viewing}
          analyses={analyses}
          onClose={() => setViewing(null)}
          onJumpToAnalyses={onJumpToAnalyses}
        />
      )}
    </div>
  )
}

function UploadStudentWorkForm({ onSave, onCancel }) {
  const [photos, setPhotos] = useState([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    if (photos.length === 0 || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSave({ photos, notes })
    } catch (err) {
      setError(err?.message || 'Could not save the upload. Check your connection and try again.')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-[var(--v4-ink)]">Upload Student Work</h3>
          <p className="text-[11.5px] text-[var(--v4-ink-3)] mt-0.5">
            Snap photos of anything the student has written or read. Decodable will analyze it once you run analysis.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--v4-ink-3)] hover:bg-[var(--v4-surface-3)] hover:text-[var(--v4-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--v4-ink)] focus-visible:outline-offset-2 shrink-0"
          title="Cancel"
          aria-label="Cancel upload"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && <Banner tone="red">{error}</Banner>}

      <Card padding="p-4" className="space-y-2">
        <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px]">Photos</p>
        <PhotoUploader photos={photos} setPhotos={setPhotos} />
      </Card>

      <Card padding="p-4" className="space-y-2">
        <label className="block text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px]">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="What was the assignment? Anything to flag for analysis?"
          className="w-full border border-[var(--v4-border)] rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--v4-ink)] bg-[var(--v4-surface)] h-24 resize-none"
        />
      </Card>

      <BtnPrimary
        onClick={handleSave}
        disabled={photos.length === 0 || saving}
        className={`w-full justify-center py-2.5 ${photos.length === 0 || saving ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save Work'}
      </BtnPrimary>
    </div>
  )
}

function WorkLightbox({ work, analyses, onClose, onJumpToAnalyses }) {
  const [zoomed, setZoomed] = useState(null) // index of full-size photo
  const photos = (work.photos || []).filter(p => typeof p === 'string')
  const linkedAnalysis = analyses.find(an => Array.isArray(an.assessment_ids) && an.assessment_ids.includes(work.id))
  const formEntries = Object.entries(work.form_data || {}).filter(([, v]) => {
    if (v == null || v === '') return false
    if (Array.isArray(v) && v.length === 0) return false
    if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return false
    return true
  })

  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return
      if (zoomed != null) setZoomed(null)
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoomed, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--v4-ink)]/50 p-6"
      onClick={() => (zoomed != null ? setZoomed(null) : onClose())}
    >
      {zoomed != null ? (
        <img
          src={photoSrc(photos[zoomed])}
          alt=""
          className="max-w-full max-h-full object-contain rounded-md"
          onClick={(e) => { e.stopPropagation(); setZoomed(null) }}
        />
      ) : (
        <div
          className="bg-[var(--v4-surface)] rounded-[10px] max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--v4-border)]">
            <div className="w-9 h-9 rounded-md bg-[var(--v4-blue-lt)] flex items-center justify-center text-base shrink-0">
              {ICONS[work.category_id] || '📋'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-bold text-[var(--v4-ink)] truncate">{categoryLabel(work.category_id)}</div>
              <div className="text-[11.5px] text-[var(--v4-ink-3)] mt-0.5 flex items-center gap-2">
                <span>{relativeDate(work.date || work.created_at)}</span>
                <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded bg-[var(--v4-surface-3)] text-[var(--v4-ink-2)]">
                  {work.entry_method === 'digital' ? 'Digital' : 'Paper'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--v4-ink-3)] hover:bg-[var(--v4-surface-3)] hover:text-[var(--v4-ink)] focus-visible:outline-2 focus-visible:outline focus-visible:outline-[var(--v4-ink)] focus-visible:outline-offset-2"
              title="Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {photos.length > 0 && (
              <section>
                <h4 className="text-[11px] font-bold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-2">
                  Uploaded photos
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {photos.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setZoomed(i)}
                      className="block w-full aspect-[4/3] overflow-hidden rounded-md border border-[var(--v4-border)] hover:border-[var(--v4-ink)] transition-colors focus-visible:outline-2 focus-visible:outline focus-visible:outline-[var(--v4-ink)] focus-visible:outline-offset-2"
                      title="Click to expand"
                      aria-label={`View photo ${i + 1} full size`}
                    >
                      <img src={photoSrc(p)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {formEntries.length > 0 && (
              <section>
                <h4 className="text-[11px] font-bold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-2">
                  Form entries
                </h4>
                <div className="border border-[var(--v4-border)] rounded-[10px] overflow-hidden">
                  {formEntries.map(([k, v], i) => (
                    <div
                      key={k}
                      className={`grid gap-3 px-3 py-2 text-[12.5px] ${i === formEntries.length - 1 ? '' : 'border-b border-[var(--v4-border)]'}`}
                      style={{ gridTemplateColumns: '180px 1fr' }}
                    >
                      <div className="text-[var(--v4-ink-3)] font-medium">{k}</div>
                      <div className="text-[var(--v4-ink)] font-mono break-words">{formatValue(v)}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h4 className="text-[11px] font-bold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-2">
                AI Analysis
              </h4>
              {linkedAnalysis ? (
                <div className="border border-[var(--v4-border)] rounded-[10px] p-4 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <Brain className="w-4 h-4 text-[var(--v4-purple)] mt-0.5 shrink-0" />
                    <div className="flex-1 text-[12.5px] text-[var(--v4-ink)] space-y-1">
                      {linkedAnalysis.ai_analysis?.passage_level_reached && (
                        <div><span className="text-[var(--v4-ink-3)]">Passage level:</span> <span className="font-semibold">{linkedAnalysis.ai_analysis.passage_level_reached}</span></div>
                      )}
                      {linkedAnalysis.ai_analysis?.ufli_placement?.current_working_unit != null && (
                        <div><span className="text-[var(--v4-ink-3)]">UFLI unit:</span> <span className="font-semibold">{linkedAnalysis.ai_analysis.ufli_placement.current_working_unit}</span></div>
                      )}
                      {linkedAnalysis.ai_analysis?.priority_gaps?.length > 0 && (
                        <div><span className="text-[var(--v4-ink-3)]">Priority gaps:</span> <span className="font-semibold">{linkedAnalysis.ai_analysis.priority_gaps.length}</span></div>
                      )}
                      {linkedAnalysis.ai_analysis?.summary && (
                        <div className="text-[var(--v4-ink-2)] pt-1 leading-relaxed">{linkedAnalysis.ai_analysis.summary}</div>
                      )}
                    </div>
                  </div>
                  {onJumpToAnalyses && (
                    <button
                      onClick={() => { onClose(); onJumpToAnalyses() }}
                      className="text-[11.5px] font-semibold text-[var(--v4-purple)] hover:underline ml-[26px]"
                    >
                      View full analysis →
                    </button>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-[var(--v4-border-2)] rounded-[10px] p-4 text-[12.5px] text-[var(--v4-ink-3)]">
                  This work hasn't been analyzed yet. Use <span className="font-semibold text-[var(--v4-ink-2)]">Run Analysis</span> to grade it.
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

function formatValue(v) {
  if (Array.isArray(v)) return v.join(', ')
  if (v && typeof v === 'object') return JSON.stringify(v)
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return String(v)
}

function IconBtn({ children, onClick, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`w-8 h-8 rounded-md flex items-center justify-center text-[var(--v4-ink-3)] hover:bg-[var(--v4-surface-3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--v4-ink)] focus-visible:outline-offset-2 ${danger ? 'hover:text-[var(--v4-red)]' : 'hover:text-[var(--v4-ink)]'}`}
    >
      {children}
    </button>
  )
}

function Banner({ tone, children }) {
  const tones = {
    red:   'bg-[var(--v4-red-lt)] text-[var(--v4-red)]',
    green: 'bg-[var(--v4-green-lt)] text-[var(--v4-green)]',
    amber: 'bg-[var(--v4-amber-lt)] text-[var(--v4-amber)]',
  }
  return <div className={`rounded-md px-3 py-2 text-[12.5px] font-medium ${tones[tone]}`}>{children}</div>
}
