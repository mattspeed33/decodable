import { useEffect, useState, useCallback } from 'react'

// Tiny data-loading hook. Returns { data, loading, error, refresh }.
// Pass an async function and a deps array; the function re-runs whenever
// any dep or the refresh counter changes. Cancels in-flight responses on
// unmount or when deps change so we don't write stale state.
export function useAsync(fn, deps = []) {
  // Start as `undefined` (not `null`) so that destructuring defaults like
  // `const { data: students = [] }` actually apply during the first render.
  const [data, setData] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

  useEffect(() => {
    let cancelled = false
    // The whole point of this hook is to setState in an effect (it's a data
    // loader); the rule fires once per call. Disable for the body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    fn()
      .then(d => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch(e => { if (!cancelled) { setError(e); setLoading(false) } })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refreshKey])

  return { data, loading, error, refresh }
}
