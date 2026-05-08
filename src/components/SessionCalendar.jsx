import { useState } from 'react'
import { getScheduledSessions, saveScheduledSession, deleteScheduledSession } from '../lib/storage'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getMonthData(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return { firstDay, daysInMonth }
}

function formatDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function SessionCalendar({ studentId, sessions = [] }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [addingDate, setAddingDate] = useState(null)
  const [addTime, setAddTime] = useState('10:00')

  const scheduled = getScheduledSessions(studentId)
  const { firstDay, daysInMonth } = getMonthData(viewYear, viewMonth)
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Build lookup maps
  const completedDates = new Set(sessions.map(s => s.date))
  const scheduledByDate = {}
  scheduled.forEach(s => {
    if (!scheduledByDate[s.date]) scheduledByDate[s.date] = []
    scheduledByDate[s.date].push(s)
  })

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
    else setViewMonth(viewMonth - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
    else setViewMonth(viewMonth + 1)
  }

  function handleDayClick(day) {
    const dateStr = formatDate(viewYear, viewMonth, day)
    const isPast = new Date(dateStr) < new Date(today.toISOString().split('T')[0])
    if (isPast && !scheduledByDate[dateStr]) return
    setAddingDate(addingDate === dateStr ? null : dateStr)
  }

  function handleSchedule() {
    saveScheduledSession({
      id: crypto.randomUUID(),
      student_id: studentId,
      date: addingDate,
      time: addTime,
      created_at: new Date().toISOString()
    })
    setAddingDate(null)
  }

  function handleDelete(id) {
    deleteScheduledSession(id)
    setAddingDate(null)
  }

  const todayStr = today.toISOString().split('T')[0]

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-black text-sm">📅 Calendar</h3>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="text-gray-400 hover:text-black font-bold text-sm">←</button>
          <span className="text-sm font-bold text-black min-w-[140px] text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="text-gray-400 hover:text-black font-bold text-sm">→</button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wide py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-10" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = formatDate(viewYear, viewMonth, day)
          const isToday = dateStr === todayStr
          const isCompleted = completedDates.has(dateStr)
          const isScheduled = scheduledByDate[dateStr]?.length > 0
          const isSelected = addingDate === dateStr
          const isPast = new Date(dateStr) < new Date(todayStr)

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={`h-10 rounded-xl text-xs font-bold relative transition-all flex items-center justify-center ${
                isSelected
                  ? 'bg-[var(--primary)] text-white ring-2 ring-[var(--primary-light)]'
                  : isCompleted
                    ? 'bg-[var(--green-light)] text-[var(--green)]'
                    : isScheduled
                      ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                      : isToday
                        ? 'bg-black text-white'
                        : isPast
                          ? 'text-gray-300'
                          : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {day}
              {/* Dot indicators */}
              {(isCompleted || isScheduled) && !isSelected && (
                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isCompleted ? 'bg-[var(--green)]' : 'bg-[var(--primary)]'}`} />
              )}
            </button>
          )
        })}
      </div>

      {/* Schedule form / info for selected date */}
      {addingDate && (
        <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
          <p className="text-sm font-bold text-black">
            {new Date(addingDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>

          {/* Show completed session info */}
          {completedDates.has(addingDate) && (
            <div className="bg-[var(--green-light)] rounded-xl p-3 flex items-center gap-2">
              <span className="text-sm">✅</span>
              <p className="text-xs font-bold text-[var(--green)]">Session completed</p>
            </div>
          )}

          {/* Show existing scheduled sessions */}
          {scheduledByDate[addingDate]?.map(s => (
            <div key={s.id} className="bg-[var(--primary-light)] rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">🗓️</span>
                <p className="text-xs font-bold text-[var(--primary)]">Scheduled at {s.time}</p>
              </div>
              <button onClick={() => handleDelete(s.id)} className="text-[10px] font-bold text-[var(--red)] hover:underline">Remove</button>
            </div>
          ))}

          {/* Add new scheduled session */}
          {!completedDates.has(addingDate) && (
            <div className="flex gap-2 items-center">
              <input
                type="time"
                value={addTime}
                onChange={e => setAddTime(e.target.value)}
                className="border-2 border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              <button
                onClick={handleSchedule}
                className="bg-[var(--primary)] text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-[var(--primary-hover)] transition"
              >
                + Schedule Session
              </button>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-400 font-semibold">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-black inline-block" /> Today</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--green)' }} /> Completed</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--primary)' }} /> Scheduled</span>
      </div>
    </div>
  )
}
