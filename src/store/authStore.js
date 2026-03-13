import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

/**
 * @typedef {import('@supabase/supabase-js').User} User
 * @typedef {import('@supabase/supabase-js').Session} Session
 */

export const useAuthStore = create((set) => ({
  user: /** @type {User | null} */ (null),
  session: /** @type {Session | null} */ (null),
  initialized: false,

  setAuth: (session, user) => set({ session, user }),
  setInitialized: () => set({ initialized: true }),
  clearAuth: () => set({ session: null, user: null }),
}))

export function initAuthListener() {
  if (!supabase) {
    useAuthStore.getState().setInitialized()
    return () => {}
  }
  supabase.auth.getSession().then(({ data: { session } }) => {
    useAuthStore.setState({
      session,
      user: session?.user ?? null,
      initialized: true,
    })
  })
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      useAuthStore.setState({
        session,
        user: session?.user ?? null,
        initialized: true,
      })
    }
  )
  return () => subscription.unsubscribe()
}
