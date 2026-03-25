/**
 * POST /api/special-order — Create a special/custom order request.
 * No cart items or upfront payment; order is created as pending and the admin follows up with a quote.
 */
import { createClient } from '@supabase/supabase-js'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { z } from 'zod'
import {
  sanitizeOrder,
  generateOrderNumber,
  getClientIdentifier,
  validatePickupWindow,
} from '../lib/server/checkoutPayload.js'
import { dispatchNotification } from './notify.js'

const specialOrderSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  order_type: z.enum(['pickup', 'delivery']),
  pickup_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  pickup_time: z.string().min(1).optional(),
  special_order_details: z.string().min(1).max(5000),
  notes: z.string().max(2000).optional().default(''),
  payment_method: z.enum(['stripe', 'cashapp', 'zelle', 'cash']),
  delivery_address: z.string().max(500).optional(),
  delivery_fee: z.number().min(0).optional(),
  delivery_distance_miles: z.number().min(0).optional(),
}).refine(
  (data) => !!data.pickup_date && !!data.pickup_time,
  { message: 'Date and time required', path: ['pickup_date'] }
)

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
    const { success } = await ratelimit.limit(`special-order:${getClientIdentifier(req)}`)
    if (!success) {
      res.status(429).json({ error: 'Too many requests. Please try again in a minute.' })
      return
    }
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    res.status(400).json({ error: 'Invalid JSON' })
    return
  }

  const parsed = specialOrderSchema.safeParse(body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    return
  }

  const data = sanitizeOrder(parsed.data)

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    res.status(500).json({ error: 'Server configuration error' })
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const windowCheck = await validatePickupWindow(supabase, data)
  if (!windowCheck.ok) {
    res.status(400).json({ error: windowCheck.error })
    return
  }

  const orderNumber = generateOrderNumber()
  const notesContent = [
    '[Special Order Request]',
    data.special_order_details,
    data.notes ? `\nAdditional notes: ${data.notes}` : '',
  ].filter(Boolean).join('\n')

  const deliveryFeeDollars =
    data.order_type === 'delivery' && typeof data.delivery_fee === 'number'
      ? data.delivery_fee
      : 0

  const orderRecord = {
    order_number: orderNumber,
    customer_name: data.name,
    customer_email: data.email,
    customer_phone: data.phone,
    order_type: data.order_type,
    status: 'pending',
    payment_status: 'pending',
    payment_method: data.payment_method,
    subtotal: 0,
    deposit_amount: 0,
    balance_due: 0,
    delivery_address: data.order_type === 'delivery' ? (data.delivery_address || null) : null,
    delivery_fee: deliveryFeeDollars,
    delivery_distance_miles:
      data.order_type === 'delivery' && typeof data.delivery_distance_miles === 'number'
        ? data.delivery_distance_miles
        : null,
    notes: notesContent,
    pickup_date: data.pickup_date || null,
    pickup_time: data.pickup_time || null,
    is_catering: false,
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderRecord)
    .select()
    .single()

  if (orderError || !order) {
    console.error('Special order insert failed', orderError)
    res.status(500).json({ error: 'Could not create order' })
    return
  }

  try {
    await dispatchNotification({ ...order, items: [] })
  } catch (e) {
    console.error('dispatchNotification failed for special order', e)
  }

  res.status(200).json({ order })
}
