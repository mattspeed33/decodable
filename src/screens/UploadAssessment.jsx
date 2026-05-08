import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getStudent, getSessions } from '../lib/storage'
import { runPrompt, compressImage } from '../lib/claude'
import { analysisPrompt } from '../prompts/analysisPrompt'
import PhotoUploader from '../components/PhotoUploader.jsx'
import LoadingState from '../components/LoadingState.jsx'

const assessmentTypes = [
  'Snapshot Assessment',
  'Spelling Assessment',
  'Decodable Reading Check',
  'Teacher Notes'
]

export default function UploadAssessment({ studentId }) {
  const params = useParams()
  const id = studentId || params.id
  const navigate = useNavigate()
  const student = getStudent(id)
  const sessions = getSessions(id)
  const [photos, setPhotos] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function toggleType(type) {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  async function handleAnalyze() {
    setLoading(true)
    setError(null)

    try {
      const images = await Promise.all(photos.map(p => compressImage(p.file)))

      const userMessage = `
Analyze this literacy assessment for ${student.name}, ${student.grade} grade, age ${student.age}.
Session type: ${student.session_type}
Assessment types included: ${selectedTypes.length > 0 ? selectedTypes.join(', ') : 'Not specified'}
Notes from parent: ${student.notes_from_parent || 'None'}
Previous sessions completed: ${sessions.length}
      `.trim()

      const result = await runPrompt({
        systemPrompt: analysisPrompt,
        userMessage,
        images
      })

      const parsed = JSON.parse(result)

      sessionStorage.setItem('decodable_pending_analysis', JSON.stringify({
        student_id: id,
        date: new Date().toISOString().split('T')[0],
        session_number: sessions.length + 1,
        photo_count: photos.length,
        assessment_types: selectedTypes,
        ai_analysis: parsed
      }))

      navigate(`/students/${id}/analysis`)
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!student) {
    return <p className="text-center text-gray-400 py-20">Student not found.</p>
  }

  if (loading) return <LoadingState />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-black tracking-tight">Upload Assessment</h2>
        <p className="text-gray-500 text-sm mt-1">{student.name} &middot; {new Date().toLocaleDateString()}</p>
      </div>

      <PhotoUploader photos={photos} setPhotos={setPhotos} />

      <div>
        <h3 className="text-sm font-bold text-black mb-2">Assessment Types (optional)</h3>
        <div className="flex flex-wrap gap-2">
          {assessmentTypes.map(type => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
                selectedTypes.includes(type)
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-black'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border-2 border-gray-100 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={photos.length === 0}
        className="w-full bg-[var(--primary)] text-white py-3 rounded-full font-semibold hover:bg-[var(--primary-hover)] transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Run Analysis
      </button>
    </div>
  )
}
