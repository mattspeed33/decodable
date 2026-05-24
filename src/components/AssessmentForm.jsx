import { useState } from 'react'
import { Save, ExternalLink, Download, Printer } from 'lucide-react'
import { FORM_SCHEMAS, getEmptyFormData } from '../lib/assessmentFormSchemas'
import { getDefaultPdfPath } from '../lib/skillsCategories'
import PhotoUploader from './PhotoUploader.jsx'
import { BtnPrimary, BtnSecondary, Card, CloseBtn } from './v4/primitives.jsx'

const INPUT = 'w-full border border-[var(--v4-border)] rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--v4-ink)] bg-[var(--v4-surface)]'
const INPUT_SMALL = 'border border-[var(--v4-border)] rounded-md px-2 py-1 text-[12px] focus:outline-none focus:border-[var(--v4-ink)] bg-[var(--v4-surface)]'

// ── CHECK FIELD (✓ / ✗ toggle) ──
function CheckField({ value, onChange, label, expected, prompt, tag }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex gap-1 shrink-0 mt-0.5">
        <button
          type="button"
          onClick={() => onChange(value === true ? null : true)}
          className={`w-7 h-7 rounded-md text-[12px] font-bold border transition ${
            value === true
              ? 'bg-[var(--v4-green)] border-[var(--v4-green)] text-white'
              : 'bg-[var(--v4-surface)] border-[var(--v4-border)] text-[var(--v4-ink-3)] hover:border-[var(--v4-green)] hover:text-[var(--v4-green)]'
          }`}
        >
          ✓
        </button>
        <button
          type="button"
          onClick={() => onChange(value === false ? null : false)}
          className={`w-7 h-7 rounded-md text-[12px] font-bold border transition ${
            value === false
              ? 'bg-[var(--v4-red)] border-[var(--v4-red)] text-white'
              : 'bg-[var(--v4-surface)] border-[var(--v4-border)] text-[var(--v4-ink-3)] hover:border-[var(--v4-red)] hover:text-[var(--v4-red)]'
          }`}
        >
          ✗
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {tag && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--v4-purple-lt)] text-[var(--v4-purple)]">{tag}</span>}
          <p className="text-[13px] font-semibold text-[var(--v4-ink)]">{label}</p>
        </div>
        {prompt && <p className="text-[11.5px] text-[var(--v4-ink-3)] italic mt-0.5">{prompt}</p>}
        {expected && <p className="text-[11.5px] text-[var(--v4-ink-3)] mt-0.5">Expected: <span className="text-[var(--v4-green)] font-semibold">{expected}</span></p>}
      </div>
    </div>
  )
}

// ── CHECK GRID ──
function CheckGridField({ value = [], onChange, items, labels }) {
  function toggle(item) {
    if (value.includes(item)) onChange(value.filter(i => i !== item))
    else onChange([...value, item])
  }
  const displayLabels = labels || items
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {items.map((item, i) => (
        <button
          key={item}
          type="button"
          onClick={() => toggle(item)}
          className={`w-9 h-9 rounded-md text-[11.5px] font-semibold border transition flex flex-col items-center justify-center ${
            value.includes(item)
              ? 'bg-[var(--v4-green)] text-white border-[var(--v4-green)]'
              : 'bg-[var(--v4-surface)] text-[var(--v4-ink-3)] border-[var(--v4-border)] hover:border-[var(--v4-border-2)]'
          }`}
        >
          <span>{displayLabels[i]}</span>
        </button>
      ))}
      <span className="text-[10.5px] text-[var(--v4-ink-3)] font-semibold ml-2">{value.length}/{items.length}</span>
    </div>
  )
}

// ── LETTER GRID ──
function LetterGrid({ value = [], onChange, letters, letterCase }) {
  function toggle(letter) {
    if (value.includes(letter)) onChange(value.filter(l => l !== letter))
    else onChange([...value, letter])
  }
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {letters.map(letter => {
        const display = letterCase === 'lower' ? letter.toLowerCase() : letter
        return (
          <button
            key={letter}
            type="button"
            onClick={() => toggle(letter)}
            className={`w-8 h-8 rounded-md text-[13px] font-bold border transition ${
              value.includes(letter)
                ? 'bg-[var(--v4-green)] text-white border-[var(--v4-green)]'
                : 'bg-[var(--v4-surface)] text-[var(--v4-ink-2)] border-[var(--v4-border)] hover:border-[var(--v4-border-2)]'
            }`}
          >
            {display}
          </button>
        )
      })}
      <span className="text-[10.5px] text-[var(--v4-ink-3)] font-semibold ml-2">{value.length}/{letters.length}</span>
    </div>
  )
}

// ── SIGHT WORD GRID ──
function SightWordGrid({ value = {}, onChange, words }) {
  function set(word, rating) {
    const next = { ...value }
    if (next[word] === rating) delete next[word]
    else next[word] = rating
    onChange(next)
  }
  const counts = { A: 0, S: 0, X: 0 }
  Object.values(value).forEach(v => { if (counts[v] !== undefined) counts[v]++ })

  const RATING_STYLE = {
    A: 'bg-[var(--v4-green)] text-white border-[var(--v4-green)]',
    S: 'bg-[var(--v4-amber)] text-white border-[var(--v4-amber)]',
    X: 'bg-[var(--v4-red)] text-white border-[var(--v4-red)]',
  }

  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {words.map(word => (
          <div key={word} className="text-center">
            <p className="text-[12.5px] font-semibold text-[var(--v4-ink)] mb-1">{word}</p>
            <div className="flex gap-0.5 justify-center">
              {['A', 'S', 'X'].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set(word, r)}
                  className={`w-6 h-6 rounded text-[10px] font-bold border transition ${
                    value[word] === r
                      ? RATING_STYLE[r]
                      : 'bg-[var(--v4-surface)] text-[var(--v4-ink-3)] border-[var(--v4-border)]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-2 text-[10.5px] font-semibold">
        <span className="text-[var(--v4-green)]">A={counts.A} automatic</span>
        <span className="text-[var(--v4-amber)]">S={counts.S} slow</span>
        <span className="text-[var(--v4-red)]">X={counts.X} unknown</span>
      </div>
    </div>
  )
}

// ── SPELLING ROW ──
function SpellingRow({ value = {}, onChange, word }) {
  function update(k, v) { onChange({ ...value, [k]: v }) }
  const SCORE_STYLE = {
    C: 'bg-[var(--v4-green)] text-white border-[var(--v4-green)]',
    P: 'bg-[var(--v4-amber)] text-white border-[var(--v4-amber)]',
    X: 'bg-[var(--v4-red)] text-white border-[var(--v4-red)]',
  }
  return (
    <div className="flex items-center gap-2 py-1.5">
      <p className="text-[13px] font-semibold text-[var(--v4-ink)] w-16 shrink-0">{word}</p>
      <input
        className={`flex-1 ${INPUT_SMALL}`}
        placeholder="Student wrote"
        value={value.student_wrote || ''}
        onChange={e => update('student_wrote', e.target.value)}
      />
      <div className="flex gap-0.5 shrink-0">
        {['C', 'P', 'X'].map(s => (
          <button
            key={s}
            type="button"
            onClick={() => update('score', value.score === s ? '' : s)}
            className={`w-7 h-7 rounded-md text-[11px] font-bold border transition ${
              value.score === s
                ? SCORE_STYLE[s]
                : 'bg-[var(--v4-surface)] text-[var(--v4-ink-3)] border-[var(--v4-border)]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <input
        className={`w-24 ${INPUT_SMALL}`}
        placeholder="Error pattern"
        value={value.error || ''}
        onChange={e => update('error', e.target.value)}
      />
    </div>
  )
}

// ── FLUENCY SELECT ──
function FluencySelect({ value, onChange }) {
  const options = [
    { value: 'fluent', label: 'Fluent', tone: 'green' },
    { value: 'labored', label: 'Labored', tone: 'amber' },
    { value: 'word-by-word', label: 'Word-by-word', tone: 'red' },
  ]
  const TONE = {
    green: { bg: 'bg-[var(--v4-green-lt)]', border: 'border-[var(--v4-green)]', text: 'text-[var(--v4-green)]' },
    amber: { bg: 'bg-[var(--v4-amber-lt)]', border: 'border-[var(--v4-amber)]', text: 'text-[var(--v4-amber)]' },
    red:   { bg: 'bg-[var(--v4-red-lt)]',   border: 'border-[var(--v4-red)]',   text: 'text-[var(--v4-red)]' },
  }
  return (
    <div className="flex gap-1.5">
      {options.map(opt => {
        const t = TONE[opt.tone]
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(value === opt.value ? '' : opt.value)}
            className={`flex-1 py-1.5 rounded-md text-[12px] font-semibold border transition ${
              active
                ? `${t.bg} ${t.border} ${t.text}`
                : 'bg-[var(--v4-surface)] border-[var(--v4-border)] text-[var(--v4-ink-3)]'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ── SCORE 1-3 ──
function Score3Field({ value, onChange, label, criteria }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex-1">
        <p className="text-[13px] font-semibold text-[var(--v4-ink)]">{label}</p>
        <p className="text-[11.5px] text-[var(--v4-ink-3)]">{criteria}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        {[1, 2, 3].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === String(n) ? '' : String(n))}
            className={`w-7 h-7 rounded-md text-[13px] font-bold border transition ${
              value === String(n)
                ? 'bg-[var(--v4-ink)] text-white border-[var(--v4-ink)]'
                : 'bg-[var(--v4-surface)] text-[var(--v4-ink-3)] border-[var(--v4-border)] hover:border-[var(--v4-border-2)]'
            }`}
          >
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
    case 'check':            return <CheckField value={value} onChange={onChange} label={field.label} expected={field.expected} prompt={field.prompt} tag={field.tag} />
    case 'check-grid':       return <CheckGridField value={value} onChange={onChange} items={field.items} labels={field.labels} />
    case 'letter-grid':      return <LetterGrid value={value} onChange={onChange} letters={field.letters} letterCase={field.case} />
    case 'sight-word-grid':  return <SightWordGrid value={value} onChange={onChange} words={field.words} />
    case 'spelling-row':     return <SpellingRow value={value} onChange={onChange} word={field.word} />
    case 'fluency-select':   return <FluencySelect value={value} onChange={onChange} />
    case 'score-3':          return <Score3Field value={value} onChange={onChange} label={field.label} criteria={field.criteria} />
    case 'number':           return <input className={INPUT} type="number" value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} />
    case 'text':             return <input className={INPUT} type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} />
    case 'textarea':         return <textarea className={INPUT + ' h-20 resize-none'} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || 'Notes…'} />
    default:                 return null
  }
}

// ── MAIN FORM ──
export default function AssessmentForm({ categoryId, initialData, photos: initialPhotos, onSave, onCancel }) {
  const schema = FORM_SCHEMAS[categoryId]
  const [formData, setFormData] = useState(initialData || getEmptyFormData(categoryId))
  const [photos, setPhotos] = useState(initialPhotos || [])
  const [mode, setMode] = useState('digital')

  if (!schema) return <p className="text-[var(--v4-ink-3)]">Unknown assessment type.</p>

  function updateField(key, value) {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    onSave({ formData, photos, entryMethod: mode })
  }

  const pdfPath = getDefaultPdfPath(categoryId)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-[var(--v4-ink)]">{schema.label}</h3>
          {schema.subtitle && <p className="text-[11.5px] text-[var(--v4-ink-3)]">{schema.subtitle}</p>}
        </div>
        <CloseBtn onClick={onCancel} label="Cancel assessment" />
      </div>

      {/* Mode toggle */}
      <div className="inline-flex rounded-md bg-[var(--v4-surface-3)] p-0.5">
        <button
          type="button"
          onClick={() => setMode('digital')}
          className={`px-3 py-1.5 rounded-[5px] text-[12px] font-semibold transition ${
            mode === 'digital' ? 'bg-[var(--v4-surface)] text-[var(--v4-ink)] shadow-sm' : 'text-[var(--v4-ink-3)] hover:text-[var(--v4-ink)]'
          }`}
        >
          Fill digitally
        </button>
        <button
          type="button"
          onClick={() => setMode('paper')}
          className={`px-3 py-1.5 rounded-[5px] text-[12px] font-semibold transition ${
            mode === 'paper' ? 'bg-[var(--v4-surface)] text-[var(--v4-ink)] shadow-sm' : 'text-[var(--v4-ink-3)] hover:text-[var(--v4-ink)]'
          }`}
        >
          Use paper form
        </button>
      </div>

      {mode === 'paper' && pdfPath && (
        <div className="space-y-3">
          <div className="border border-[var(--v4-border)] rounded-[10px] overflow-hidden">
            <iframe src={pdfPath} className="w-full h-[500px]" title={`${schema.label} PDF`} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={pdfPath}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--v4-surface)] border border-[var(--v4-border)] text-[12.5px] font-medium text-[var(--v4-ink-2)] hover:bg-[var(--v4-surface-3)]"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open
            </a>
            <a
              href={pdfPath}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--v4-surface)] border border-[var(--v4-border)] text-[12.5px] font-medium text-[var(--v4-ink-2)] hover:bg-[var(--v4-surface-3)]"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
            <BtnSecondary onClick={() => { const w = window.open(pdfPath); w.addEventListener('load', () => { w.print() }) }}>
              <Printer className="w-3.5 h-3.5" /> Print
            </BtnSecondary>
          </div>
          <Card padding="p-4" className="space-y-2">
            <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px]">Upload completed form photos</p>
            <PhotoUploader photos={photos} setPhotos={setPhotos} />
          </Card>
        </div>
      )}

      {mode === 'digital' && (
        <div className="space-y-3">
          {schema.instruction && (
            <div className="bg-[var(--v4-amber-lt)] rounded-md p-3">
              <p className="text-[12px] text-[var(--v4-ink-2)] italic">{schema.instruction}</p>
            </div>
          )}

          {schema.sections.map((section, si) => (
            <Card key={si} padding="p-0" className="overflow-hidden">
              {section.title && (
                <div className="bg-[var(--v4-ink)] px-4 py-2.5 flex items-center gap-2">
                  {section.number && (
                    <span className="bg-[var(--v4-green)] text-white text-[11px] font-bold w-5 h-5 rounded flex items-center justify-center">
                      {section.number}
                    </span>
                  )}
                  <p className="text-[13px] font-semibold text-white">{section.title}</p>
                </div>
              )}

              <div className="p-4 space-y-3">
                {section.prompt && (
                  <div className="bg-[var(--v4-green-lt)] rounded-md p-2.5">
                    <p className="text-[12px] text-[var(--v4-ink-2)] italic">{section.prompt}</p>
                  </div>
                )}

                {section.passage && (
                  <div className="bg-[var(--v4-surface-2)] rounded-md p-3 border border-[var(--v4-border)]">
                    <p className="text-[13px] text-[var(--v4-ink-2)] leading-relaxed">{section.passage}</p>
                  </div>
                )}

                {section.fields.length > 0 && (
                  <div className="divide-y divide-[var(--v4-border)]">
                    {section.fields.map(field => (
                      <div key={field.key} className="py-1.5">
                        {field.type !== 'check' && field.type !== 'spelling-row' && field.type !== 'score-3' && field.label && (
                          <label className="block text-[11.5px] font-semibold text-[var(--v4-ink-3)] mb-1">{field.label}</label>
                        )}
                        <FormField field={field} value={formData[field.key]} onChange={v => updateField(field.key, v)} />
                      </div>
                    ))}
                  </div>
                )}

                {section.note && (
                  <div className="bg-[var(--v4-amber-lt)] rounded-md p-2.5">
                    <p className="text-[11.5px] text-[var(--v4-ink-2)]">{section.note}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}

          <Card padding="p-4" className="space-y-2">
            <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px]">Attach photos (optional)</p>
            <PhotoUploader photos={photos} setPhotos={setPhotos} />
          </Card>
        </div>
      )}

      <BtnPrimary onClick={handleSave} className="w-full justify-center py-2.5">
        <Save className="w-3.5 h-3.5" /> Save Assessment
      </BtnPrimary>
    </div>
  )
}
