import { useState, useEffect, useRef } from 'react'

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
  // Profile
  tutor_name: '',
  tutor_email: '',
  business_name: '',
  // Session Defaults
  default_session_length: 50,
  default_session_type: '1:1',
  default_total_sessions: 4,
  // Homework Preferences
  default_homework_length: 20,
  include_word_bank: true,
  include_bonus_challenge: true,
  // Parent Email Defaults
  email_signoff_name: '',
  email_tone: 'warm',
  auto_include_homework_summary: true,
}

export default function Settings() {
  const [settings, setSettings] = useState(defaults)
  const [saved, setSaved] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [importStatus, setImportStatus] = useState(null)
  const fileInputRef = useRef()

  useEffect(() => {
    const stored = getSettings()
    setSettings(s => ({ ...s, ...stored }))
  }, [])

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
        // Reload settings
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

  const inputClass = 'w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white'
  const labelClass = 'block text-sm font-bold text-black mb-1'
  const sectionClass = 'bg-white rounded-2xl border-2 border-gray-100 p-6 space-y-4'

  return (
    <div className="max-w-2xl">
      <h2 className="text-3xl font-black text-black tracking-tight mb-8">⚙️ Settings</h2>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── PROFILE ── */}
        <div className={sectionClass}>
          <h3 className="font-black text-black text-sm flex items-center gap-2">👤 Profile</h3>

          <div>
            <label className={labelClass}>Tutor Name</label>
            <input className={inputClass} value={settings.tutor_name} onChange={e => update('tutor_name', e.target.value)} placeholder="Sarah" />
          </div>

          <div>
            <label className={labelClass}>Tutor Email</label>
            <input className={inputClass} type="email" value={settings.tutor_email} onChange={e => update('tutor_email', e.target.value)} placeholder="sarah@example.com" />
          </div>

          <div>
            <label className={labelClass}>Business / Practice Name <span className="text-gray-400 font-normal">(optional)</span></label>
            <input className={inputClass} value={settings.business_name} onChange={e => update('business_name', e.target.value)} placeholder="Bright Readers Tutoring" />
          </div>
        </div>

        {/* ── SESSION DEFAULTS ── */}
        <div className={sectionClass}>
          <h3 className="font-black text-black text-sm flex items-center gap-2">🗓️ Session Defaults</h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Length</label>
              <select className={inputClass} value={settings.default_session_length} onChange={e => update('default_session_length', Number(e.target.value))}>
                {[30, 45, 50, 60, 65, 90].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select className={inputClass} value={settings.default_session_type} onChange={e => update('default_session_type', e.target.value)}>
                <option value="1:1">1:1</option>
                <option value="Pod">Pod</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Total Sessions</label>
              <select className={inputClass} value={settings.default_total_sessions} onChange={e => update('default_total_sessions', e.target.value)}>
                <option value="4">4</option>
                <option value="8">8</option>
                <option value="12">12</option>
                <option value="ongoing">Ongoing</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── HOMEWORK PREFERENCES ── */}
        <div className={sectionClass}>
          <h3 className="font-black text-black text-sm flex items-center gap-2">✏️ Homework Preferences</h3>

          <div>
            <label className={labelClass}>Default Homework Length</label>
            <select className={inputClass} value={settings.default_homework_length} onChange={e => update('default_homework_length', Number(e.target.value))}>
              <option value={15}>15 min</option>
              <option value={20}>20 min</option>
              <option value={30}>30 min</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-black">Include word bank on worksheets</p>
              <p className="text-xs text-gray-400">Shows a word bank at the top of kid worksheets</p>
            </div>
            <ToggleSwitch checked={settings.include_word_bank} onChange={v => update('include_word_bank', v)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-black">Include bonus challenge</p>
              <p className="text-xs text-gray-400">Adds a fun extra challenge at the end</p>
            </div>
            <ToggleSwitch checked={settings.include_bonus_challenge} onChange={v => update('include_bonus_challenge', v)} />
          </div>
        </div>

        {/* ── PARENT EMAIL DEFAULTS ── */}
        <div className={sectionClass}>
          <h3 className="font-black text-black text-sm flex items-center gap-2">✉️ Parent Email Defaults</h3>

          <div>
            <label className={labelClass}>Email Sign-off Name</label>
            <input className={inputClass} value={settings.email_signoff_name} onChange={e => update('email_signoff_name', e.target.value)} placeholder="Sarah" />
            <p className="text-xs text-gray-400 mt-1">How you sign your emails. Defaults to tutor name if empty.</p>
          </div>

          <div>
            <label className={labelClass}>Default Tone</label>
            <div className="flex gap-2">
              {['warm', 'professional', 'casual'].map(tone => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => update('email_tone', tone)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition capitalize ${
                    settings.email_tone === tone
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-gray-50 text-gray-500 hover:text-black'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-black">Auto-include homework summary</p>
              <p className="text-xs text-gray-400">Mentions what homework was assigned in the parent email</p>
            </div>
            <ToggleSwitch checked={settings.auto_include_homework_summary} onChange={v => update('auto_include_homework_summary', v)} />
          </div>
        </div>

        {/* ── SAVE BUTTON ── */}
        <button type="submit" className="w-full bg-[var(--primary)] text-white py-3.5 rounded-full font-bold hover:bg-[var(--primary-hover)] transition shadow-sm">
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </form>

      {/* ── DATA MANAGEMENT ── */}
      <div className={`${sectionClass} mt-6`}>
        <h3 className="font-black text-black text-sm flex items-center gap-2">💾 Data Management</h3>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleExport}
            className="w-full bg-white border-2 border-gray-100 py-3 rounded-full font-bold text-black hover:border-[var(--primary)] transition text-sm"
          >
            📥 Export All Data (JSON Backup)
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="w-full bg-white border-2 border-gray-100 py-3 rounded-full font-bold text-black hover:border-[var(--primary)] transition text-sm"
          >
            📤 Import Data from Backup
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

          {importStatus && (
            <div className={`rounded-xl p-3 text-sm font-bold ${importStatus.includes('Failed') ? 'bg-[var(--red-light)] text-[var(--red)]' : 'bg-[var(--green-light)] text-[var(--green)]'}`}>
              {importStatus}
            </div>
          )}

          {!showClearConfirm ? (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="w-full bg-white border-2 border-red-200 py-3 rounded-full font-bold text-[var(--red)] hover:bg-[var(--red-light)] transition text-sm"
            >
              🗑️ Clear All Data
            </button>
          ) : (
            <div className="bg-[var(--red-light)] rounded-2xl border-2 border-red-200 p-4 space-y-3">
              <p className="text-sm font-bold text-[var(--red)]">Are you sure? This will permanently delete all students, assessments, sessions, emails, and homework.</p>
              <div className="flex gap-3">
                <button type="button" onClick={handleClearAll} className="flex-1 bg-[var(--red)] text-white py-2.5 rounded-full font-bold text-sm">
                  Yes, delete everything
                </button>
                <button type="button" onClick={() => setShowClearConfirm(false)} className="flex-1 bg-white border-2 border-gray-100 py-2.5 rounded-full font-bold text-black text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ABOUT ── */}
      <div className={`${sectionClass} mt-6 mb-8`}>
        <h3 className="font-black text-black text-sm flex items-center gap-2">ℹ️ About</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Version</span>
            <span className="font-bold text-black">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Storage</span>
            <span className="font-bold text-black">localStorage (browser only)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">AI Model</span>
            <span className="font-bold text-black">Claude Sonnet 4.5</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Source</span>
            <a href="https://github.com/mattspeed33/decodable" target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--primary)] hover:underline">
              GitHub ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-[var(--primary)]' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}
