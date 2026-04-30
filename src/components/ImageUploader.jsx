import { useRef, useState } from 'react'
import { IconCamera, IconClose } from './Icons.jsx'
import { useLang } from '../context/LanguageContext.jsx'

// Reads a File and returns a data-URL so we can persist it in localStorage
// alongside the rest of the craft payload (no upload service required for the
// demo).
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ImageUploader({
  label,
  required = false,
  value,
  onChange,
  hint,
  accent = 'terracotta',
}) {
  const { t } = useLang()
  const inputRef = useRef(null)
  const [drag, setDrag] = useState(false)

  async function handleFiles(files) {
    const f = files?.[0]
    if (!f) return
    const url = await fileToDataURL(f)
    onChange?.(url)
  }

  const ringClass = {
    terracotta: 'border-terracotta-200 bg-terracotta-50/40',
    mustard: 'border-mustard-200 bg-mustard-100/40',
    leaf: 'border-leaf-200 bg-leaf-200/30',
  }[accent]

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="field-label !mb-0">
          {label}
          {required && <span className="text-terracotta-500 ml-1">*</span>}
        </label>
        {!required && <span className="text-xs text-ink-300">{t('common.optional')}</span>}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={`sketch-border ${ringClass} ${
          drag ? 'ring-4 ring-mustard-200/70' : ''
        } relative aspect-[4/3] flex items-center justify-center cursor-pointer overflow-hidden transition`}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
      >
        {value ? (
          <>
            <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange?.(null)
              }}
              className="absolute right-2 top-2 rounded-full bg-ivory/95 hover:bg-ivory p-1.5 shadow-soft"
              aria-label="Remove photo"
            >
              <IconClose size={16} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-ink-500 px-4 text-center">
            <IconCamera size={32} className="text-terracotta-400" />
            <div className="text-sm font-medium text-ink-700">{t('common.uploadPhoto')}</div>
            <div className="text-xs">{t('common.orDrop')}</div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}
