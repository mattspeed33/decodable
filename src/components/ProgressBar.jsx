export default function ProgressBar({ current, target, label }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span className="font-semibold">{label}</span>
          <span className="font-bold text-black">{current}% / {target}%</span>
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full transition-all relative"
          style={{
            width: `${pct}%`,
            background: pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--orange)' : 'var(--red)'
          }}
        >
          {pct > 15 && (
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white">
              {pct}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
