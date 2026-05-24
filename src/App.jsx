import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react'
import { Check } from 'lucide-react'
import { runMigration } from './lib/migration'
import { maybeMigrateOnce } from './lib/firstRunMigration'

runMigration()

import NavBar from './components/NavBar.jsx'
import Dashboard from './screens/Dashboard.jsx'
import Students from './screens/Students.jsx'
import NewStudent from './screens/NewStudent.jsx'
import StudentPage from './screens/StudentPage.jsx'
import AnalysisResult from './screens/AnalysisResult.jsx'
import HomeworkSheet from './screens/HomeworkSheet.jsx'
import HomeworkSheetView from './screens/HomeworkSheetView.jsx'
import Settings from './screens/Settings.jsx'
import AssessmentTemplates from './screens/AssessmentTemplates.jsx'
import AssessmentTemplateDetail from './screens/AssessmentTemplateDetail.jsx'
import HomeworkInbox from './screens/HomeworkInbox.jsx'
import CalendarPage from './screens/CalendarPage.jsx'

function MigrationGate({ children }) {
  const [ready, setReady] = useState(false)
  const [imported, setImported] = useState(null)

  useEffect(() => {
    maybeMigrateOnce()
      .then(({ migrated, counts }) => {
        if (migrated && Object.keys(counts).length > 0) setImported(counts)
        setReady(true)
      })
      .catch(err => {
        console.error('First-run migration failed:', err)
        setReady(true)
      })
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--v4-bg)]">
        <p className="text-[13px] font-medium text-[var(--v4-ink-3)]">Preparing your account…</p>
      </div>
    )
  }

  return (
    <>
      {imported && <ImportBanner counts={imported} onDismiss={() => setImported(null)} />}
      {children}
    </>
  )
}

function ImportBanner({ counts, onDismiss }) {
  const lines = Object.entries(counts).map(([slug, n]) => `${n} ${slug.replace('-', ' ')}`).join(' · ')
  return (
    <div className="fixed top-4 right-4 left-[236px] z-50 bg-[var(--v4-surface)] border border-[var(--v4-border)] rounded-[10px] p-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-md bg-[var(--v4-green-lt)] text-[var(--v4-green)] flex items-center justify-center shrink-0">
        <Check className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[var(--v4-ink)]">Imported your existing data</p>
        <p className="text-[11.5px] text-[var(--v4-ink-3)] truncate">{lines}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-[11.5px] font-medium text-[var(--v4-ink-3)] hover:text-[var(--v4-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--v4-ink)] focus-visible:outline-offset-2 rounded-sm px-1"
      >
        Dismiss
      </button>
    </div>
  )
}

// Default layout: global NavBar on the left, constrained main area. Used for
// every route except the V4 student view, which takes over the full viewport.
function DefaultLayout() {
  return (
    <div className="min-h-screen bg-[var(--v4-bg)]">
      <NavBar />
      <main className="ml-[220px] max-w-6xl px-8 py-7">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-[var(--v4-bg)] p-6">
          <SignIn routing="hash" />
        </div>
      </SignedOut>
      <SignedIn>
        <MigrationGate>
          <BrowserRouter>
            <Routes>
              <Route path="/students/:id" element={<StudentPage />} />
              <Route element={<DefaultLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/students" element={<Students />} />
                <Route path="/students/new" element={<NewStudent />} />
                <Route path="/students/:id/analysis" element={<AnalysisResult />} />
                <Route path="/students/:id/homework/new" element={<HomeworkSheet />} />
                <Route path="/students/:id/homework/:sheetId" element={<HomeworkSheetView />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/templates" element={<AssessmentTemplates />} />
                <Route path="/skills/:categoryId" element={<AssessmentTemplateDetail />} />
                <Route path="/homework" element={<HomeworkInbox />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </MigrationGate>
      </SignedIn>
    </>
  )
}
