import { useCallback } from 'react'
import { useAuthStore, initAuthListener } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

let authListenerInitialized = false

function ensureAuthListener() {
  if (!authListenerInitialized) {
    authListenerInitialized = true
    initAuthListener()
  }
}

export function useAuth() {
  ensureAuthListener()
  const user = useAuthStore((s) => s.user)
  const session = useAuthStore((s) => s.session)
  const initialized = useAuthStore((s) => s.initialized)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email).trim(),
      password: String(password),
    })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    clearAuth()
  }, [clearAuth])

  const updatePassword = useCallback(
    async (currentPassword, newPassword) => {
      if (!supabase || !user?.email) throw new Error('Not authenticated')
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (signInError) throw new Error('Current password is incorrect')
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (updateError) throw updateError
    },
    [user?.email]
  )

  return {
    user,
    session,
    initialized,
    isAuthenticated: !!user,
    signIn,
    signOut,
    updatePassword,
  }
}
