import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Sparkles, ClipboardList, Pencil, Trash2 } from 'lucide-react'
import { getStudent, getAssessments, getSessions, saveAssessment, deleteAssessment } from '../../lib/storage'
import { useAsync } from '../../lib/useAsync'
import { runPrompt, compressImage } from '../../lib/claude'
import { getAnalysisPrompt } from '../../prompts/analysisPrompt'
import { serializeFormData } from '../../lib/assessmentFormSchemas'
import { SKILLS_CATEGORIES } from '../../lib/skillsCategories'
import CategoryPicker from '../../components/CategoryPicker.jsx'
import AssessmentForm from '../../components/AssessmentForm.jsx'
import AssessmentSelector from '../../components/AssessmentSelector.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import { BtnPrimary, BtnSecondary } from '../../components/v4/primitives.jsx'

const ICONS = {
  'intake-snapshot': '📸', 'phonological-awareness': '👂', 'alphabet-knowledge': '🔤',
  'phonics-decoding': '📖', 'phonics-automaticity': '⚡', 'sight-word-fluency': '👀',
  'oral-reading-fluency': '🗣️', 'spelling-encoding': '✏️', 'vocabulary': '💬',
  'reading-comprehension': '🧠', 'print-concepts': '📄', 'writing-written-expression': '📝',
}

function categoryLabel(id) {
  return SKILLS_CATEGORIES.find(c => c.id === id)?.label || id
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

export default function AssessmentsTab({ studentId, onRefresh, autoStartIntake }) {
  const navigate = useNavigate()
  const { data: student } = useAsync(() => getStudent(studentId), [studentId])
  const { data: sessions = [] } = useAsync(() => getSessions(studentId), [studentId])
  const { data: assessments = [], refresh: refreshAssessments } = useAsync(() => getAssessments(studentId), [studentId])

  const startWithIntake = autoStartIntake && assessments.length === 0
  const [view, setView] = useState(startWithIntake ? 'form' : 'list')
  const [selectedCategory, setSelectedCategory] = useState(startWithIntake ? 'intake-snapshot' : null)
  const [editingAssessment, setEditingAssessment] = useState(null)
  const [selectedForAnalysis, setSelectedForAnalysis] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

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
      <div className="flex items-baseline justify-between">
        <h3 className="text-[15px] font-bold text-[var(--v4-ink)]">Assessments</h3>
        <div className="flex items-center gap-2">
          {hasAssessments && (
            <BtnSecondary onClick={() => { setSelectedForAnalysis(assessments.map(a => a.id)); setView('select-for-analysis') }}>
              <Sparkles className="w-3.5 h-3.5" /> Run Analysis
            </BtnSecondary>
          )}
          <BtnPrimary onClick={() => setView('pick-category')}>
            <Plus className="w-3.5 h-3.5" /> New Assessment
          </BtnPrimary>
        </div>
      </div>

      {error && <Banner tone="red">{error}</Banner>}
      {saved && <Banner tone="green">Assessment saved.</Banner>}

      {/* Intake CTA for new students */}
      {!hasAssessments && (
        <div className="border border-[var(--v4-ink)] rounded-[10px] bg-[var(--v4-surface)] p-4 space-y-2">
          <p className="text-[13px] font-semibold text-[var(--v4-ink)]">Start the intake assessment</p>
          <p className="text-[12.5px] text-[var(--v4-ink-2)]">Create your first assessment to establish a baseline. Fill it out digitally or print the paper form.</p>
          <BtnPrimary onClick={() => handleCategorySelected('intake-snapshot')} className="mt-1">
            <ClipboardList className="w-3.5 h-3.5" /> Start Intake
          </BtnPrimary>
        </div>
      )}

      {/* LIST */}
      {hasAssessments && (
        <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] overflow-hidden">
          {assessments.map((a, i) => (
            <div
              key={a.id}
              className={`grid items-center gap-3 px-4 py-3 hover:bg-[var(--v4-surface-2)] ${i === assessments.length - 1 ? '' : 'border-b border-[var(--v4-border)]'}`}
              style={{ gridTemplateColumns: '32px 1fr auto auto' }}
            >
              <div className="w-8 h-8 rounded-md bg-[var(--v4-blue-lt)] flex items-center justify-center shrink-0 text-base">
                {ICONS[a.category_id] || '📋'}
              </div>
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
              <div className="flex items-center gap-1 shrink-0">
                <IconBtn
                  onClick={() => { setEditingAssessment(a); setSelectedCategory(a.category_id); setView('form') }}
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </IconBtn>
                <IconBtn
                  onClick={async () => { if (confirm('Delete this assessment?')) { await deleteAssessment(a.id); refreshAssessments(); onRefresh?.() } }}
                  title="Delete"
                  danger
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </IconBtn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function IconBtn({ children, onClick, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 rounded-md flex items-center justify-center text-[var(--v4-ink-3)] hover:bg-[var(--v4-surface-3)] ${danger ? 'hover:text-[var(--v4-red)]' : 'hover:text-[var(--v4-ink)]'}`}
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
