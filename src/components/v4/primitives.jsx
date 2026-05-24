// Shared V4 design primitives. Pulled out so Dashboard, Students, StudentPage,
// and the rest of the screens render with the same cards / sections / rows.
// All colors come from the --v4-* CSS variables in index.css.
import { X } from 'lucide-react'

const TONE_CLASSES = {
  purple: 'bg-[var(--v4-purple-lt)] text-[var(--v4-purple)]',
  blue:   'bg-[var(--v4-blue-lt)] text-[var(--v4-blue)]',
  green:  'bg-[var(--v4-green-lt)] text-[var(--v4-green)]',
  amber:  'bg-[var(--v4-amber-lt)] text-[var(--v4-amber)]',
  teal:   'bg-[var(--v4-teal-lt)] text-[var(--v4-teal)]',
  red:    'bg-[var(--v4-red-lt)] text-[var(--v4-red)]',
  gray:   'bg-[var(--v4-surface-3)] text-[var(--v4-ink-2)]',
}

export function SectionHead({ title, action, onAction, right }) {
  return (
    <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-2.5">
      <span>{title}</span>
      {action && (
        <button onClick={onAction} className="ml-auto text-[11.5px] text-[var(--v4-ink-2)] normal-case tracking-normal font-medium hover:text-[var(--v4-ink)] cursor-pointer">
          {action}
        </button>
      )}
      {!action && right && <div className="ml-auto">{right}</div>}
    </div>
  )
}

export function Section({ title, action, onAction, right, children }) {
  return (
    <div>
      {(title || action || right) && <SectionHead title={title} action={action} onAction={onAction} right={right} />}
      {children}
    </div>
  )
}

// Bordered white card wrapper for any block of content (forms, panels, etc.).
export function Card({ className = '', padding = 'p-5', children, ...rest }) {
  return (
    <div className={`bg-[var(--v4-surface)] border border-[var(--v4-border)] rounded-[10px] ${padding} ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function ListTable({ children, className = '' }) {
  return (
    <div className={`border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

export function ListRow({ icon, iconTone = 'gray', title, tag, sub, date, right, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`grid items-center gap-3 px-3.5 py-2.5 border-b border-[var(--v4-border)] last:border-b-0 ${onClick ? 'cursor-pointer hover:bg-[var(--v4-surface-2)]' : ''}`}
      style={{ gridTemplateColumns: '28px 1fr auto auto' }}
    >
      <div className={`w-[26px] h-[26px] rounded-md flex items-center justify-center text-[13px] ${TONE_CLASSES[iconTone] || TONE_CLASSES.gray}`}>
        {icon}
      </div>
      <div className="flex flex-col gap-px min-w-0">
        <div className="text-[13px] font-medium text-[var(--v4-ink)] flex items-center gap-1.5 min-w-0">
          <span className="truncate">{title}</span>
          {tag && (
            <span className={`shrink-0 text-[10.5px] font-semibold px-1.5 py-0.5 rounded ${TONE_CLASSES[tag.tone] || TONE_CLASSES.gray}`}>{tag.text}</span>
          )}
        </div>
        {sub && <div className="text-[11.5px] text-[var(--v4-ink-3)] truncate">{sub}</div>}
      </div>
      <div>{right}</div>
      <div className="text-[11.5px] text-[var(--v4-ink-3)] whitespace-nowrap">{date}</div>
    </div>
  )
}

export function EmptyRow({ icon, text }) {
  return (
    <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] px-4 py-5 flex items-center gap-2.5 text-[13px] text-[var(--v4-ink-3)]">
      <span className="w-7 h-7 rounded-md bg-[var(--v4-surface-3)] flex items-center justify-center text-[var(--v4-ink-3)]">{icon}</span>
      {text}
    </div>
  )
}

export function HighlightCard({ icon, label, value, sub, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--v4-surface)] border border-[var(--v4-border)] rounded-[10px] px-3.5 py-3 flex flex-col gap-1 transition-colors hover:border-[var(--v4-border-2)] ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="text-[10.5px] font-medium text-[var(--v4-ink-3)] flex items-center gap-1.5">
        {icon} {label}
      </div>
      <div className="text-[15px] font-bold text-[var(--v4-ink)] tracking-[-0.2px] mt-0.5 flex items-center gap-1.5 min-w-0">
        {value}
      </div>
      {sub && <div className="text-[11px] text-[var(--v4-ink-3)]">{sub}</div>}
    </div>
  )
}

export function BtnPrimary({ children, onClick, className = '', ...rest }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[var(--v4-ink)] text-white text-[12.5px] font-semibold hover:bg-[#0d0a08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--v4-ink)] focus-visible:outline-offset-2 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function BtnSecondary({ children, onClick, className = '', ...rest }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--v4-surface)] border border-[var(--v4-border)] text-[12.5px] font-medium text-[var(--v4-ink-2)] hover:bg-[var(--v4-surface-3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--v4-ink)] focus-visible:outline-offset-2 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

// IconBtn: small icon-only button (32x32). title becomes aria-label by default.
// Used for inline edit/delete in list rows, close buttons in modals/forms, and
// generic icon-only controls. Inherits the system focus-visible pattern.
export function IconBtn({ children, onClick, title, ariaLabel, danger, className = '', ...rest }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={ariaLabel ?? title}
      className={`w-8 h-8 rounded-md flex items-center justify-center text-[var(--v4-ink-3)] hover:bg-[var(--v4-surface-3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--v4-ink)] focus-visible:outline-offset-2 ${danger ? 'hover:text-[var(--v4-red)]' : 'hover:text-[var(--v4-ink)]'} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

// Convenience wrapper for the close-X button pattern, which appears in every
// modal and form header. Default size matches IconBtn (32x32). Aria-label
// required (caller supplies the context: "Close", "Cancel upload", etc.).
export function CloseBtn({ onClick, label = 'Close', ...rest }) {
  return (
    <IconBtn onClick={onClick} title={label} ariaLabel={label} {...rest}>
      <X className="w-4 h-4" />
    </IconBtn>
  )
}

export function StatusDot({ tone = 'gray', className = '' }) {
  const colors = {
    green: 'bg-[var(--v4-green)]',
    amber: 'bg-[var(--v4-amber)]',
    red:   'bg-[var(--v4-red)]',
    blue:  'bg-[var(--v4-blue)]',
    gray:  'bg-[var(--v4-ink-4)]',
  }
  return <span className={`inline-block w-[7px] h-[7px] rounded-full shrink-0 ${colors[tone] || colors.gray} ${className}`} />
}
