import { useRef } from 'react'
import { Camera, X } from 'lucide-react'

export default function PhotoUploader({ photos, setPhotos }) {
  const inputRef = useRef()

  function handleFiles(e) {
    const files = Array.from(e.target.files)
    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPhotos(prev => [...prev, ...newPhotos])
    e.target.value = ''
  }

  function removePhoto(index) {
    setPhotos(prev => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current.click()}
        className="w-full bg-[var(--v4-surface)] border border-dashed border-[var(--v4-border-2)] rounded-md p-6 text-center cursor-pointer hover:border-[var(--v4-ink)] transition-colors"
      >
        <Camera className="w-5 h-5 mx-auto mb-1.5 text-[var(--v4-ink-3)]" />
        <p className="text-[13px] font-medium text-[var(--v4-ink-2)]">Take a photo or upload images</p>
        <p className="text-[11px] text-[var(--v4-ink-3)] mt-0.5">Multiple photos supported</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {photos.map((photo, i) => (
            <div key={i} className="relative group">
              <img
                src={photo.preview}
                alt={`Assessment photo ${i + 1}`}
                className="w-full h-28 object-cover rounded-md border border-[var(--v4-border)]"
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-1.5 right-1.5 bg-[var(--v4-ink)] text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
