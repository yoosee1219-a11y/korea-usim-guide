import { useState, useEffect } from 'react'

export type Language = 'ko' | 'en' | 'vi' | 'th' | 'tl' | 'uz' | 'ne' | 'mn' | 'id' | 'my' | 'zh' | 'ru'

const LANGUAGE_STORAGE_KEY = 'preferred_language'

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>('ko')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language
    if (savedLanguage) {
      setLanguageState(savedLanguage)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage when language changes
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage)
  }

  return { language, setLanguage, isLoaded }
}
