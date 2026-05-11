import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudents, getAllSessions, getScheduledSessions, getLatestAnalysis } from '../lib/storage'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAME_TO_NUM = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 }

function getMonthData(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return { firstDay, daysInMonth }
}

function formatDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// Generate recurring sessions from student schedule data
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

const gradeEmoji = { 'K': '🌱', '1st': '🌿', '2nd': '🌳', '3rd': '🏆' }

export default function CalendarPage() {
  const navigate = useNavigate()
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [hoveredEvent, setHoveredEvent] = useState(null)

  const students = getStudents()
  const allSessions = getAllSessions()
  const manualScheduled = getScheduledSessions()

  const { firstDay, daysInMonth } = getMonthData(viewYear, viewMonth)
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const todayStr = today.toISOString().split('T')[0]

  // Build events by date
  const eventsByDate = useMemo(() => {
    const map = {}
    const studentMap = Object.fromEntries(students.map(s => [s.id, s]))

    // Completed sessions
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

    // Recurring from schedule
    const recurring = getRecurringSessions(students, viewYear, viewMonth)
    recurring.forEach(r => {
      // Don't add if already completed on that date
      if (map[r.date]?.some(e => e.student_id === r.student_id && e.type === 'completed')) return
      if (!map[r.date]) map[r.date] = []
      map[r.date].push(r)
    })

    // Manual scheduled
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
    const a = getLatestAnalysis(studentId)
    if (!a?.ai_analysis) return null
    const arc = (a.ai_analysis.week_arc || a.ai_analysis.four_week_arc)
    if (!arc?.length) return a.ai_analysis.ufli_placement?.current_unit_name || null
    const sessions = allSessions.filter(s => s.student_id === studentId)
    const weekIdx = Math.min(sessions.length, arc.length - 1)
    return arc[weekIdx]?.focus || null
  }

  return (
    <div className="space-y-5">
      <h2 className="text-3xl font-black text-black tracking-tight">📅 Calendar</h2>

      {/* Month nav */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="text-gray-400 hover:text-black font-bold px-3 py-1 rounded-lg hover:bg-gray-50 transition">← Prev</button>
          <span className="text-lg font-black text-black">{monthLabel}</span>
          <button onClick={nextMonth} className="text-gray-400 hover:text-black font-bold px-3 py-1 rounded-lg hover:bg-gray-50 transition">Next →</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wide py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} className="min-h-[80px]" />)}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = formatDate(viewYear, viewMonth, day)
            const isToday = dateStr === todayStr
            const events = eventsByDate[dateStr] || []

            return (
              <div
                key={day}
                className={`min-h-[80px] rounded-xl border p-1 transition ${
                  isToday ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <p className={`text-[10px] font-bold mb-0.5 px-0.5 ${isToday ? 'text-black' : 'text-gray-400'}`}>{day}</p>

                {/* Event cards */}
                <div className="space-y-0.5">
                  {events.map(event => {
                    const isHovered = hoveredEvent === event.id
                    const focus = getStudentFocus(event.student_id)
                    return (
                      <div key={event.id} className="relative">
                        <button
                          onClick={() => navigate(`/students/${event.student_id}`)}
                          onMouseEnter={() => setHoveredEvent(event.id)}
                          onMouseLeave={() => setHoveredEvent(null)}
                          className={`w-full text-left rounded-lg px-1.5 py-1 text-[10px] font-bold truncate transition ${
                            event.type === 'completed'
                              ? 'bg-[var(--green-light)] text-[var(--green)]'
                              : 'bg-[var(--primary-light)] text-[var(--primary)]'
                          } hover:shadow-md`}
                        >
                          {gradeEmoji[event.grade] || '📚'} {event.student_name}
                        </button>

                        {/* Hover tooltip */}
                        {isHovered && (
                          <div className="absolute z-50 left-0 top-full mt-1 w-56 bg-white rounded-xl border-2 border-gray-200 shadow-lg p-3 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{gradeEmoji[event.grade] || '📚'}</span>
                              <div>
                                <p className="text-sm font-black text-black">{event.student_name}</p>
                                <p className="text-[10px] text-gray-400 font-semibold">{event.grade} grade</p>
                              </div>
                            </div>

                            <div className="space-y-1 text-xs">
                              {event.time && (
                                <p className="flex items-center gap-1.5"><span className="text-gray-400">🕐</span><span className="font-semibold text-black">{event.time}</span></p>
                              )}
                              {event.session_length && (
                                <p className="flex items-center gap-1.5"><span className="text-gray-400">⏱️</span><span className="font-semibold text-black">{event.session_length} min</span></p>
                              )}
                              {focus && (
                                <p className="flex items-center gap-1.5"><span className="text-gray-400">🎯</span><span className="font-semibold text-black">{focus}</span></p>
                              )}
                              <p className="flex items-center gap-1.5">
                                <span className="text-gray-400">{event.type === 'completed' ? '✅' : '📋'}</span>
                                <span className={`font-bold ${event.type === 'completed' ? 'text-[var(--green)]' : 'text-[var(--primary)]'}`}>
                                  {event.type === 'completed' ? `Session ${event.ses_number} — completed` : 'Scheduled'}
                                </span>
                              </p>
                            </div>

                            <p className="text-[9px] text-gray-400 pt-1 border-t border-gray-100">Click to open student profile →</p>
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
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-[11px] text-gray-400 font-semibold">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: 'var(--green-light)' }} /> Completed</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: 'var(--primary-light)' }} /> Scheduled</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-black" /> Today</span>
      </div>

      {/* Upcoming sessions list */}
      {(() => {
        const upcoming = []
        Object.entries(eventsByDate).forEach(([date, events]) => {
          if (date < todayStr) return
          events.filter(e => e.type !== 'completed').forEach(e => upcoming.push({ ...e, date }))
        })
        upcoming.sort((a, b) => a.date.localeCompare(b.date))

        if (upcoming.length === 0) return null
        return (
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
            <h3 className="font-black text-black text-sm mb-3">📋 Upcoming Sessions</h3>
            <div className="space-y-2">
              {upcoming.slice(0, 10).map(event => (
                <button
                  key={event.id}
                  onClick={() => navigate(`/students/${event.student_id}`)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition"
                >
                  <span className="text-xl">{gradeEmoji[event.grade] || '📚'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black">{event.student_name}</p>
                    <p className="text-[11px] text-gray-400 font-semibold">
                      {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {event.time ? ` at ${event.time}` : ''}
                      {event.session_length ? ` · ${event.session_length} min` : ''}
                    </p>
                  </div>
                  <span className="text-gray-300">→</span>
                </button>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
