import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SKILLS_CATEGORIES } from '../lib/skillsCategories'
import { fetchSkillsCategories } from '../lib/skillsApi'

export default function AssessmentTemplates() {
  const navigate = useNavigate()
  const [categoryMeta, setCategoryMeta] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchSkillsCategories()
      .then((data) => {
        if (mounted) {
          setCategoryMeta(data.categories || [])
          setError(null)
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Failed to load categories.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const templateStatus = useMemo(() => {
    const map = new Map()
    categoryMeta.forEach((item) => map.set(item.id, item))
    return map
  }, [categoryMeta])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-black tracking-tight">Assessment Library</h2>
        <div className="text-xs font-bold rounded-full bg-pink-100 text-pink-700 px-3 py-1">
          Categories: {SKILLS_CATEGORIES.length}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-[var(--red)] bg-[var(--red-light)] p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Loading categories...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SKILLS_CATEGORIES.map((category) => {
            const status = templateStatus.get(category.id)
            const hasCustom = Boolean(status?.customTemplate)
            return (
              <button
                key={category.id}
                onClick={() => navigate(`/skills/${category.id}`)}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left hover:border-black transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-black">{category.label}</p>
                    <p className="text-xs text-gray-500 mt-1">Default PDF included</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${hasCustom ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-gray-100 text-gray-600'}`}>
                    {hasCustom ? 'Custom uploaded' : 'Default only'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-600">
          Each category includes a built-in template PDF. Open a category to download, print, or upload your own custom PDF.
        </p>
      </div>
    </div>
  )
}
