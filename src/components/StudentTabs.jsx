import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { key: 'overview', label: 'Overview', path: (id) => `/students/${id}` },
  { key: 'upload', label: 'Upload', path: (id) => `/students/${id}/upload` },
  { key: 'session', label: 'Session', path: (id) => `/students/${id}/session` },
  { key: 'email', label: 'Email', path: (id) => `/students/${id}/email` },
  { key: 'templates', label: 'Templates', path: (id) => `/students/${id}/templates` },
  { key: 'homework', label: 'Homework', path: (id) => `/students/${id}/homework` },
]

export default function StudentTabs({ studentId }) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="screen-nav flex flex-wrap gap-2 rounded-2xl bg-white border border-gray-200 p-2">
      {tabs.map(tab => {
        const path = tab.path(studentId)
        const active = location.pathname === path
        return (
          <button
            key={tab.key}
            onClick={() => navigate(path)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              active
                ? 'bg-[var(--primary)] text-white'
                : 'bg-gray-50 text-gray-600 hover:text-black hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
