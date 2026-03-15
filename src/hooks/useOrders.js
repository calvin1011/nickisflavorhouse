import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']

export function useOrders(options = {}) {
  const { subscribeRealtime = false } = options
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOrders = useCallback(async () => {
    if (!supabase) {
      setError(new Error('Supabase client not configured'))
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_email, customer_phone, order_type, status, payment_status, subtotal, payment_method, delivery_fee, notes, pickup_date, pickup_time, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setOrders(data ?? [])
    } catch (err) {
      setError(err)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    if (!subscribeRealtime || !supabase) return
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [subscribeRealtime, fetchOrders])

  const updateOrderStatus = useCallback(
    async (orderId, status, updates = {}) => {
      if (!supabase) throw new Error('Supabase client not configured')
      const payload = { status, updated_at: new Date().toISOString(), ...updates }
      const { error: updateError } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', orderId)
      if (updateError) throw updateError
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...payload } : o))
      )
    },
    []
  )

  const getOrderItems = useCallback(async (orderId) => {
    if (!supabase) return []
    const { data, error: itemsError } = await supabase
      .from('order_items')
      .select('name, quantity, price')
      .eq('order_id', orderId)
    if (itemsError) throw itemsError
    return data ?? []
  }, [])

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    updateOrderStatus,
    getOrderItems,
    statusFilters: STATUS_FILTERS,
  }
}
