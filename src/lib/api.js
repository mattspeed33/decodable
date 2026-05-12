// Thin fetch wrapper. Attaches the Clerk session JWT to every request and
// turns non-OK responses into thrown Errors. All resource access in the app
// goes through here.

async function authedFetch(method, path, body) {
  const token = await window.Clerk?.session?.getToken()
  if (!token) throw new Error('Not signed in')

  const init = {
    method,
    headers: { Authorization: `Bearer ${token}` },
  }
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }

  const res = await fetch(path, init)

  if (res.status === 204) return null
  if (res.status === 404) return null

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  return res.json()
}

function buildQuery(filter) {
  if (!filter) return ''
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(filter)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, v)
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const apiList = (slug, filter) => authedFetch('GET', `/api/${slug}${buildQuery(filter)}`)
export const apiGet = (slug, id) => authedFetch('GET', `/api/${slug}/${id}`)
export const apiSave = (slug, obj) => authedFetch('POST', `/api/${slug}`, obj)
export const apiDelete = (slug, id) => authedFetch('DELETE', `/api/${slug}/${id}`)
