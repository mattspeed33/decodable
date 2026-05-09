import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { runMigration } from './lib/migration'

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
import ReportCard from './screens/ReportCard.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--bg)]">
        <NavBar />
        <main className="ml-56 max-w-4xl px-10 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/new" element={<NewStudent />} />
            <Route path="/students/:id" element={<StudentPage />} />
            <Route path="/students/:id/analysis" element={<AnalysisResult />} />
            <Route path="/students/:id/report" element={<ReportCard />} />
            <Route path="/students/:id/homework/new" element={<HomeworkSheet />} />
            <Route path="/students/:id/homework/:sheetId" element={<HomeworkSheetView />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/templates" element={<AssessmentTemplates />} />
            <Route path="/skills/:categoryId" element={<AssessmentTemplateDetail />} />
            <Route path="/homework" element={<HomeworkInbox />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
