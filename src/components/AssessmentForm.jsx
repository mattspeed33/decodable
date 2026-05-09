import { useState } from 'react'
import { FORM_SCHEMAS, getEmptyFormData } from '../lib/assessmentFormSchemas'
import { getDefaultPdfPath } from '../lib/skillsCategories'
import PhotoUploader from './PhotoUploader.jsx'

const inputClass = 'w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white'

// ── CHECK FIELD (✓ / ✗ toggle) ──
function CheckField({ value, onChange, label, expected, prompt, tag }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex gap-1.5 shrink-0 mt-0.5">
        <button type="button" onClick={() => onChange(value === true ? null : true)}
          className={`w-8 h-8 rounded-lg text-sm font-black border-2 transition ${value === true ? 'bg-[var(--green)] border-[var(--green)] text-white' : 'bg-white border-gray-200 text-gray-300 hover:border-green-300'}`}>
          ✓
        </button>
        <button type="button" onClick={() => onChange(value === false ? null : false)}
          className={`w-8 h-8 rounded-lg text-sm font-black border-2 transition ${value === false ? 'bg-[var(--red)] border-[var(--red)] text-white' : 'bg-white border-gray-200 text-gray-300 hover:border-red-300'}`}>
          ✗
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {tag && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)]">{tag}</span>}
          <p className="text-sm font-bold text-black">{label}</p>
        </div>
        {prompt && <p className="text-[11px] text-gray-400 italic mt-0.5">{prompt}</p>}
        {expected && <p className="text-[11px] text-gray-400 mt-0.5">Expected: <span className="text-[var(--green)] font-semibold">{expected}</span></p>}
      </div>
    </div>
  )
}

// ── CHECK GRID (multiple items, each ✓/✗) ──
function CheckGridField({ value = [], onChange, items, labels }) {
  function toggle(item) {
    if (value.includes(item)) onChange(value.filter(i => i !== item))
    else onChange([...value, item])
  }
  const displayLabels = labels || items
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <button key={item} type="button" onClick={() => toggle(item)}
          className={`w-10 h-10 rounded-lg text-xs font-black transition border-2 flex flex-col items-center justify-center ${
            value.includes(item)
              ? 'bg-[var(--green)] text-white border-[var(--green)]'
              : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
          }`}>
          <span>{displayLabels[i]}</span>
          <span className="text-[8px]">{value.includes(item) ? '✓' : ''}</span>
        </button>
      ))}
      <span className="text-[10px] text-gray-400 font-bold self-center ml-2">{value.length}/{items.length}</span>
    </div>
  )
}

// ── LETTER GRID (26 letters) ──
function LetterGrid({ value = [], onChange, letters, letterCase }) {
  function toggle(letter) {
    if (value.includes(letter)) onChange(value.filter(l => l !== letter))
    else onChange([...value, letter])
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {letters.map(letter => {
        const display = letterCase === 'lower' ? letter.toLowerCase() : letter
        return (
          <button key={letter} type="button" onClick={() => toggle(letter)}
            className={`w-9 h-9 rounded-lg text-sm font-black transition border-2 ${
              value.includes(letter)
                ? 'bg-[var(--green)] text-white border-[var(--green)]'
                : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
            }`}>
            {display}
          </button>
        )
      })}
      <span className="text-[10px] text-gray-400 font-bold self-center ml-2">{value.length}/{letters.length}</span>
    </div>
  )
}

// ── SIGHT WORD GRID (A/S/X per word) ──
function SightWordGrid({ value = {}, onChange, words }) {
  function set(word, rating) {
    const next = { ...value }
    if (next[word] === rating) delete next[word]
    else next[word] = rating
    onChange(next)
  }
  const counts = { A: 0, S: 0, X: 0 }
  Object.values(value).forEach(v => { if (counts[v] !== undefined) counts[v]++ })

  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {words.map(word => (
          <div key={word} className="text-center">
            <p className="text-sm font-black text-black mb-1">{word}</p>
            <div className="flex gap-0.5 justify-center">
              {['A', 'S', 'X'].map(r => (
                <button key={r} type="button" onClick={() => set(word, r)}
                  className={`w-6 h-6 rounded text-[10px] font-bold border transition ${
                    value[word] === r
                      ? r === 'A' ? 'bg-[var(--green)] text-white border-[var(--green)]'
                        : r === 'S' ? 'bg-[var(--orange)] text-white border-[var(--orange)]'
                        : 'bg-[var(--red)] text-white border-[var(--red)]'
                      : 'bg-white text-gray-400 border-gray-200'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-2 text-[10px] text-gray-400 font-semibold">
        <span className="text-[var(--green)]">A={counts.A} automatic</span>
        <span className="text-[var(--orange)]">S={counts.S} slow</span>
        <span className="text-[var(--red)]">X={counts.X} unknown</span>
      </div>
    </div>
  )
}

// ── SPELLING ROW (student_wrote + C/P/X + error) ──
function SpellingRow({ value = {}, onChange, word }) {
  function update(k, v) { onChange({ ...value, [k]: v }) }
  return (
    <div className="flex items-center gap-2 py-1.5">
      <p className="text-sm font-black text-black w-16 shrink-0">{word}</p>
      <input className="flex-1 border-2 border-gray-100 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
        placeholder="Student wrote" value={value.student_wrote || ''} onChange={e => update('student_wrote', e.target.value)} />
      <div className="flex gap-0.5 shrink-0">
        {['C', 'P', 'X'].map(s => (
          <button key={s} type="button" onClick={() => update('score', value.score === s ? '' : s)}
            className={`w-7 h-7 rounded-lg text-[10px] font-bold border-2 transition ${
              value.score === s
                ? s === 'C' ? 'bg-[var(--green)] text-white border-[var(--green)]'
                  : s === 'P' ? 'bg-[var(--orange)] text-white border-[var(--orange)]'
                  : 'bg-[var(--red)] text-white border-[var(--red)]'
                : 'bg-white text-gray-400 border-gray-200'
            }`}>
            {s}
          </button>
        ))}
      </div>
      <input className="w-24 border-2 border-gray-100 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
        placeholder="Error pattern" value={value.error || ''} onChange={e => update('error', e.target.value)} />
    </div>
  )
}

// ── FLUENCY SELECT ──
function FluencySelect({ value, onChange }) {
  const options = [
    { value: 'fluent', label: 'Fluent', color: 'var(--green)' },
    { value: 'labored', label: 'Labored', color: 'var(--orange)' },
    { value: 'word-by-word', label: 'Word-by-word', color: 'var(--red)' },
  ]
  return (
    <div className="flex gap-2">
      {options.map(opt => (
        <button key={opt.value} type="button" onClick={() => onChange(value === opt.value ? '' : opt.value)}
          className="flex-1 py-1.5 rounded-full text-xs font-bold transition border-2"
          style={value === opt.value
            ? { background: `color-mix(in srgb, ${opt.color} 12%, white)`, borderColor: opt.color, color: opt.color }
            : { background: 'white', borderColor: '#f3f4f6', color: '#9ca3af' }}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── SCORE 1-3 ──
function Score3Field({ value, onChange, label, criteria }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex-1">
        <p className="text-sm font-bold text-black">{label}</p>
        <p className="text-[11px] text-gray-400">{criteria}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        {[1, 2, 3].map(n => (
          <button key={n} type="button" onClick={() => onChange(value === String(n) ? '' : String(n))}
            className={`w-8 h-8 rounded-lg text-sm font-black border-2 transition ${
              value === String(n) ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
            }`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── FIELD RENDERER ──
function FormField({ field, value, onChange }) {
  switch (field.type) {
    case 'check':
      return <CheckField value={value} onChange={onChange} label={field.label} expected={field.expected} prompt={field.prompt} tag={field.tag} />
    case 'check-grid':
      return <CheckGridField value={value} onChange={onChange} items={field.items} labels={field.labels} />
    case 'letter-grid':
      return <LetterGrid value={value} onChange={onChange} letters={field.letters} letterCase={field.case} />
    case 'sight-word-grid':
      return <SightWordGrid value={value} onChange={onChange} words={field.words} />
    case 'spelling-row':
      return <SpellingRow value={value} onChange={onChange} word={field.word} />
    case 'fluency-select':
      return <FluencySelect value={value} onChange={onChange} />
    case 'score-3':
      return <Score3Field value={value} onChange={onChange} label={field.label} criteria={field.criteria} />
    case 'number':
      return <input className={inputClass} type="number" value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} />
    case 'text':
      return <input className={inputClass} type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} />
    case 'textarea':
      return <textarea className={inputClass + ' h-20 resize-none'} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || 'Notes...'} />
    default:
      return null
  }
}

// ── MAIN FORM ──
export default function AssessmentForm({ categoryId, initialData, photos: initialPhotos, onSave, onCancel }) {
  const schema = FORM_SCHEMAS[categoryId]
  const [formData, setFormData] = useState(initialData || getEmptyFormData(categoryId))
  const [photos, setPhotos] = useState(initialPhotos || [])
  const [mode, setMode] = useState('digital')

  if (!schema) return <p className="text-gray-400">Unknown assessment type.</p>

  function updateField(key, value) {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    onSave({ formData, photos, entryMethod: mode })
  }

  const pdfPath = getDefaultPdfPath(categoryId)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-black text-lg">{schema.label}</h3>
          {schema.subtitle && <p className="text-[11px] text-gray-400 font-semibold">{schema.subtitle}</p>}
        </div>
        <button onClick={onCancel} className="text-xs font-bold text-gray-400 hover:text-black transition">Cancel</button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode('digital')}
          className={`flex-1 py-2.5 rounded-full text-xs font-bold transition border-2 ${
            mode === 'digital' ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
          }`}>
          Fill Out Digitally
        </button>
        <button type="button" onClick={() => setMode('paper')}
          className={`flex-1 py-2.5 rounded-full text-xs font-bold transition border-2 ${
            mode === 'paper' ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
          }`}>
          Use Paper Form
        </button>
      </div>

      {mode === 'paper' && pdfPath && (
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-gray-100 overflow-hidden">
            <iframe src={pdfPath} className="w-full h-[500px]" title={`${schema.label} PDF`} />
          </div>
          <div className="flex gap-2">
            <a href={pdfPath} target="_blank" rel="noreferrer" className="flex-1 text-center bg-white border-2 border-gray-100 py-2.5 rounded-full text-xs font-bold text-black hover:border-[var(--primary)] transition">
              Open PDF
            </a>
            <a href={pdfPath} download className="flex-1 text-center bg-white border-2 border-gray-100 py-2.5 rounded-full text-xs font-bold text-black hover:border-[var(--primary)] transition">
              Download
            </a>
            <button onClick={() => { const w = window.open(pdfPath); w.addEventListener('load', () => { w.print() }) }}
              className="flex-1 text-center bg-white border-2 border-gray-100 py-2.5 rounded-full text-xs font-bold text-black hover:border-[var(--primary)] transition">
              Print
            </button>
          </div>
          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs font-black text-black mb-2">Upload completed form photos</p>
            <PhotoUploader photos={photos} setPhotos={setPhotos} />
          </div>
        </div>
      )}

      {mode === 'digital' && (
        <div className="space-y-4">
          {/* Instruction banner */}
          {schema.instruction && (
            <div className="bg-[var(--gold-light)] rounded-xl p-3">
              <p className="text-xs text-gray-600 italic">{schema.instruction}</p>
            </div>
          )}

          {/* Sections */}
          {schema.sections.map((section, si) => (
            <div key={si} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
              {/* Section header */}
              {section.title && (
                <div className="bg-gray-800 px-5 py-2.5 flex items-center gap-2">
                  {section.number && (
                    <span className="bg-[var(--green)] text-white text-xs font-black w-6 h-6 rounded-lg flex items-center justify-center">{section.number}</span>
                  )}
                  <p className="text-sm font-black text-white">{section.title}</p>
                </div>
              )}

              <div className="p-5 space-y-3">
                {/* Prompt */}
                {section.prompt && (
                  <div className="bg-[var(--green-light)] rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-700 italic">{section.prompt}</p>
                  </div>
                )}

                {/* Passage text */}
                {section.passage && (
                  <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                    <p className="text-sm text-gray-800 leading-relaxed">{section.passage}</p>
                  </div>
                )}

                {/* Fields */}
                {section.fields.length > 0 && (
                  <div className="divide-y divide-gray-50">
                    {section.fields.map(field => (
                      <div key={field.key} className="py-1">
                        {/* Only show label for non-check types (checks render their own label) */}
                        {field.type !== 'check' && field.type !== 'spelling-row' && field.type !== 'score-3' && field.label && (
                          <label className="text-xs font-semibold text-gray-600 block mb-1">{field.label}</label>
                        )}
                        <FormField field={field} value={formData[field.key]} onChange={v => updateField(field.key, v)} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Section note/tip */}
                {section.note && (
                  <div className="bg-[var(--gold-light)] rounded-lg px-3 py-2 border border-yellow-200">
                    <p className="text-[11px] text-gray-600">{section.note}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Optional photos */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Attach Photos (optional)</p>
            <PhotoUploader photos={photos} setPhotos={setPhotos} />
          </div>
        </div>
      )}

      <button onClick={handleSave}
        className="w-full bg-[var(--primary)] text-white py-3 rounded-full font-bold hover:bg-[var(--primary-hover)] transition shadow-sm">
        Save Assessment
      </button>
    </div>
  )
}
