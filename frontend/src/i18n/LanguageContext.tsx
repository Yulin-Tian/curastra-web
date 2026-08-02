import { createContext, useContext, useState, type ReactNode } from 'react'
import { translate, type Lang } from './translations'

const LANG_KEY = 'curastra_lang'

export function getStoredLang(): Lang {
  return localStorage.getItem(LANG_KEY) === 'hi' ? 'hi' : 'en'
}

interface LanguageState {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string, vars?: Record<string, string>) => string
}

const LanguageContext = createContext<LanguageState | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getStoredLang())

  function setLang(l: Lang) {
    localStorage.setItem(LANG_KEY, l)
    document.documentElement.lang = l
    setLangState(l)
  }

  // Keep <html lang> in sync on first render too (fonts key off it).
  if (document.documentElement.lang !== lang) document.documentElement.lang = lang

  const t = (key: string, vars?: Record<string, string>) => translate(key, lang, vars)

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
}

export function useLang(): LanguageState {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider')
  return ctx
}
