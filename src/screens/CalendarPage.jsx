import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { getStudents, getAllSessions, getScheduledSessions, getAllAnalyses } from '../lib/storage'
import { useAsync } from '../lib/useAsync'
import { Card } from '../components/v4/primitives.jsx'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAME_TO_NUM = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 }
const GRADE_EMOJI = { 'K': '🌱', '1st': '🌿', '2nd': '🌳', '3rd': '🏆' }

function getMonthData(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return { firstDay, daysInMonth }
}

function formatDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function getRecurringSessions(students, year, month) {
  const recurring = []
  const { daysInMonth } = getMonthData(year, month)
  students.forEach(student => {
    if (!student.session_day || !student.start_date) return
    const dayNum = DAY_NAME_TO_NUM[student.session_day]
    if (dayNum === undefined) return
    const startDate = new Date(student.start_date + 'T00:00:00')
    let endDate = null
    if (student.total_sessions_planned && student.total_sessions_planned !== 999) {
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + student.total_sessions_planned * 7)
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      if (date.getDay() !== dayNum) continue
      if (date < startDate) continue
      if (endDate && date > endDate) continue
      recurring.push({
        id: `recurring-${student.id}-${formatDate(year, month, d)}`,
        student_id: student.id,
        student_name: student.name,
        date: formatDate(year, month, d),
        time: student.session_time || null,
        type: 'recurring',
        grade: student.grade,
        session_length: student.session_length_minutes,
      })
    }
  })
  return recurring
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [hoveredEvent, setHoveredEvent] = useState(null)

  const { data: students = [] } = useAsync(() => getStudents())
  const { data: allSessions = [] } = useAsync(() => getAllSessions())
  const { data: manualScheduled = [] } = useAsync(() => getScheduledSessions())
  const { data: allAnalyses = [] } = useAsync(() => getAllAnalyses())

  const latestAnalysisByStudent = useMemo(() => {
    const m = {}
    for (const a of allAnalyses) if (!m[a.student_id]) m[a.student_id] = a
    return m
  }, [allAnalyses])

  const { firstDay, daysInMonth } = getMonthData(viewYear, viewMonth)
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const todayStr = today.toISOString().split('T')[0]

  const eventsByDate = useMemo(() => {
    const map = {}
    const studentMap = Object.fromEntries(students.map(s => [s.id, s]))

    allSessions.forEach(s => {
      const student = studentMap[s.student_id]
      if (!student) return
      if (!map[s.date]) map[s.date] = []
      map[s.date].push({
        id: s.id,
        student_id: s.student_id,
        student_name: student.name,
        grade: student.grade,
        date: s.date,
        time: null,
        type: 'completed',
        session_length: s.length_minutes,
        ses_number: s.ses_number,
      })
    })

    getRecurringSessions(students, viewYear, viewMonth).forEach(r => {
      if (map[r.date]?.some(e => e.student_id === r.student_id && e.type === 'completed')) return
      if (!map[r.date]) map[r.date] = []
      map[r.date].push(r)
    })

    manualScheduled.forEach(s => {
      const student = studentMap[s.student_id]
      if (!student) return
      if (map[s.date]?.some(e => e.student_id === s.student_id)) return
      if (!map[s.date]) map[s.date] = []
      map[s.date].push({
        ...s,
        student_name: student.name,
        grade: student.grade,
        type: 'scheduled',
        session_length: student.session_length_minutes,
      })
    })

    return map
  }, [students, allSessions, manualScheduled, viewYear, viewMonth])

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) } else setViewMonth(viewMonth - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) } else setViewMonth(viewMonth + 1)
  }

  function getStudentFocus(studentId) {
    const a = latestAnalysisByStudent[studentId]
    if (!a?.ai_analysis) return null
    const arc = (a.ai_analysis.week_arc || a.ai_analysis.four_week_arc)
    if (!arc?.length) return a.ai_analysis.ufli_placement?.current_unit_name || null
    const sessions = allSessions.filter(s => s.student_id === studentId)
    const weekIdx = Math.min(sessions.length, arc.length - 1)
    return arc[weekIdx]?.focus || null
  }

  // Upcoming
  const upcoming = []
  Object.entries(eventsByDate).forEach(([date, events]) => {
    if (date < todayStr) return
    events.filter(e => e.type !== 'completed').forEach(e => upcoming.push({ ...e, date }))
  })
  upcoming.sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-5">
      <h2 className="text-[22px] font-bold text-[var(--v4-ink)] tracking-[-0.5px]">Calendar</h2>

      <Card padding="p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="w-7 h-7 rounded-md text-[var(--v4-ink-3)] hover:bg-[var(--v4-surface-3)] hover:text-[var(--v4-ink)] flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[14px] font-semibold text-[var(--v4-ink)]">{monthLabel}</span>
          <button onClick={nextMonth} className="w-7 h-7 rounded-md text-[var(--v4-ink-3)] hover:bg-[var(--v4-surface-3)] hover:text-[var(--v4-ink)] flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} className="min-h-[78px]" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = formatDate(viewYear, viewMonth, day)
            const isToday = dateStr === todayStr
            const events = eventsByDate[dateStr] || []

            return (
              <div
                key={day}
                className={`min-h-[78px] rounded-md border p-1 transition ${
                  isToday ? 'border-[var(--v4-ink)] bg-[var(--v4-surface-2)]' : 'border-[var(--v4-border)]'
                }`}
              >
                <p className={`text-[10px] font-semibold mb-0.5 px-0.5 ${isToday ? 'text-[var(--v4-ink)]' : 'text-[var(--v4-ink-3)]'}`}>
                  {day}
                </p>
                <div className="space-y-0.5">
                  {events.map(event => {
                    const isHovered = hoveredEvent === event.id
                    const focus = getStudentFocus(event.student_id)
                    const tone = event.type === 'completed'
                      ? 'bg-[var(--v4-green-lt)] text-[var(--v4-green)]'
                      : 'bg-[var(--v4-blue-lt)] text-[var(--v4-blue)]'
                    return (
                      <div key={event.id} className="relative">
                        <button
                          onClick={() => navigate(`/students/${event.student_id}`)}
                          onMouseEnter={() => setHoveredEvent(event.id)}
                          onMouseLeave={() => setHoveredEvent(null)}
                          className={`w-full text-left rounded px-1.5 py-0.5 text-[10px] font-semibold truncate transition hover:shadow-sm ${tone}`}
                        >
                          {GRADE_EMOJI[event.grade] || '📚'} {event.student_name}
                        </button>
                        {isHovered && (
                          <div className="absolute z-50 left-0 top-full mt-1 w-56 bg-[var(--v4-surface)] rounded-md border border-[var(--v4-border)] shadow-lg p-2.5 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{GRADE_EMOJI[event.grade] || '📚'}</span>
                              <div>
                                <p className="text-[13px] font-semibold text-[var(--v4-ink)]">{event.student_name}</p>
                                <p className="text-[10.5px] text-[var(--v4-ink-3)]">{event.grade} grade</p>
                              </div>
                            </div>
                            <div className="space-y-1 text-[11.5px] text-[var(--v4-ink-2)]">
                              {event.time && <p>🕐 <span className="font-medium">{event.time}</span></p>}
                              {event.session_length && <p>⏱️ <span className="font-medium">{event.session_length} min</span></p>}
                              {focus && <p>🎯 <span className="font-medium">{focus}</span></p>}
                              <p className={event.type === 'completed' ? 'text-[var(--v4-green)] font-semibold' : 'text-[var(--v4-blue)] font-semibold'}>
                                {event.type === 'completed' ? `Session ${event.ses_number} · completed` : 'Scheduled'}
                              </p>
                            </div>
                            <p className="text-[10px] text-[var(--v4-ink-3)] pt-1.5 border-t border-[var(--v4-border)]">Click to open student profile →</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="flex items-center gap-4 text-[11px] text-[var(--v4-ink-3)] font-medium">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[var(--v4-green-lt)]" /> Completed</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[var(--v4-blue-lt)]" /> Scheduled</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-[var(--v4-ink)]" /> Today</span>
      </div>

      {upcoming.length > 0 && (
        <div>
          <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-2">Upcoming Sessions</p>
          <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] overflow-hidden">
            {upcoming.slice(0, 10).map((event, i) => (
              <button
                key={event.id}
                onClick={() => navigate(`/students/${event.student_id}`)}
                className={`w-full grid items-center gap-3 px-4 py-3 text-left hover:bg-[var(--v4-surface-2)] ${i === Math.min(upcoming.length, 10) - 1 ? '' : 'border-b border-[var(--v4-border)]'}`}
                style={{ gridTemplateColumns: '32px 1fr auto auto' }}
              >
                <div className="w-8 h-8 rounded-md bg-[var(--v4-green-lt)] flex items-center justify-center shrink-0 text-base">
                  {GRADE_EMOJI[event.grade] || '📚'}
                </div>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-[var(--v4-ink)]">{event.student_name}</p>
                  <p className="text-[11.5px] text-[var(--v4-ink-3)] mt-0.5">
                    {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {event.time ? ` · ${event.time}` : ''}
                    {event.session_length ? ` · ${event.session_length} min` : ''}
                  </p>
                </div>
                <div />
                <ArrowRight className="w-3.5 h-3.5 text-[var(--v4-ink-4)]" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
