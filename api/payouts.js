/**
 * GET /api/payouts
 * Returns Stripe balance (available, pending) and recent payouts.
 * Admin-only: call from admin UI; protect via same auth as /admin/* (page-level).
 * Uses STRIPE_SECRET_KEY server-side only.
 */
import Stripe from 'stripe'

const STRIPE_DASHBOARD_PAYOUTS = 'https://dashboard.stripe.com/payouts'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY
  if (!stripeSecret) {
    res.status(500).json({ error: 'Server configuration error' })
    return
  }

  const stripe = new Stripe(stripeSecret)

  try {
    const [balance, payoutsResponse] = await Promise.all([
      stripe.balance.retrieve(),
      stripe.payouts.list({ limit: 10 }),
    ])

    const availableCents = balance.available?.reduce((sum, b) => sum + (b.amount || 0), 0) ?? 0
    const pendingCents = balance.pending?.reduce((sum, b) => sum + (b.amount || 0), 0) ?? 0

    res.status(200).json({
      balance: {
        available_cents: availableCents,
        pending_cents: pendingCents,
      },
      payouts: (payoutsResponse.data || []).map((p) => ({
        id: p.id,
        amount_cents: p.amount,
        currency: p.currency,
        status: p.status,
        arrival_date: p.arrival_date,
        created: p.created,
      })),
      dashboard_url: STRIPE_DASHBOARD_PAYOUTS,
    })
  } catch (err) {
    console.error('Payouts API error:', err)
    res.status(500).json({ error: err.message || 'Failed to load payouts' })
  }
}
