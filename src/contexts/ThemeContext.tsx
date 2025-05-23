"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useColorScheme } from "react-native"

type ThemeMode = "light" | "dark" | "system"

interface ThemeContextType {
  mode: ThemeMode
  isDark: boolean
  setMode: (mode: ThemeMode) => Promise<void>
  toggleMode: () => Promise<void>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme()
  const [mode, setModeState] = useState<ThemeMode>("system")
  const [isDark, setIsDark] = useState(systemColorScheme === "dark")

  useEffect(() => {
    // Load saved theme mode
    AsyncStorage.getItem("theme-mode").then((savedMode) => {
      if (savedMode && (savedMode === "light" || savedMode === "dark" || savedMode === "system")) {
        setModeState(savedMode as ThemeMode)
      }
    })
  }, [])

  useEffect(() => {
    // Update isDark based on mode and system preference
    if (mode === "system") {
      setIsDark(systemColorScheme === "dark")
    } else {
      setIsDark(mode === "dark")
    }
  }, [mode, systemColorScheme])

  const setMode = async (newMode: ThemeMode) => {
    await AsyncStorage.setItem("theme-mode", newMode)
    setModeState(newMode)
  }

  const toggleMode = async () => {
    const newMode = mode === "light" ? "dark" : "light"
    await setMode(newMode)
  }

  const value = {
    mode,
    isDark,
    setMode,
    toggleMode,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
