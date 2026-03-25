/**
 * GET /api/order?session_id=cs_xxx  — Stripe confirmation (order matched after webhook sets stripe_session_id)
 * GET /api/order?order_id=uuid     — Pay-at-pickup confirmation (cashapp / zelle / cash only)
 * Single function to stay within Vercel Hobby serverless function limits.
 */
import { createClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function jsonOrderResponse(order, items) {
  const deliveryFee = Number(order.delivery_fee) || 0
  return {
    order: {
      ...order,
      subtotal: Number(order.subtotal),
      delivery_fee: deliveryFee,
      total: Number(order.subtotal) + deliveryFee,
    },
    items: (items || []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
    })),
  }
}

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
  const orderIdRaw = typeof req.query.order_id === 'string' ? req.query.order_id.trim() : ''

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    res.status(500).json({ error: 'Server configuration error' })
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  if (sessionId && sessionId.startsWith('cs_')) {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, customer_email, subtotal, order_type, pickup_date, pickup_time, payment_method, delivery_fee')
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

    res.status(200).json(jsonOrderResponse(order, items))
    return
  }

  if (orderIdRaw && UUID_RE.test(orderIdRaw)) {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, customer_email, subtotal, order_type, pickup_date, pickup_time, payment_method, delivery_fee, delivery_address')
      .eq('id', orderIdRaw)
      .single()

    if (orderError || !order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    const payAtPickupMethods = ['cashapp', 'zelle', 'cash']
    if (!payAtPickupMethods.includes(order.payment_method)) {
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

    res.status(200).json(jsonOrderResponse(order, items))
    return
  }

  res.status(400).json({ error: 'Provide session_id (Stripe) or order_id (pay at pickup)' })
}
