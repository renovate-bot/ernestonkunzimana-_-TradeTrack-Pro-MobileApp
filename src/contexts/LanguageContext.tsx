"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import * as Localization from "expo-localization"

// Import translations
import enTranslation from "../locales/en.json"
import frTranslation from "../locales/fr.json"
import rwTranslation from "../locales/rw.json"
import lgTranslation from "../locales/lg.json"
import swTranslation from "../locales/sw.json"

// Initialize i18next
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslation },
    fr: { translation: frTranslation },
    rw: { translation: rwTranslation }, // Kinyarwanda
    lg: { translation: lgTranslation }, // Luganda
    sw: { translation: swTranslation }, // Kiswahili
  },
  lng: Localization.locale.split("-")[0],
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
})

interface LanguageContextType {
  language: string
  setLanguage: (language: string) => Promise<void>
  availableLanguages: { code: string; name: string }[]
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState(i18n.language)

  const availableLanguages = [
    { code: "en", name: "English" },
    { code: "fr", name: "Français" },
    { code: "rw", name: "Kinyarwanda" },
    { code: "lg", name: "Luganda" },
    { code: "sw", name: "Kiswahili" },
  ]

  useEffect(() => {
    // Load saved language
    AsyncStorage.getItem("user-language").then((savedLanguage) => {
      if (savedLanguage) {
        i18n.changeLanguage(savedLanguage)
        setLanguageState(savedLanguage)
      }
    })
  }, [])

  const setLanguage = async (languageCode: string) => {
    await AsyncStorage.setItem("user-language", languageCode)
    i18n.changeLanguage(languageCode)
    setLanguageState(languageCode)
  }

  const value = {
    language,
    setLanguage,
    availableLanguages,
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
