import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useAdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!supabase) {
      setError(new Error('Supabase client not configured'))
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('announcements')
        .select('id, title, body, image_url, is_active, created_at, updated_at')
        .order('created_at', { ascending: false })
      if (fetchError) throw fetchError
      setAnnouncements(data ?? [])
    } catch (err) {
      setError(err)
      setAnnouncements([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const updateActive = useCallback(async (id, isActive) => {
    if (!supabase) return
    const { error: updateError } = await supabase
      .from('announcements')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (updateError) throw updateError
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_active: isActive } : a))
    )
  }, [])

  const deleteAnnouncement = useCallback(async (id) => {
    if (!supabase) return
    const { error: deleteError } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)
    if (deleteError) throw deleteError
    setAnnouncements((prev) => prev.filter((a) => a.id !== id))
  }, [])

  return {
    announcements,
    loading,
    error,
    refetch: fetch,
    updateActive,
    deleteAnnouncement,
  }
}
