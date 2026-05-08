import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { getStudent, getLatestAssessment } from '../lib/storage'
import StudentProfile from './StudentProfile.jsx'
import UploadAssessment from './UploadAssessment.jsx'
import SessionPlan from './SessionPlan.jsx'
import ParentEmail from './ParentEmail.jsx'
import StudentTemplates from './StudentTemplates.jsx'
import HomeworkInbox from './HomeworkInbox.jsx'

const tabs = [
  { key: 'overview', label: 'Overview', icon: '🏠' },
  { key: 'upload', label: 'Upload', icon: '📸' },
  { key: 'session', label: 'Session', icon: '🗓️' },
  { key: 'email', label: 'Email', icon: '✉️' },
  { key: 'templates', label: 'Assessment Library', icon: '📋' },
  { key: 'homework', label: 'Homework', icon: '✏️' },
]

export default function StudentPage() {
  const { id, tab: urlTab } = useParams()
  const [activeTab, setActiveTab] = useState(urlTab || 'overview')
  const student = getStudent(id)

  if (!student) {
    return <p className="text-center text-gray-400 py-20">Student not found.</p>
  }

  function renderContent() {
    switch (activeTab) {
      case 'overview': return <StudentProfile studentId={id} onNavigateTab={setActiveTab} />
      case 'upload': return <UploadAssessment studentId={id} />
      case 'session': return <SessionPlan studentId={id} />
      case 'email': return <ParentEmail studentId={id} />
      case 'templates': return <StudentTemplates studentId={id} />
      case 'homework': return <HomeworkInbox studentId={id} />
      default: return <StudentProfile studentId={id} onNavigateTab={setActiveTab} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="screen-nav flex flex-wrap gap-2 rounded-2xl bg-white border-2 border-gray-100 p-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === tab.key
                ? 'bg-[var(--primary)] text-white'
                : 'text-gray-500 hover:text-black hover:bg-gray-50'
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  )
}
