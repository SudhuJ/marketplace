import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Helper to clear all Supabase auth state from storage
export const clearSupabaseAuth = async () => {
  try {
    await supabase.auth.signOut()
  } catch {
    // signOut may fail if tokens are already invalid — ignore
  }
  if (typeof window !== 'undefined') {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-'))
    keys.forEach(k => localStorage.removeItem(k))
  }
}
