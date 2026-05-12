import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { saveStudent } from '../lib/storage'
import { BtnPrimary, Card } from '../components/v4/primitives.jsx'

const INPUT = 'w-full border border-[var(--v4-border)] rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--v4-ink)] bg-[var(--v4-surface)]'
const LABEL = 'block text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-1'

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
    notes_from_parent: '',
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
        el_education: true,
      },
      created_at: new Date().toISOString(),
    }
    await saveStudent(student)
    navigate(`/students/${student.id}`)
  }

  return (
    <div className="max-w-2xl space-y-5">
      <button
        onClick={() => navigate('/students')}
        className="flex items-center gap-1 text-[11.5px] text-[var(--v4-ink-3)] hover:text-[var(--v4-ink)] font-medium"
      >
        <ArrowLeft className="w-3 h-3" /> Students
      </button>

      <h2 className="text-[22px] font-bold text-[var(--v4-ink)] tracking-[-0.5px]">Add Student</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="space-y-3">
          <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px]">Student</p>
          <div>
            <label className={LABEL}>Student first name</label>
            <input className={INPUT} required value={form.name} onChange={e => update('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Grade</label>
              <select className={INPUT} value={form.grade} onChange={e => update('grade', e.target.value)}>
                <option value="K">K</option>
                <option value="1st">1st</option>
                <option value="2nd">2nd</option>
                <option value="3rd">3rd</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Age</label>
              <input className={INPUT} type="number" min="4" max="12" required value={form.age} onChange={e => update('age', e.target.value)} />
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px]">Session</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Type</label>
              <select className={INPUT} value={form.session_type} onChange={e => update('session_type', e.target.value)}>
                <option value="1:1">1:1</option>
                <option value="Pod">Pod</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Length</label>
              <select className={INPUT} value={form.session_length_minutes} onChange={e => update('session_length_minutes', Number(e.target.value))}>
                {[30, 45, 50, 60, 65, 90].map(m => (
                  <option key={m} value={m}>{m} min</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Engagement</label>
              <select className={INPUT} value={form.total_sessions_planned} onChange={e => update('total_sessions_planned', e.target.value)}>
                <option value="4">4 weeks</option>
                <option value="8">8 weeks</option>
                <option value="12">12 weeks</option>
                <option value="ongoing">Ongoing</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Start date</label>
              <input className={INPUT} type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Session day</label>
              <select className={INPUT} value={form.session_day} onChange={e => update('session_day', e.target.value)}>
                <option value="">Select day…</option>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Session time</label>
              <input className={INPUT} type="time" value={form.session_time} onChange={e => update('session_time', e.target.value)} />
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px]">Parent & Tutor</p>
          <div>
            <label className={LABEL}>Tutor name</label>
            <input className={INPUT} required value={form.tutor_name} onChange={e => update('tutor_name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Parent name</label>
              <input className={INPUT} value={form.parent_name} onChange={e => update('parent_name', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Parent email</label>
              <input className={INPUT} type="email" value={form.parent_email} onChange={e => update('parent_email', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Notes from parent</label>
            <textarea className={INPUT + ' h-20 resize-none'} value={form.notes_from_parent} onChange={e => update('notes_from_parent', e.target.value)} />
          </div>
        </Card>

        <BtnPrimary type="submit" className="w-full justify-center py-2.5">
          <Save className="w-3.5 h-3.5" /> Save Student
        </BtnPrimary>
      </form>
    </div>
  )
}
