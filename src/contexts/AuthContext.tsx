"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "../utils/supabase"
import type { Session, User } from "@supabase/supabase-js"
import { useDatabase } from "./DatabaseContext"

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone: string,
  ) => Promise<{ error: any; user: User | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
  updateProfile: (data: {
    full_name?: string
    phone?: string
    company_name?: string
    company_logo?: string
  }) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { initializeUserData, clearUserData } = useDatabase()

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (event === "SIGNED_IN" && session) {
        // Initialize user data in local database
        await initializeUserData(session.user.id)
      } else if (event === "SIGNED_OUT") {
        // Clear user data from local database
        await clearUserData()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
        },
      })

      if (error) throw error

      // Create user profile in the database
      if (data.user) {
        const { error: profileError } = await supabase.from("users").insert({
          id: data.user.id,
          email,
          full_name: fullName,
          phone,
        })

        if (profileError) throw profileError
      }

      return { error: null, user: data.user }
    } catch (error) {
      return { error, user: null }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const updateProfile = async (data: {
    full_name?: string
    phone?: string
    company_name?: string
    company_logo?: string
  }) => {
    try {
      if (!user) throw new Error("User not authenticated")

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: data.full_name,
          phone: data.phone,
        },
      })

      if (authError) throw authError

      // Update profile in database
      const { error: profileError } = await supabase
        .from("users")
        .update({
          full_name: data.full_name,
          phone: data.phone,
          company_name: data.company_name,
          company_logo: data.company_logo,
          updated_at: new Date(),
        })
        .eq("id", user.id)

      if (profileError) throw profileError

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
