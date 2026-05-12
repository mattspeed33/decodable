import { useNavigate, useLocation } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/clerk-react'
import {
  Home, Users, Calendar, Library, Pencil, Settings as SettingsIcon,
} from 'lucide-react'

const navItems = [
  { path: '/',          label: 'Home',      Icon: Home },
  { path: '/students',  label: 'Students',  Icon: Users },
  { path: '/calendar',  label: 'This Week', Icon: Calendar },
  { path: '/homework',  label: 'Homework',  Icon: Pencil },
  { path: '/templates', label: 'Library',   Icon: Library },
  { path: '/settings',  label: 'Settings',  Icon: SettingsIcon },
]

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUser()
  const label = user?.primaryEmailAddress?.emailAddress || user?.username || 'Account'

  function isActive(path) {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="navbar bg-[var(--v4-surface-2)] border-r border-[var(--v4-border)] px-2.5 py-3.5 flex flex-col gap-0.5 overflow-y-auto h-screen fixed left-0 top-0 w-[220px] z-20">
      <div className="flex items-center gap-2.5 px-2.5 pt-1 pb-4 mb-2">
        <div
          onClick={() => navigate('/')}
          className="w-7 h-7 rounded-md flex items-center justify-center text-sm cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #86efac, #16a34a)' }}
        >
          🌱
        </div>
        <div
          onClick={() => navigate('/')}
          className="text-[14.5px] font-bold tracking-[-0.3px] cursor-pointer text-[var(--v4-ink)]"
        >
          Decodable
        </div>
      </div>

      {navItems.map(({ path, label, Icon }) => {
        const active = isActive(path)
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium cursor-pointer text-left ${
              active
                ? 'bg-[var(--v4-surface)] text-[var(--v4-ink)] shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                : 'text-[var(--v4-ink-2)] hover:bg-[var(--v4-surface-3)] hover:text-[var(--v4-ink)]'
            }`}
          >
            <Icon className="w-[14px] h-[14px]" strokeWidth={2} />
            {label}
          </button>
        )
      })}

      <div className="mt-auto pt-3 border-t border-[var(--v4-border)] flex items-center gap-2 px-2">
        <UserButton afterSignOutUrl="/" />
        <span className="text-[11px] text-[var(--v4-ink-3)] truncate" title={label}>{label}</span>
      </div>
    </aside>
  )
}
