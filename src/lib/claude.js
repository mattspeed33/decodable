export async function runPrompt({ systemPrompt, userMessage, images = [] }) {
  const content = []

  images.forEach(base64 => {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: base64
      }
    })
  })

  content.push({ type: 'text', text: userMessage })

  const token = await window.Clerk?.session?.getToken()
  if (!token) {
    throw new Error('Not signed in')
  }

  const response = await fetch('/api/ai/run-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ systemPrompt, content })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || err.error || 'Claude API call failed')
  }

  const data = await response.json()
  let text = data.content[0].text

  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    text = fenceMatch[1].trim()
  }

  return text
}

export function compressImage(file) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const maxSize = 1200
      let { width, height } = img

      if (width > height && width > maxSize) {
        height = (height * maxSize) / width
        width = maxSize
      } else if (height > maxSize) {
        width = (width * maxSize) / height
        height = maxSize
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
      URL.revokeObjectURL(url)
      resolve(base64)
    }

    img.src = url
  })
}
