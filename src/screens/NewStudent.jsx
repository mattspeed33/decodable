import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveStudent } from '../lib/storage'

export default function NewStudent() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    grade: '1st',
    age: '',
    session_type: '1:1',
    session_length_minutes: 50,
    total_sessions_planned: 4,
    start_date: new Date().toISOString().split('T')[0],
    session_day: '',
    session_time: '',
    parent_name: '',
    parent_email: '',
    tutor_name: '',
    notes_from_parent: ''
  })

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const student = {
      ...form,
      id: crypto.randomUUID(),
      age: Number(form.age),
      total_sessions_planned: form.total_sessions_planned === 'ongoing' ? 999 : Number(form.total_sessions_planned),
      curriculum_flags: {
        science_of_reading: true,
        scarboroughs_rope: true,
        hegarty: true,
        ufli: true,
        el_education: true
      },
      created_at: new Date().toISOString()
    }
    await saveStudent(student)
    navigate(`/students/${student.id}`)
  }

  const inputClass = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'
  const labelClass = 'block text-sm font-semibold text-black mb-1'

  return (
    <div className="max-w-lg">
      <h2 className="text-3xl font-black text-black tracking-tight mb-8">Add Student</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelClass}>Student First Name</label>
          <input className={inputClass} required value={form.name} onChange={e => update('name', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Grade</label>
            <select className={inputClass} value={form.grade} onChange={e => update('grade', e.target.value)}>
              <option value="K">K</option>
              <option value="1st">1st</option>
              <option value="2nd">2nd</option>
              <option value="3rd">3rd</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Age</label>
            <input className={inputClass} type="number" min="4" max="12" required value={form.age} onChange={e => update('age', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Session Type</label>
            <select className={inputClass} value={form.session_type} onChange={e => update('session_type', e.target.value)}>
              <option value="1:1">1:1</option>
              <option value="Pod">Pod</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Session Length</label>
            <select className={inputClass} value={form.session_length_minutes} onChange={e => update('session_length_minutes', Number(e.target.value))}>
              {[30, 45, 50, 60, 65, 90].map(m => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Engagement Length</label>
            <select className={inputClass} value={form.total_sessions_planned} onChange={e => update('total_sessions_planned', e.target.value)}>
              <option value="4">4 weeks</option>
              <option value="8">8 weeks</option>
              <option value="12">12 weeks</option>
              <option value="ongoing">Ongoing</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Start Date</label>
            <input className={inputClass} type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Session Day</label>
            <select className={inputClass} value={form.session_day} onChange={e => update('session_day', e.target.value)}>
              <option value="">Select day...</option>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Session Time</label>
            <input className={inputClass} type="time" value={form.session_time} onChange={e => update('session_time', e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Tutor Name</label>
          <input className={inputClass} required value={form.tutor_name} onChange={e => update('tutor_name', e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>Parent Name</label>
          <input className={inputClass} value={form.parent_name} onChange={e => update('parent_name', e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>Parent Email</label>
          <input className={inputClass} type="email" value={form.parent_email} onChange={e => update('parent_email', e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>Notes from Parent</label>
          <textarea className={inputClass + ' h-24'} value={form.notes_from_parent} onChange={e => update('notes_from_parent', e.target.value)} />
        </div>

        <button type="submit" className="w-full bg-[var(--primary)] text-white py-3 rounded-full font-semibold hover:bg-[var(--primary-hover)] transition">
          Save Student
        </button>
      </form>
    </div>
  )
}
