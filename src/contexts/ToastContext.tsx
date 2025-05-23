"use client"

import type React from "react"
import { createContext, useContext, useState, useRef, useEffect } from "react"
import { Animated, StyleSheet, Text, View, TouchableOpacity } from "react-native"
import { X } from "../components/icons"

type ToastType = "success" | "error" | "info" | "warning"

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (toasts.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [toasts, fadeAnim])

  const showToast = (message: string, type: ToastType = "info", duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9)
    const toast = { id, message, type, duration }

    setToasts((prev) => [...prev, toast])

    if (duration > 0) {
      setTimeout(() => {
        hideToast(id)
      }, duration)
    }

    return id
  }

  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const getToastBackgroundColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
      case "warning":
        return "bg-yellow-500"
      case "info":
      default:
        return "bg-blue-500"
    }
  }

  const value = {
    showToast,
    hideToast,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}

      {toasts.length > 0 && (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]} pointerEvents="box-none">
          {toasts.map((toast) => (
            <View
              key={toast.id}
              className={`mb-2 rounded-lg p-3 flex-row items-center justify-between ${getToastBackgroundColor(toast.type)}`}
            >
              <Text className="text-white flex-1 mr-2">{toast.message}</Text>
              <TouchableOpacity onPress={() => hideToast(toast.id)}>
                <X size={18} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </Animated.View>
      )}
    </ToastContext.Provider>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
})

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
