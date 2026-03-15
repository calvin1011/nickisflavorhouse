/**
 * POST /api/notify-customer-status
 * Body: { orderId, status }. Sends email to the order's customer_email when status is "confirmed" or "ready".
 * Called by admin after updating an order status; order is re-fetched server-side.
 */
import { createClient } from '@supabase/supabase-js'
import { sendCustomerStatusEmail } from './notify.js'

const ALLOWED_STATUSES = ['confirmed', 'ready']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    res.status(500).json({ error: 'Server configuration error' })
    return
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    res.status(400).json({ error: 'Invalid JSON' })
    return
  }

  const orderId = body.orderId
  const status = body.status

  if (!orderId || typeof orderId !== 'string') {
    res.status(400).json({ error: 'orderId is required' })
    return
  }
  if (!ALLOWED_STATUSES.includes(status)) {
    res.status(400).json({ error: 'status must be confirmed or ready' })
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_email, order_type, pickup_date, pickup_time')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) {
    res.status(404).json({ error: 'Order not found' })
    return
  }

  const result = await sendCustomerStatusEmail(order, status)
  if (!result.ok) {
    console.error('Notify customer status failed', result.error)
    res.status(500).json({ error: result.error || 'Failed to send email' })
    return
  }

  res.status(200).json({ ok: true })
}
