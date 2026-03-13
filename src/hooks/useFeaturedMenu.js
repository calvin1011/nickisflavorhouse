import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const FEATURED_LIMIT = 6

export function useFeaturedMenu() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!supabase) {
      setError(new Error('Supabase not configured'))
      setLoading(false)
      return
    }
    let cancelled = false
    async function fetchFeatured() {
      try {
        const { data, error: fetchError } = await supabase
          .from('menu_items')
          .select('id, name, description, price, image_url, is_catering, sort_order')
          .eq('featured', true)
          .eq('available', true)
          .order('sort_order', { ascending: true, nullsFirst: false })
          .limit(FEATURED_LIMIT)
        if (cancelled) return
        if (fetchError) throw fetchError
        setItems(data ?? [])
      } catch (err) {
        if (!cancelled) {
          setError(err)
          setItems([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchFeatured()
    return () => { cancelled = true }
  }, [])

  return { items, loading, error }
}
