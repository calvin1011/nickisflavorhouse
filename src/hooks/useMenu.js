import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Expected Supabase schema:
 * - categories: id, name, sort_order (optional)
 * - menu_items: id, name, description, category_id, price (dollars), image_url, is_catering (boolean), sort_order.
 *   If column "available" (boolean, default true) exists, add it to the select below and items with available=false are hidden.
 */
export function useMenu() {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!supabase) {
      setError(new Error('Supabase client not configured'))
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchMenu() {
      try {
        const [categoriesRes, itemsRes] = await Promise.all([
          supabase
            .from('categories')
            .select('id, name, sort_order')
            .order('sort_order', { ascending: true, nullsFirst: false }),
          supabase
            .from('menu_items')
            .select('id, name, description, category_id, price, image_url, is_catering, sort_order')
            .order('sort_order', { ascending: true, nullsFirst: false }),
        ])

        if (cancelled) return

        if (categoriesRes.error) throw categoriesRes.error
        if (itemsRes.error) throw itemsRes.error

        const allItems = itemsRes.data ?? []
        const availableItems = allItems.filter((item) => item.available !== false)
        setCategories(categoriesRes.data ?? [])
        setItems(availableItems)
      } catch (err) {
        if (!cancelled) {
          setError(err)
          setCategories([])
          setItems([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchMenu()
    return () => { cancelled = true }
  }, [])

  const itemsByCategory = categories.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.category_id === cat.id),
  }))

  const allCategories = [{ id: null, name: 'All' }, ...categories]
  const getItemsForCategory = (categoryId) =>
    categoryId == null ? items : items.filter((item) => item.category_id === categoryId)

  return {
    categories: allCategories,
    categoriesOnly: categories,
    items,
    itemsByCategory,
    getItemsForCategory,
    loading,
    error,
  }
}
