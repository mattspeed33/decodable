import { useNavigate, useParams } from 'react-router-dom'
import { getHomeworkSheets, getStudents, getStudent } from '../lib/storage'
import { useAsync } from '../lib/useAsync'


export default function HomeworkInbox({ studentId }) {
  const navigate = useNavigate()
  const params = useParams()
  const id = studentId || params.id

  const { data: student } = useAsync(() => id ? getStudent(id) : Promise.resolve(null), [id])
  const { data: students = [] } = useAsync(() => getStudents())
  const { data: sheets = [] } = useAsync(() => getHomeworkSheets(id || null), [id])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-black tracking-tight">
          {id ? `${student?.name || 'Student'} Homework` : 'Homework'}
        </h2>
        {id ? (
          <button
            onClick={() => navigate(`/students/${id}/homework/new`)}
            className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[var(--primary-hover)] transition"
          >
            Generate &amp; Assign
          </button>
        ) : (
          <button
            onClick={() => navigate('/students')}
            className="bg-white border border-gray-200 px-5 py-2.5 rounded-full text-sm font-semibold hover:border-black transition"
          >
            Open a Student
          </button>
        )}
      </div>

      {!id && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-700">Viewing all saved homework. Open a student profile to generate a new assignment.</p>
        </div>
      )}

      {sheets.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <p className="font-semibold text-black">No saved homework yet</p>
          <p className="text-sm text-gray-500 mt-1">Generated homework will appear here and can be printed any time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sheets.map((sheet) => {
            const listStudent = student || students.find(s => s.id === sheet.student_id)
            return (
              <button
                key={sheet.id}
                onClick={() => navigate(`/students/${sheet.student_id}/homework/${sheet.id}`)}
                className="w-full text-left rounded-2xl border border-gray-200 bg-white p-5 hover:border-black transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-black">{listStudent?.name || 'Unknown student'}</p>
                    <p className="text-sm text-gray-500 mt-1">{sheet.skill_focus}</p>
                    <p className="text-xs text-gray-400 mt-1">Week of {sheet.week_of}</p>
                  </div>
                  <span className="text-xs bg-pink-100 text-pink-700 px-2.5 py-1 rounded-full font-semibold">
                    Ready to print
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
