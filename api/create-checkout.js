/**
 * Create Checkout: validate payload, create pending order + order_items in Supabase,
 * create Stripe Checkout Session, return session URL.
 * Matches schema: orders (subtotal, deposit_amount, balance_due in dollars; flattened catering fields); order_items (no is_catering).
 */
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const DEPOSIT_PERCENT = 0.5
const MIN_DEPOSIT_CENTS = 2000

function calculateDeposit(subtotalCents) {
  if (typeof subtotalCents !== 'number' || subtotalCents <= 0) return 0
  const byPercent = Math.round(subtotalCents * DEPOSIT_PERCENT)
  return Math.max(byPercent, MIN_DEPOSIT_CENTS)
}

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
  order_type: z.enum(['pickup', 'catering']),
  pickup_date: dateString.optional(),
  pickup_time: timeString.optional(),
  notes: z.string().max(2000).optional().default(''),
  catering: cateringSchema.optional(),
  items: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(500),
    price: z.number().int().min(0),
    quantity: z.number().int().min(1).max(99),
    is_catering: z.boolean().optional(),
  })).min(1),
  subtotal_cents: z.number().int().min(1),
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
    return computed === data.subtotal_cents
  },
  { message: 'Subtotal does not match items', path: ['subtotal_cents'] }
)

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `NFH-${date}-${rand}`
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
  const subtotalCents = data.subtotal_cents
  const depositCents = calculateDeposit(subtotalCents)
  const balanceDueCents = Math.max(0, subtotalCents - depositCents)

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
    subtotal: subtotalCents / 100,
    deposit_amount: depositCents / 100,
    balance_due: balanceDueCents / 100,
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

  let session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: "Deposit — Nicki's Flavor House",
              description: `Order ${orderNumber} — 50% deposit (balance due at pickup)`,
            },
            unit_amount: depositCents,
          },
          quantity: 1,
        },
      ],
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
