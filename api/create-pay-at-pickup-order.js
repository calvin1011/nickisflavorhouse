/**
 * POST: validate checkout payload, create order + order_items with service role (bypasses RLS).
 * Used for Cash App, Zelle, and cash at pickup — same server-side validation as Stripe checkout.
 */
import { createClient } from '@supabase/supabase-js'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import {
  sanitizeOrder,
  payAtPickupPayloadSchema,
  generateOrderNumber,
  getClientIdentifier,
  validatePickupWindow,
} from './lib/checkoutPayload.js'
import { dispatchNotification } from './notify.js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (redisUrl && redisToken) {
    const ratelimit = new Ratelimit({
      redis: new Redis({ url: redisUrl, token: redisToken }),
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
    })
    const { success } = await ratelimit.limit(`create-pay-at-pickup:${getClientIdentifier(req)}`)
    if (!success) {
      res.status(429).json({ error: 'Too many requests. Please try again in a minute.' })
      return
    }
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
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

  const parsed = payAtPickupPayloadSchema.safeParse(body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    return
  }

  const data = sanitizeOrder(parsed.data)
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const windowCheck = await validatePickupWindow(supabase, data)
  if (!windowCheck.ok) {
    res.status(400).json({ error: windowCheck.error })
    return
  }

  const subtotalDollars = data.subtotal
  const deliveryFeeDollars = (data.order_type === 'delivery' && typeof data.delivery_fee === 'number') ? data.delivery_fee : 0
  const orderNumber = generateOrderNumber()
  const catering = data.catering || {}

  const orderRecord = {
    order_number: orderNumber,
    customer_name: data.name,
    customer_email: data.email,
    customer_phone: data.phone,
    order_type: data.order_type,
    status: 'pending',
    payment_status: 'pending',
    payment_method: data.payment_method,
    subtotal: subtotalDollars,
    deposit_amount: 0,
    balance_due: 0,
    delivery_address: data.order_type === 'delivery' ? (data.delivery_address || null) : null,
    delivery_fee: deliveryFeeDollars,
    delivery_distance_miles: data.order_type === 'delivery' && typeof data.delivery_distance_miles === 'number' ? data.delivery_distance_miles : null,
    notes: data.notes || null,
    pickup_date: data.pickup_date || null,
    pickup_time: data.pickup_time || null,
    is_catering: data.order_type === 'catering' || !!data.catering,
    event_date: catering.event_date || null,
    event_time: catering.event_time || null,
    event_location: catering.event_location || null,
    guest_count: catering.guest_count ?? null,
    catering_notes: catering.catering_notes || null,
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderRecord)
    .select()
    .single()

  if (orderError || !order) {
    console.error('Pay-at-pickup order insert failed', orderError)
    res.status(500).json({ error: 'Could not create order' })
    return
  }

  const orderItems = data.items.map((item) => ({
    order_id: order.id,
    menu_item_id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) {
    console.error('Pay-at-pickup order items insert failed', itemsError)
    await supabase.from('orders').delete().eq('id', order.id)
    res.status(500).json({ error: 'Could not create order items' })
    return
  }

  const itemsForEmail = data.items.map((i) => ({
    name: i.name,
    quantity: i.quantity,
    price: i.price,
  }))
  const orderForNotify = {
    ...order,
    items: itemsForEmail,
  }
  try {
    await dispatchNotification(orderForNotify)
  } catch (e) {
    console.error('dispatchNotification failed', e)
  }

  res.status(200).json({ order })
}
