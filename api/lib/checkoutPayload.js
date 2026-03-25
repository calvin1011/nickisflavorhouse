import { z } from 'zod'

export function sanitizeString(str) {
  if (str == null || typeof str !== 'string') return ''
  return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;').trim()
}

export function sanitizeOrder(obj) {
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

export const cateringSchema = z.object({
  event_date: dateString,
  event_time: timeString,
  event_location: z.string().min(1).max(500),
  guest_count: z.coerce.number().int().min(1).max(5000),
  catering_notes: z.string().max(2000).optional().default(''),
})

const checkoutFields = {
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
  items: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(500),
    price: z.number().min(0),
    quantity: z.number().int().min(1).max(99),
    is_catering: z.boolean().optional(),
  })).min(1),
  subtotal: z.number().min(0),
}

export const checkoutPayloadSchema = z.object(checkoutFields).refine(
  (data) => {
    if (data.order_type === 'pickup' || data.order_type === 'delivery') return !!data.pickup_date && !!data.pickup_time
    return true
  },
  { message: 'Date and time required', path: ['pickup_date'] }
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

export const payAtPickupPayloadSchema = z.object({
  ...checkoutFields,
  payment_method: z.enum(['cashapp', 'zelle', 'cash']),
}).refine(
  (data) => {
    if (data.order_type === 'pickup' || data.order_type === 'delivery') return !!data.pickup_date && !!data.pickup_time
    return true
  },
  { message: 'Date and time required', path: ['pickup_date'] }
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

export function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `NFH-${date}-${rand}`
}

export function getClientIdentifier(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0]
    if (first) return first.trim()
  }
  if (req.headers['x-real-ip']) return req.headers['x-real-ip']
  return req.socket?.remoteAddress || 'unknown'
}

export function getDayOfWeek(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null
  return new Date(dateStr + 'T12:00:00').getDay()
}

function timeToComparable(t) {
  if (!t || typeof t !== 'string') return ''
  return String(t).slice(0, 5)
}

export function isTimeInRange(timeStr, minTime, maxTime) {
  const t = timeToComparable(timeStr)
  const min = timeToComparable(minTime)
  const max = timeToComparable(maxTime)
  if (!t || !min || !max) return true
  return t >= min && t <= max
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} data - Sanitized checkout payload
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function validatePickupWindow(supabase, data) {
  const needsDateTime = (data.order_type === 'pickup' || data.order_type === 'delivery') && data.pickup_date && data.pickup_time
  if (!needsDateTime) return { ok: true }

  const dayOfWeek = getDayOfWeek(data.pickup_date)
  if (dayOfWeek === null) {
    return { ok: false, error: 'Invalid date.' }
  }
  const { data: row, error } = await supabase
    .from('pickup_availability_by_day')
    .select('is_available, min_time, max_time')
    .eq('day_of_week', dayOfWeek)
    .single()

  if (error || !row) {
    return { ok: false, error: 'Availability not configured for this day.' }
  }
  if (!row.is_available) {
    const typeLabel = data.order_type === 'delivery' ? 'Delivery' : 'Pickup'
    return { ok: false, error: `${typeLabel} is not available on the selected day. Please choose another date.` }
  }
  if (!isTimeInRange(data.pickup_time, row.min_time, row.max_time)) {
    return {
      ok: false,
      error: 'Time is outside available hours. Please choose a time within the displayed availability.',
    }
  }
  return { ok: true }
}
