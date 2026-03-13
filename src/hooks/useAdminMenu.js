import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useAdminMenu() {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
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
      const [categoriesRes, itemsRes] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name, sort_order')
          .order('sort_order', { ascending: true, nullsFirst: false }),
        supabase
          .from('menu_items')
          .select('id, name, description, category_id, price, image_url, is_catering, sort_order, available, min_price, max_price')
          .order('sort_order', { ascending: true, nullsFirst: false }),
      ])
      if (categoriesRes.error) throw categoriesRes.error
      if (itemsRes.error) throw itemsRes.error
      setCategories(categoriesRes.data ?? [])
      setItems(itemsRes.data ?? [])
    } catch (err) {
      setError(err)
      setCategories([])
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const updateAvailable = useCallback(
    async (id, available) => {
      if (!supabase) return
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ available })
        .eq('id', id)
      if (updateError) throw updateError
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, available } : item))
      )
    },
    []
  )

  const deleteItem = useCallback(async (id) => {
    if (!supabase) return
    const { error: deleteError } = await supabase.from('menu_items').delete().eq('id', id)
    if (deleteError) throw deleteError
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const getCategoryName = useCallback(
    (categoryId) => categories.find((c) => c.id === categoryId)?.name ?? '—',
    [categories]
  )

  return {
    categories,
    items,
    loading,
    error,
    refetch: fetch,
    updateAvailable,
    deleteItem,
    getCategoryName,
  }
}
