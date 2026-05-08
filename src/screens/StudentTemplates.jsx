import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getStudent, getTemplateAssignments, getAssessmentTemplates } from '../lib/storage'


export default function StudentTemplates({ studentId }) {
  const params = useParams()
  const id = studentId || params.id
  const navigate = useNavigate()
  const student = getStudent(id)

  const assignedTemplates = useMemo(() => {
    const templates = getAssessmentTemplates()
    const templateById = Object.fromEntries(templates.map(t => [t.id, t]))
    return getTemplateAssignments(id).map(assignment => ({
      assignment,
      template: templateById[assignment.template_id],
    }))
  }, [id])

  if (!student) {
    return <p className="text-center text-gray-400 py-20">Student not found.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-black tracking-tight">{student.name} Assessment Library</h2>
        <button onClick={() => navigate('/templates')} className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[var(--primary-hover)] transition">
          Browse Library
        </button>
      </div>

      {assignedTemplates.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 p-6 bg-white">
          <p className="font-semibold text-black">No assigned templates yet</p>
          <p className="text-sm text-gray-500 mt-1">Assign one from the global Assessment Templates tab.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignedTemplates.map(({ assignment, template }) => (
            <div key={assignment.id} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-black">{template?.title || 'Deleted template'}</p>
                  <p className="text-xs text-gray-500 mt-1">Assigned {new Date(assignment.assigned_at).toLocaleDateString()}</p>
                </div>
                <span className="text-xs bg-gray-100 text-black px-2.5 py-1 rounded-full font-semibold">Ready to print</span>
              </div>
              {assignment.notes && <p className="text-sm text-gray-700">{assignment.notes}</p>}
              <div className="flex gap-3">
                <button onClick={() => template && navigate(`/templates/${template.id}`)} disabled={!template} className="flex-1 bg-white border border-gray-200 py-2.5 rounded-full text-sm font-semibold text-black hover:border-black disabled:opacity-40">
                  Print Packet
                </button>
                <button onClick={() => navigate(`/students/${id}/upload`)} className="flex-1 bg-white border border-gray-200 py-2.5 rounded-full text-sm font-semibold text-black hover:border-black">
                  Start Assessment Upload
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
