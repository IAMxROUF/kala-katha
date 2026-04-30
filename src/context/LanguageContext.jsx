import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { LANGUAGES, translations } from '../i18n/translations.js'

const LanguageContext = createContext(null)
const STORAGE_KEY = 'kk.lang'

function resolve(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window === 'undefined') return 'en'
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved
    const browser = navigator.language?.slice(0, 2)
    if (browser === 'hi') return 'hi'
    return 'en'
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang === 'hien' ? 'en' : lang
  }, [lang])

  const t = useMemo(() => {
    return (key, vars) => {
      const fromLang = resolve(translations[lang], key)
      const value = fromLang ?? resolve(translations.en, key) ?? key
      if (typeof value !== 'string' || !vars) return value
      return Object.keys(vars).reduce(
        (s, k) => s.replaceAll(`{${k}}`, String(vars[k])),
        value,
      )
    }
  }, [lang])

  const value = { lang, setLang, t, languages: LANGUAGES }
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
