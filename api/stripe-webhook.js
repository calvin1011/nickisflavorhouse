import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function bufferFromReq(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env for webhook')
    res.status(500).json({ error: 'Server configuration error' })
    return
  }

  const rawBody = await bufferFromReq(req)
  const sig = req.headers['stripe-signature']
  if (!sig) {
    res.status(400).json({ error: 'Missing stripe-signature' })
    return
  }

  let event
  try {
    const stripe = new Stripe(stripeSecret)
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed', err.message)
    res.status(400).json({ error: 'Invalid signature' })
    return
  }

  if (event.type !== 'checkout.session.completed') {
    res.status(200).json({ received: true })
    return
  }

  const session = event.data.object
  const orderId = session.metadata?.order_id
  if (!orderId) {
    console.error('Webhook: no order_id in metadata')
    res.status(200).json({ received: true })
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { error } = await supabase
    .from('orders')
    .update({
      stripe_session_id: session.id,
      deposit_paid_at: new Date().toISOString(),
      status: 'pending',
    })
    .eq('id', orderId)

  if (error) {
    console.error('Webhook: order update failed', error)
    res.status(500).json({ error: 'Order update failed' })
    return
  }

  res.status(200).json({ received: true })
}
