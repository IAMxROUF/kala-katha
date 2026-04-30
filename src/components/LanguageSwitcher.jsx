import { useEffect, useRef, useState } from 'react'
import { useLang } from '../context/LanguageContext.jsx'
import { IconGlobe } from './Icons.jsx'

export default function LanguageSwitcher({ compact = false }) {
  const { lang, setLang, languages } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const current = languages.find((l) => l.code === lang) ?? languages[0]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-ink-300/30 bg-parchment/70 px-3.5 py-2 text-sm hover:bg-mustard-100 transition"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <IconGlobe size={18} className="text-ink-700" />
        {!compact && <span className="font-medium">{current.native}</span>}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-2 w-48 paper p-1 z-50 animate-fade-up"
        >
          {languages.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => {
                  setLang(l.code)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition flex items-center justify-between ${
                  l.code === lang
                    ? 'bg-terracotta-100 text-ink-900'
                    : 'hover:bg-parchment'
                }`}
              >
                <span className={l.code === 'hi' ? 'deva' : ''}>{l.native}</span>
                <span className="text-xs text-ink-300">{l.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
