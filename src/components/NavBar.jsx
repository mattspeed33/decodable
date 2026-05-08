import { useNavigate, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '🏠' },
  { path: '/students', label: 'Students', icon: '👩‍🎓' },
  { path: '/templates', label: 'Assessment Library', icon: '📋' },
  { path: '/homework', label: 'Homework', icon: '✏️' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()

  function isActive(path) {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="navbar fixed left-0 top-0 h-screen w-56 bg-white border-r border-gray-100 flex flex-col z-10">
      <div className="px-5 py-6 border-b border-gray-100">
        <h1
          className="text-2xl font-black text-black cursor-pointer tracking-tight flex items-center gap-2"
          onClick={() => navigate('/')}
        >
          <span className="text-3xl">📖</span> decodable
        </h1>
      </div>

      <nav className="flex-1 px-3 pt-4 space-y-1">
        {navItems.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2.5 ${
              isActive(item.path)
                ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                : 'text-gray-400 hover:text-black hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <div className="bg-[var(--gold-light)] rounded-xl p-3 text-center">
          <p className="text-xs font-bold text-[var(--orange)]">🔥 Keep teaching!</p>
        </div>
      </div>
    </aside>
  )
}
