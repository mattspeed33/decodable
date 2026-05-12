import { useState, useRef } from 'react'
import { Download, Upload, Trash2, Save, ExternalLink } from 'lucide-react'
import { BtnPrimary, BtnSecondary, Card } from '../components/v4/primitives.jsx'

const STORAGE_KEY = 'decodable_settings'
const ALL_STORAGE_KEYS = [
  'decodable_settings',
  'decodable_students',
  'decodable_assessments',
  'decodable_sessions',
  'decodable_emails',
  'decodable_assessment_templates',
  'decodable_template_assignments',
  'decodable_homework_sheets',
  'decodable_scheduled_sessions',
  'decodable_analyses',
  'decodable_report_cards',
]

function getSettings() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
}

const defaults = {
  tutor_name: '',
  tutor_email: '',
  business_name: '',
  default_session_length: 50,
  default_session_type: '1:1',
  default_total_sessions: 4,
  default_homework_length: 20,
  include_word_bank: true,
  include_bonus_challenge: true,
  email_signoff_name: '',
  email_tone: 'warm',
  auto_include_homework_summary: true,
}

const INPUT = 'w-full border border-[var(--v4-border)] rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--v4-ink)] bg-[var(--v4-surface)]'
const LABEL = 'block text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-1'
const SECTION_LABEL = 'text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px]'

export default function Settings() {
  const [settings, setSettings] = useState(() => ({ ...defaults, ...getSettings() }))
  const [saved, setSaved] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [importStatus, setImportStatus] = useState(null)
  const fileInputRef = useRef()

  function update(key, value) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  function handleSave(e) {
    e.preventDefault()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleExport() {
    const data = {}
    ALL_STORAGE_KEYS.forEach(key => {
      const val = localStorage.getItem(key)
      if (val) data[key] = JSON.parse(val)
    })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `decodable-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        let count = 0
        ALL_STORAGE_KEYS.forEach(key => {
          if (data[key]) {
            localStorage.setItem(key, JSON.stringify(data[key]))
            count++
          }
        })
        setImportStatus(`Imported ${count} data sections. Refresh to see changes.`)
        const stored = getSettings()
        setSettings(s => ({ ...s, ...stored }))
      } catch {
        setImportStatus('Failed to import — invalid file format.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleClearAll() {
    ALL_STORAGE_KEYS.forEach(key => localStorage.removeItem(key))
    setSettings(defaults)
    setShowClearConfirm(false)
    window.location.reload()
  }

  return (
    <div className="max-w-2xl space-y-5">
      <h2 className="text-[22px] font-bold text-[var(--v4-ink)] tracking-[-0.5px]">Settings</h2>

      <form onSubmit={handleSave} className="space-y-4">
        {/* PROFILE */}
        <Card className="space-y-3">
          <p className={SECTION_LABEL}>Profile</p>
          <div>
            <label className={LABEL}>Tutor name</label>
            <input className={INPUT} value={settings.tutor_name} onChange={e => update('tutor_name', e.target.value)} placeholder="Sarah" />
          </div>
          <div>
            <label className={LABEL}>Tutor email</label>
            <input className={INPUT} type="email" value={settings.tutor_email} onChange={e => update('tutor_email', e.target.value)} placeholder="sarah@example.com" />
          </div>
          <div>
            <label className={LABEL}>Business / practice name (optional)</label>
            <input className={INPUT} value={settings.business_name} onChange={e => update('business_name', e.target.value)} placeholder="Bright Readers Tutoring" />
          </div>
        </Card>

        {/* SESSION DEFAULTS */}
        <Card className="space-y-3">
          <p className={SECTION_LABEL}>Session Defaults</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Length</label>
              <select className={INPUT} value={settings.default_session_length} onChange={e => update('default_session_length', Number(e.target.value))}>
                {[30, 45, 50, 60, 65, 90].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Type</label>
              <select className={INPUT} value={settings.default_session_type} onChange={e => update('default_session_type', e.target.value)}>
                <option value="1:1">1:1</option>
                <option value="Pod">Pod</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Total sessions</label>
              <select className={INPUT} value={settings.default_total_sessions} onChange={e => update('default_total_sessions', e.target.value)}>
                <option value="4">4</option>
                <option value="8">8</option>
                <option value="12">12</option>
                <option value="ongoing">Ongoing</option>
              </select>
            </div>
          </div>
        </Card>

        {/* HOMEWORK */}
        <Card className="space-y-3">
          <p className={SECTION_LABEL}>Homework Preferences</p>
          <div>
            <label className={LABEL}>Default homework length</label>
            <select className={INPUT} value={settings.default_homework_length} onChange={e => update('default_homework_length', Number(e.target.value))}>
              <option value={15}>15 min</option>
              <option value={20}>20 min</option>
              <option value={30}>30 min</option>
            </select>
          </div>
          <Toggle
            label="Include word bank on worksheets"
            sub="Shows a word bank at the top of kid worksheets"
            checked={settings.include_word_bank}
            onChange={v => update('include_word_bank', v)}
          />
          <Toggle
            label="Include bonus challenge"
            sub="Adds a fun extra challenge at the end"
            checked={settings.include_bonus_challenge}
            onChange={v => update('include_bonus_challenge', v)}
          />
        </Card>

        {/* EMAIL */}
        <Card className="space-y-3">
          <p className={SECTION_LABEL}>Parent Email Defaults</p>
          <div>
            <label className={LABEL}>Email sign-off name</label>
            <input className={INPUT} value={settings.email_signoff_name} onChange={e => update('email_signoff_name', e.target.value)} placeholder="Sarah" />
            <p className="text-[11px] text-[var(--v4-ink-3)] mt-1">How you sign emails. Defaults to tutor name if empty.</p>
          </div>
          <div>
            <label className={LABEL}>Default tone</label>
            <div className="flex gap-1.5">
              {['warm', 'professional', 'casual'].map(tone => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => update('email_tone', tone)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition capitalize ${
                    settings.email_tone === tone
                      ? 'bg-[var(--v4-ink)] text-white'
                      : 'bg-[var(--v4-surface)] text-[var(--v4-ink-2)] border border-[var(--v4-border)] hover:bg-[var(--v4-surface-3)]'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
          <Toggle
            label="Auto-include homework summary"
            sub="Mentions what homework was assigned in the parent email"
            checked={settings.auto_include_homework_summary}
            onChange={v => update('auto_include_homework_summary', v)}
          />
        </Card>

        <BtnPrimary type="submit" className="w-full justify-center py-2.5">
          <Save className="w-3.5 h-3.5" /> {saved ? 'Saved' : 'Save Settings'}
        </BtnPrimary>
      </form>

      {/* DATA MANAGEMENT */}
      <Card className="space-y-2.5">
        <p className={SECTION_LABEL}>Data Management</p>

        <BtnSecondary onClick={handleExport} className="w-full justify-center py-2.5">
          <Download className="w-3.5 h-3.5" /> Export All Data (JSON Backup)
        </BtnSecondary>

        <BtnSecondary onClick={() => fileInputRef.current.click()} className="w-full justify-center py-2.5">
          <Upload className="w-3.5 h-3.5" /> Import Data from Backup
        </BtnSecondary>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

        {importStatus && (
          <div className={`rounded-md px-3 py-2 text-[12.5px] font-medium ${importStatus.includes('Failed') ? 'bg-[var(--v4-red-lt)] text-[var(--v4-red)]' : 'bg-[var(--v4-green-lt)] text-[var(--v4-green)]'}`}>
            {importStatus}
          </div>
        )}

        {!showClearConfirm ? (
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-md bg-[var(--v4-surface)] border border-[var(--v4-red-lt)] text-[12.5px] font-semibold text-[var(--v4-red)] hover:bg-[var(--v4-red-lt)]"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All Data
          </button>
        ) : (
          <div className="bg-[var(--v4-red-lt)] rounded-md p-3 space-y-2">
            <p className="text-[12.5px] font-semibold text-[var(--v4-red)]">
              This will permanently delete all students, assessments, sessions, emails, and homework. Are you sure?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClearAll}
                className="flex-1 bg-[var(--v4-red)] text-white py-1.5 rounded-md font-semibold text-[12px]"
              >
                Yes, delete everything
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 bg-[var(--v4-surface)] border border-[var(--v4-border)] text-[var(--v4-ink-2)] py-1.5 rounded-md font-semibold text-[12px]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ABOUT */}
      <Card className="space-y-1.5">
        <p className={SECTION_LABEL}>About</p>
        <div className="space-y-1 text-[12.5px]">
          <Row label="Version" value="1.0.0" />
          <Row label="Storage" value="Neon Postgres · server" />
          <Row label="AI Model" value="Claude Sonnet 4.5" />
          <Row
            label="Source"
            value={
              <a href="https://github.com/mattspeed33/decodable" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--v4-ink)] hover:underline flex items-center gap-1">
                GitHub <ExternalLink className="w-3 h-3" />
              </a>
            }
          />
        </div>
      </Card>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--v4-ink-3)]">{label}</span>
      <span className="font-semibold text-[var(--v4-ink)]">{value}</span>
    </div>
  )
}

function Toggle({ label, sub, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[13px] font-semibold text-[var(--v4-ink)]">{label}</p>
        <p className="text-[11.5px] text-[var(--v4-ink-3)]">{sub}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${checked ? 'bg-[var(--v4-ink)]' : 'bg-[var(--v4-surface-3)]'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}
