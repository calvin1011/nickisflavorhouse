/**
 * Create Checkout: validate payload, create pending order + order_items in Supabase,
 * create Stripe Checkout Session, return session URL.
 * Rate limited via Upstash when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.
 */
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { z } from 'zod'

/**
 * Stripe Checkout: full order total (subtotal + delivery fee if delivery). DB stores deposit_amount = 0, balance_due = 0.
 */

function sanitizeString(str) {
  if (str == null || typeof str !== 'string') return ''
  return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;').trim()
}

function sanitizeOrder(obj) {
  if (obj == null || typeof obj !== 'object') return {}
  const out = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      out[key] = sanitizeString(value)
    } else if (value != null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      out[key] = sanitizeOrder(value)
    } else {
      out[key] = value
    }
  }
  return out
}

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const timeString = z.string().min(1)
const cateringSchema = z.object({
  event_date: dateString,
  event_time: timeString,
  event_location: z.string().min(1).max(500),
  guest_count: z.coerce.number().int().min(1).max(5000),
  catering_notes: z.string().max(2000).optional().default(''),
})

const checkoutPayloadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  order_type: z.enum(['pickup', 'delivery', 'catering']),
  pickup_date: dateString.optional(),
  pickup_time: timeString.optional(),
  notes: z.string().max(2000).optional().default(''),
  catering: cateringSchema.optional(),
  delivery_address: z.string().max(500).optional(),
  delivery_fee: z.number().min(0).optional(),
  delivery_distance_miles: z.number().min(0).optional(),
  payment_method: z.literal('stripe').optional(),
  items: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(500),
    price: z.number().min(0),
    quantity: z.number().int().min(1).max(99),
    is_catering: z.boolean().optional(),
  })).min(1),
  subtotal: z.number().min(0),
}).refine(
  (data) => {
    if (data.order_type === 'pickup') return !!data.pickup_date && !!data.pickup_time
    return true
  },
  { message: 'Pickup date and time required', path: ['pickup_date'] }
).refine(
  (data) => {
    if (data.order_type === 'catering') return !!data.catering
    return true
  },
  { message: 'Catering details required', path: ['catering'] }
).refine(
  (data) => {
    const computed = data.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    return Math.abs(computed - data.subtotal) < 0.02
  },
  { message: 'Subtotal does not match items', path: ['subtotal'] }
)

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `NFH-${date}-${rand}`
}

function getClientIdentifier(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0]
    if (first) return first.trim()
  }
  if (req.headers['x-real-ip']) return req.headers['x-real-ip']
  return req.socket?.remoteAddress || 'unknown'
}

function getDayOfWeek(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null
  return new Date(dateStr + 'T12:00:00').getDay()
}

function timeToComparable(t) {
  if (!t || typeof t !== 'string') return ''
  return String(t).slice(0, 5)
}

function isTimeInRange(timeStr, minTime, maxTime) {
  const t = timeToComparable(timeStr)
  const min = timeToComparable(minTime)
  const max = timeToComparable(maxTime)
  if (!t || !min || !max) return true
  return t >= min && t <= max
}

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
    const { success } = await ratelimit.limit(`create-checkout:${getClientIdentifier(req)}`)
    if (!success) {
      res.status(429).json({ error: 'Too many requests. Please try again in a minute.' })
      return
    }
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const stripeSecret = process.env.STRIPE_SECRET_KEY
  const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173'

  if (!supabaseUrl || !supabaseServiceKey || !stripeSecret) {
    console.error('Missing env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or STRIPE_SECRET_KEY')
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

  const parsed = checkoutPayloadSchema.safeParse(body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    return
  }

  const data = sanitizeOrder(parsed.data)

  if (data.order_type === 'pickup' && data.pickup_date && data.pickup_time) {
    const dayOfWeek = getDayOfWeek(data.pickup_date)
    if (dayOfWeek === null) {
      res.status(400).json({ error: 'Invalid pickup date.' })
      return
    }
    const supabaseForAvailability = createClient(supabaseUrl, supabaseServiceKey)
    const { data: row } = await supabaseForAvailability
      .from('pickup_availability_by_day')
      .select('is_available, min_time, max_time')
      .eq('day_of_week', dayOfWeek)
      .single()
    if (!row) {
      res.status(400).json({ error: 'Availability not configured for this day.' })
      return
    }
    if (!row.is_available) {
      res.status(400).json({
        error: 'Pickup is not available on the selected day. Please choose another date.',
      })
      return
    }
    if (!isTimeInRange(data.pickup_time, row.min_time, row.max_time)) {
      res.status(400).json({
        error: 'Pickup time is outside available hours. Please choose a time within the displayed availability.',
      })
      return
    }
  }
  const subtotalDollars = data.subtotal
  const deliveryFeeDollars = (data.order_type === 'delivery' && typeof data.delivery_fee === 'number') ? data.delivery_fee : 0
  const orderTotalDollars = subtotalDollars + deliveryFeeDollars

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
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
    payment_method: 'stripe',
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
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('Order insert failed', orderError)
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
    console.error('Order items insert failed', itemsError)
    await supabase.from('orders').delete().eq('id', order.id)
    res.status(500).json({ error: 'Could not create order items' })
    return
  }

  const stripe = new Stripe(stripeSecret)
  const successUrl = `${appUrl.replace(/\/$/, '')}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${appUrl.replace(/\/$/, '')}/checkout`

  const lineItems = [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: "Order — Nicki's Flavor House",
          description: `Order ${orderNumber}`,
        },
        unit_amount: Math.round(subtotalDollars * 100),
      },
      quantity: 1,
    },
  ]
  if (deliveryFeeDollars > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Delivery Fee' },
        unit_amount: Math.round(deliveryFeeDollars * 100),
      },
      quantity: 1,
    })
  }

  let session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        order_id: order.id,
      },
    })
  } catch (err) {
    console.error('Stripe session create failed', err)
    await supabase.from('order_items').delete().eq('order_id', order.id)
    await supabase.from('orders').delete().eq('id', order.id)
    res.status(500).json({ error: 'Could not start payment' })
    return
  }

  res.status(200).json({ url: session.url })
}
