import { useState, useEffect } from 'react'

const defaultMessages = [
  '📸 Reading the assessment photos…',
  '🔍 Checking against UFLI scope and sequence…',
  '🧩 Identifying phonics patterns…',
  '📋 Building the 4-week plan…',
]

export default function LoadingState({ messages = defaultMessages }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(i => (i + 1) % messages.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [messages.length])

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative">
        <div className="w-12 h-12 border-[3px] border-[var(--v4-surface-3)] border-t-[var(--v4-ink)] rounded-full animate-spin" />
      </div>
      <p className="text-[var(--v4-ink-3)] text-[12.5px] font-medium animate-pulse">{messages[index]}</p>
    </div>
  )
}
