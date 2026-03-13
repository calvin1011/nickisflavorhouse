/**
 * POST /api/send-contact
 * Body: { name, email, message }. Sends email to NICKI_EMAIL via Resend.
 */
import { z } from 'zod'

const RESEND_URL = 'https://api.resend.com/emails'

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Enter a valid email'),
  message: z.string().min(1, 'Message is required').max(5000),
})

function escapeHtml(s) {
  if (typeof s !== 'string') return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function sanitizeString(str) {
  if (str == null || typeof str !== 'string') return ''
  return String(str).trim().slice(0, 5000)
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

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  const to = process.env.NICKI_EMAIL

  if (!apiKey || !to) {
    res.status(500).json({ error: 'Server configuration error' })
    return
  }
  if (!from) {
    res.status(500).json({ error: 'Missing RESEND_FROM' })
    return
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    res.status(400).json({ error: 'Invalid JSON' })
    return
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    res.status(400).json({ error: first?.message || 'Validation failed' })
    return
  }

  const name = sanitizeString(parsed.data.name).slice(0, 200)
  const email = parsed.data.email.trim()
  const message = sanitizeString(parsed.data.message)

  const subject = `Contact from ${escapeHtml(name)} — Nicki's Flavor House`
  const lines = [
    `From: ${name}`,
    `Email: ${email}`,
    '',
    message,
  ]
  const html = `<pre style="font-family:sans-serif;white-space:pre-wrap;">${lines.map((l) => escapeHtml(l)).join('\n')}</pre>`

  const fetchRes = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject,
      html,
    }),
  })

  const data = await fetchRes.json().catch(() => ({}))
  if (!fetchRes.ok) {
    console.error('Resend contact send failed', data)
    res.status(500).json({ error: 'Could not send message' })
    return
  }

  res.status(200).json({ ok: true })
}
