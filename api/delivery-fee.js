/**
 * POST /api/delivery-fee
 * Body: { customerAddress }. Returns { miles, fee } or 400 with error.
 */
import { calculateDeliveryFee } from '../src/utils/deliveryFee.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { customerAddress } = req.body || {}
  if (!customerAddress || typeof customerAddress !== 'string' || !customerAddress.trim()) {
    return res.status(400).json({ error: 'Address required' })
  }

  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) {
    console.error('Missing GOOGLE_MAPS_API_KEY')
    return res.status(500).json({ error: 'Delivery distance is not configured' })
  }

  const origin = encodeURIComponent('75244, Dallas, TX')
  const destination = encodeURIComponent(customerAddress.trim())
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&units=imperial&key=${key}`

  const timeoutMs = 15000
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  let data
  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    data = await response.json()
  } catch (err) {
    clearTimeout(timeoutId)
    const isAbort = err?.name === 'AbortError' || err?.message === 'AbortError'
    return res.status(502).json({
      error: isAbort
        ? 'Distance service timed out. Please try again.'
        : 'Could not reach distance service. Please try again.',
    })
  }

  const element = data?.rows?.[0]?.elements?.[0]

  if (!element || element.status !== 'OK') {
    return res.status(400).json({
      error: 'Could not calculate distance. Please check your address.',
    })
  }

  const miles = element.distance.value / 1609.34

  if (miles > 10) {
    return res.status(400).json({
      error: `Sorry! We only deliver within 10 miles. Your address is ${miles.toFixed(1)} miles away.`,
    })
  }

  const fee = calculateDeliveryFee(miles)
  res.status(200).json({ miles: miles.toFixed(1), fee })
}
