import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Fetch active announcements for the public homepage.
 */
export function useAnnouncements() {
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
        .select('id, title, body, image_url')
        .eq('is_active', true)
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

  return { announcements, loading, error, refetch: fetch }
}
