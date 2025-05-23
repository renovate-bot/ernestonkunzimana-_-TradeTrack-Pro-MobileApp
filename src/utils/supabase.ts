import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"
import "react-native-url-polyfill/auto"

// Initialize Supabase client
const supabaseUrl = "https://your-supabase-url.supabase.co"
const supabaseAnonKey = "your-supabase-anon-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
