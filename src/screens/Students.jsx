import { useNavigate } from 'react-router-dom'
import { Plus, ArrowRight } from 'lucide-react'
import { getStudents, getAllSessions, getAllAnalyses } from '../lib/storage'
import { useAsync } from '../lib/useAsync'
import { Section, ListTable, ListRow, BtnPrimary } from '../components/v4/primitives.jsx'

const GRADE_EMOJI = { 'K': '🌱', '1st': '🌿', '2nd': '🌳', '3rd': '🏆' }

export default function Students() {
  const navigate = useNavigate()
  const { data: students = [], loading } = useAsync(() => getStudents())
  const { data: allSessions = [] } = useAsync(() => getAllSessions())
  const { data: allAnalyses = [] } = useAsync(() => getAllAnalyses())

  const latestByStudent = {}
  for (const a of allAnalyses) if (!latestByStudent[a.student_id]) latestByStudent[a.student_id] = a

  const activeStudents = students.filter(s => (s.status ?? 'active') !== 'inactive')
  const inactiveStudents = students.filter(s => s.status === 'inactive')

  function renderRow(s, { inactive = false } = {}) {
    const a = latestByStudent[s.id]
    const fluency = a?.ai_analysis?.fluency_estimate_pct || 0
    const ufli = a?.ai_analysis?.ufli_placement?.current_working_unit
    const sessCount = allSessions.filter(ses => ses.student_id === s.id).length
    const remaining = (s.total_sessions_planned && s.total_sessions_planned !== 999)
      ? Math.max(0, s.total_sessions_planned - sessCount) : null
    const subParts = [
      `${s.grade} grade · Age ${s.age}`,
      `${sessCount} session${sessCount !== 1 ? 's' : ''}${remaining ? ` (${remaining} left)` : ''}`,
      fluency ? `${fluency}% fluency` : null,
    ].filter(Boolean)
    const tag = inactive
      ? { text: 'Inactive', tone: 'gray' }
      : (ufli ? { text: `Unit ${ufli}`, tone: 'blue' } : (s.session_type ? { text: s.session_type, tone: 'purple' } : null))
    return (
      <ListRow
        key={s.id}
        icon={<span className="text-base">{GRADE_EMOJI[s.grade] || '📚'}</span>}
        iconTone={inactive ? 'gray' : 'green'}
        title={s.name}
        tag={tag}
        sub={subParts.join(' · ')}
        date=""
        right={<ArrowRight className="w-3.5 h-3.5 text-[var(--v4-ink-4)]" />}
        onClick={() => navigate(`/students/${s.id}`)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-bold text-[var(--v4-ink)] tracking-[-0.5px]">Students</h2>
        <BtnPrimary onClick={() => navigate('/students/new')}>
          <Plus className="w-3.5 h-3.5" /> Add Student
        </BtnPrimary>
      </div>

      {loading ? (
        <p className="text-center text-[var(--v4-ink-3)] py-20 text-sm font-medium">Loading…</p>
      ) : students.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">📚</span>
          <p className="text-[var(--v4-ink-2)] text-base font-semibold mb-1">No students yet</p>
          <p className="text-[var(--v4-ink-3)] text-sm">Add your first student to get started.</p>
        </div>
      ) : (
        <>
          <Section title={`Active${activeStudents.length ? ` · ${activeStudents.length}` : ''}`}>
            {activeStudents.length > 0 ? (
              <ListTable>
                {activeStudents.map(s => renderRow(s))}
              </ListTable>
            ) : (
              <p className="text-[12.5px] text-[var(--v4-ink-3)] font-medium py-4">No active students.</p>
            )}
          </Section>
          {inactiveStudents.length > 0 && (
            <Section title={`Inactive · ${inactiveStudents.length}`}>
              <ListTable>
                {inactiveStudents.map(s => renderRow(s, { inactive: true }))}
              </ListTable>
            </Section>
          )}
        </>
      )}
    </div>
  )
}
