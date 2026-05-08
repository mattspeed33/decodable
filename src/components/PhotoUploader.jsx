import { useRef } from 'react'

export default function PhotoUploader({ photos, setPhotos }) {
  const inputRef = useRef()

  function handleFiles(e) {
    const files = Array.from(e.target.files)
    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
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
      <div
        onClick={() => inputRef.current.click()}
        className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-black transition"
      >
        <p className="text-gray-500 font-medium">Tap to take a photo or upload images</p>
        <p className="text-xs text-gray-400 mt-1">Multiple photos supported</p>
      </div>
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
        <div className="grid grid-cols-3 gap-3 mt-4">
          {photos.map((photo, i) => (
            <div key={i} className="relative group">
              <img
                src={photo.preview}
                alt={`Assessment photo ${i + 1}`}
                className="w-full h-32 object-cover rounded-xl border-2 border-gray-100"
              />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1.5 right-1.5 bg-[var(--primary)] text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
