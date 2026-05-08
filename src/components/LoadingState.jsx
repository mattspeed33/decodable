import { useState, useEffect } from 'react'

const defaultMessages = [
  '📸 Reading the assessment photos...',
  '🔍 Checking against UFLI scope and sequence...',
  '🧩 Identifying phonics patterns...',
  '📋 Building the 4-week plan...'
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
    <div className="flex flex-col items-center justify-center py-20 gap-5">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-100 border-t-[var(--primary)] rounded-full animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-2xl">📖</span>
      </div>
      <p className="text-gray-500 text-sm font-medium animate-pulse">{messages[index]}</p>
    </div>
  )
}
