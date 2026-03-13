/**
 * GET /api/order-by-session?session_id=cs_xxx
 * Returns order + items for confirmation page. Uses stripe_session_id (set after payment).
 */
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const sessionId = typeof req.query.session_id === 'string' ? req.query.session_id.trim() : ''
  if (!sessionId || !sessionId.startsWith('cs_')) {
    res.status(400).json({ error: 'Valid session_id required' })
    return
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    res.status(500).json({ error: 'Server configuration error' })
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_email, subtotal, deposit_amount, balance_due, order_type, pickup_date, pickup_time')
    .eq('stripe_session_id', sessionId)
    .single()

  if (orderError || !order) {
    res.status(404).json({ error: 'Order not found' })
    return
  }

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('name, quantity, price')
    .eq('order_id', order.id)

  if (itemsError) {
    res.status(500).json({ error: 'Could not load order items' })
    return
  }

  res.status(200).json({
    order: {
      ...order,
      subtotal: Number(order.subtotal),
      deposit_amount: Number(order.deposit_amount),
      balance_due: Number(order.balance_due),
    },
    items: (items || []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
    })),
  })
}
