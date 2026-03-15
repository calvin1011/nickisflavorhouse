/**
 * POST /api/notify-token
 * Body: { orderId }. Returns a short-lived token for calling /api/notify.
 * Order must exist and have been created within the last 2 minutes.
 * Rate limited when Upstash is configured.
 */
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const TOKEN_MAX_AGE_MS = 2 * 60 * 1000

function getClientIdentifier(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0]
    if (first) return first.trim()
  }
  if (req.headers['x-real-ip']) return req.headers['x-real-ip']
  return req.socket?.remoteAddress || 'unknown'
}

function signNotifyToken(orderId, createdAt) {
  const secret = process.env.NOTIFY_SECRET
  if (!secret) return null
  return crypto.createHmac('sha256', secret).update(`${orderId}:${createdAt}`).digest('hex')
}

export default async function handler(req, res) {
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
    const { success } = await ratelimit.limit(`notify-token:${getClientIdentifier(req)}`)
    if (!success) {
      res.status(429).json({ error: 'Too many requests. Please try again in a minute.' })
      return
    }
  }

  const secret = process.env.NOTIFY_SECRET
  if (!secret) {
    console.error('Missing NOTIFY_SECRET')
    res.status(500).json({ error: 'Server configuration error' })
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

  const orderId = body?.orderId
  if (!orderId || typeof orderId !== 'string') {
    res.status(400).json({ error: 'orderId is required' })
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, created_at')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    res.status(404).json({ error: 'Order not found' })
    return
  }

  const createdAt = order.created_at
  if (!createdAt) {
    res.status(400).json({ error: 'Order has no created_at' })
    return
  }

  const createdTime = new Date(createdAt).getTime()
  if (Number.isNaN(createdTime) || Date.now() - createdTime > TOKEN_MAX_AGE_MS) {
    res.status(400).json({ error: 'Token expired or order too old. Please try again from checkout.' })
    return
  }

  const token = signNotifyToken(orderId, createdAt)
  res.status(200).json({ token, createdAt })
}
