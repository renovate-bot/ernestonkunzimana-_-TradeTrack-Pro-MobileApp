"use client"

import "react-native-gesture-handler"
import { useEffect } from "react"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { NavigationContainer } from "@react-navigation/native"
import { AuthProvider } from "./src/contexts/AuthContext"
import { DatabaseProvider } from "./src/contexts/DatabaseContext"
import { LanguageProvider } from "./src/contexts/LanguageContext"
import { ThemeProvider } from "./src/contexts/ThemeContext"
import { SyncProvider } from "./src/contexts/SyncContext"
import { TeamProvider } from "./src/contexts/TeamContext"
import { ToastProvider } from "./src/contexts/ToastContext"
import RootNavigator from "./src/navigation/RootNavigator"
import { initializeApp } from "./src/utils/initialize"
import { GestureHandlerRootView } from "react-native-gesture-handler"

export default function App() {
  useEffect(() => {
    // Initialize app dependencies
    initializeApp()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <LanguageProvider>
              <DatabaseProvider>
                <AuthProvider>
                  <TeamProvider>
                    <SyncProvider>
                      <NavigationContainer>
                        <RootNavigator />
                        <StatusBar style="auto" />
                      </NavigationContainer>
                    </SyncProvider>
                  </TeamProvider>
                </AuthProvider>
              </DatabaseProvider>
            </LanguageProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
