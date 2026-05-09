import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { saveAnalysis, getStudent } from '../lib/storage'

export default function AnalysisResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const student = getStudent(id)
  const [data, setData] = useState(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('decodable_pending_analysis')
    if (raw) {
      setData(JSON.parse(raw))
    }
  }, [])

  if (!data) {
    return (
      <div className="text-center py-20">
        <span className="text-5xl block mb-3">📸</span>
        <p className="text-gray-400 font-bold">No analysis data found</p>
        <p className="text-gray-400 text-sm">Upload an assessment first.</p>
      </div>
    )
  }

  const a = data.ai_analysis

  function handleSave() {
    const analysis = {
      id: crypto.randomUUID(),
      student_id: data.student_id,
      date: data.date,
      assessment_ids: data.assessment_ids || [],
      ai_analysis: data.ai_analysis,
      created_at: new Date().toISOString(),
    }
    saveAnalysis(analysis)
    sessionStorage.removeItem('decodable_pending_analysis')
    navigate(`/students/${id}`)
  }

  function handleDiscard() {
    sessionStorage.removeItem('decodable_pending_analysis')
    navigate(`/students/${id}/upload`)
  }

  const ropeColors = {
    'Strength': { bg: 'bg-[var(--green-light)]', text: 'text-[var(--green)]' },
    'Emerging': { bg: 'bg-[var(--orange-light)]', text: 'text-[var(--orange)]' },
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <h2 className="text-3xl font-black text-black tracking-tight">{student?.name}</h2>
        <p className="text-sm text-gray-400 font-semibold">{data.date}</p>
      </div>

      {/* Badges */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs bg-[var(--blue-light)] text-[var(--blue)] px-3 py-1 rounded-full font-bold">
          📖 {a.passage_level_reached} level
        </span>
        <span className="text-xs px-3 py-1 rounded-full font-bold" style={{
          background: a.fluency_estimate_pct >= 80 ? 'var(--green-light)' : a.fluency_estimate_pct >= 50 ? 'var(--orange-light)' : 'var(--red-light)',
          color: a.fluency_estimate_pct >= 80 ? 'var(--green)' : a.fluency_estimate_pct >= 50 ? 'var(--orange)' : 'var(--red)'
        }}>
          🎯 Fluency {a.fluency_estimate_pct}%
        </span>
        <span className="text-xs bg-[var(--primary-light)] text-[var(--primary)] px-3 py-1 rounded-full font-bold">
          📘 UFLI Unit {a.ufli_placement.current_working_unit}
        </span>
      </div>

      {/* Strengths */}
      <div className="bg-[var(--green-light)] rounded-2xl border-2 border-green-200 p-5">
        <h3 className="text-sm font-black text-[var(--green)] mb-2">💪 What's solid</h3>
        <ul className="space-y-1.5">
          {a.strengths.map((s, i) => (
            <li key={i} className="text-sm text-gray-800 flex gap-2 items-start"><span className="text-[var(--green)]">✓</span><span>{s}</span></li>
          ))}
        </ul>
      </div>

      {/* Gaps */}
      <div className="bg-[var(--red-light)] rounded-2xl border-2 border-red-200 p-5">
        <h3 className="text-sm font-black text-[var(--red)] mb-2">🎯 Where to focus</h3>
        <ul className="space-y-2">
          {a.priority_gaps.map((gap, i) => (
            <li key={i} className="text-sm text-gray-800 flex gap-2 items-start">
              <span className="bg-white text-[var(--red)] text-xs font-black w-5 h-5 rounded-md flex items-center justify-center shrink-0">{gap.rank}</span>
              <span><span className="font-bold text-black">{gap.gap}</span> — <span className="text-gray-600">{gap.why_it_matters}</span></span>
            </li>
          ))}
        </ul>
      </div>

      {/* Watch list */}
      {a.patterns_to_watch?.length > 0 && (
        <div className="bg-[var(--orange-light)] rounded-2xl border-2 border-orange-200 p-5">
          <h3 className="text-sm font-black text-[var(--orange)] mb-2">⚠️ Keep an eye on</h3>
          <ul className="space-y-1.5">
            {a.patterns_to_watch.map((p, i) => (
              <li key={i} className="text-sm text-gray-800 flex gap-2 items-start"><span className="text-[var(--orange)]">●</span><span>{p}</span></li>
            ))}
          </ul>
        </div>
      )}

      {/* UFLI */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
        <h3 className="text-sm font-black text-black mb-3">📘 UFLI Placement</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-gray-50 p-3 border-2 border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Mastered</p>
            <p className="text-xl font-black text-black mt-1">{a.ufli_placement.last_unit_mastered}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{a.ufli_placement.last_unit_name}</p>
          </div>
          <div className="rounded-xl bg-[var(--primary-light)] p-3 border-2 border-[var(--primary)]">
            <p className="text-[10px] text-[var(--primary)] uppercase font-bold tracking-wide">Working on</p>
            <p className="text-xl font-black text-[var(--primary)] mt-1">{a.ufli_placement.current_working_unit}</p>
            <p className="text-[10px] text-[var(--primary)] mt-0.5">{a.ufli_placement.current_unit_name}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 border-2 border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Next up</p>
            <p className="text-xl font-black text-black mt-1">{a.ufli_placement.next_unlock_unit}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{a.ufli_placement.next_unlock_name}</p>
          </div>
        </div>
      </div>

      {/* 4-Week Plan */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
        <h3 className="text-sm font-black text-black mb-3">📅 4-Week Plan</h3>
        <ul className="space-y-2">
          {(a.week_arc || a.four_week_arc).map((week, i) => (
            <li key={i} className="text-sm flex gap-2.5 items-start">
              <span className="bg-[var(--primary-light)] text-[var(--primary)] text-xs font-black w-7 h-7 rounded-lg flex items-center justify-center shrink-0">{week.week}</span>
              <span><span className="font-bold text-black">{week.focus}</span> <span className="text-gray-400">— {week.activity_type}</span></span>
            </li>
          ))}
        </ul>
      </div>

      {/* Detailed breakdown */}
      <details className="bg-white rounded-2xl border-2 border-gray-100">
        <summary className="p-5 text-sm font-black text-black cursor-pointer">🔬 Detailed breakdown</summary>
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">Scarborough's Rope</p>
            <ul className="space-y-1.5">
              {['phonological_awareness', 'decoding', 'sight_recognition', 'vocabulary', 'verbal_reasoning'].map(key => {
                const val = a.scarboroughs_rope[key]
                const c = ropeColors[val] || { bg: 'bg-gray-100', text: 'text-gray-500' }
                return (
                  <li key={key} className="text-sm flex justify-between items-center">
                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className={`${c.bg} ${c.text} text-xs font-bold px-2.5 py-0.5 rounded-full`}>{val}</span>
                  </li>
                )
              })}
              <li className="text-xs text-[var(--orange)] font-bold mt-2">⚠️ Weakest: {a.scarboroughs_rope.weakest_thread}</li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-1 tracking-wide">Hegarty Phonemic Awareness</p>
            <p className="text-sm text-gray-700">Solid through <span className="font-bold text-[var(--green)]">{a.hegarty_placement.highest_mastered}</span>, breaking down at <span className="font-bold text-[var(--orange)]">{a.hegarty_placement.breaking_down_at}</span></p>
            {a.hegarty_placement.notes && <p className="text-xs text-gray-500 mt-0.5">{a.hegarty_placement.notes}</p>}
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-1 tracking-wide">Fluency Note</p>
            <p className="text-sm text-gray-700">{a.fluency_rationale}</p>
          </div>
        </div>
      </details>

      <p className="text-[10px] text-gray-300 text-center">Confidence: {a.confidence}</p>

      {/* Actions */}
      <div className="action-buttons flex gap-3">
        <button onClick={handleSave} className="flex-1 bg-[var(--primary)] text-white py-3.5 rounded-full font-bold hover:bg-[var(--primary-hover)] transition shadow-sm">
          ✓ Save
        </button>
        <button onClick={() => { handleSave(); navigate(`/students/${id}/session`); }} className="flex-1 bg-white border-2 border-gray-100 py-3.5 rounded-full font-bold text-black hover:border-[var(--primary)] transition">
          📋 Save & Plan
        </button>
        <button onClick={handleDiscard} className="bg-white border-2 border-gray-100 py-3.5 px-5 rounded-full text-sm text-gray-400 font-bold hover:border-[var(--red)] hover:text-[var(--red)] transition">
          ↩ Redo
        </button>
      </div>
    </div>
  )
}
