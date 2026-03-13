/**
 * Notifications: email via Resend, push via ntfy.sh.
 * dispatchNotification(order) runs both in parallel; uses Promise.allSettled so one failure doesn't block the other.
 */

const RESEND_URL = 'https://api.resend.com/emails'
const NTFY_URL = 'https://ntfy.sh'

/**
 * @param {object} order - Full order with items: { order_number, customer_name, customer_email, ... }, items: [{ name, quantity, price }, ...]
 * @returns {Promise<{ ok: boolean, id?: string, error?: string }>}
 */
export async function sendEmailNotification(order) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  const to = process.env.NICKI_EMAIL

  if (!apiKey || !to) {
    return { ok: false, error: 'Missing RESEND_API_KEY or NICKI_EMAIL' }
  }
  if (!from) {
    return { ok: false, error: 'Missing RESEND_FROM (e.g. onboarding@resend.dev or your verified domain)' }
  }

  const subject = `New order ${order.order_number} — Nicki's Flavor House`
  const lines = [
    `Order: ${order.order_number}`,
    `Customer: ${order.customer_name}`,
    `Email: ${order.customer_email}`,
    `Phone: ${order.customer_phone}`,
    `Type: ${order.order_type}`,
    order.pickup_date ? `Pickup: ${order.pickup_date} ${order.pickup_time || ''}` : null,
    order.is_catering && order.event_date
      ? `Event: ${order.event_date} ${order.event_time || ''} — ${order.event_location || ''} (${order.guest_count ?? ''} guests)`
      : null,
    '',
    'Items:',
    ...(order.items || []).map((i) => `  ${i.name} x${i.quantity} — $${(Number(i.price) * Number(i.quantity)).toFixed(2)}`),
    '',
    `Subtotal: $${Number(order.subtotal).toFixed(2)}`,
    `Deposit: $${Number(order.deposit_amount).toFixed(2)}`,
    `Balance due: $${Number(order.balance_due).toFixed(2)}`,
    order.notes ? `Notes: ${order.notes}` : null,
    order.catering_notes ? `Catering notes: ${order.catering_notes}` : null,
  ].filter(Boolean)

  const html = `<pre style="font-family:sans-serif;white-space:pre-wrap;">${lines.map((l) => escapeHtml(l)).join('\n')}</pre>`

  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, error: data.message || data.error || res.statusText }
  }
  return { ok: true, id: data.id }
}

function escapeHtml(s) {
  if (typeof s !== 'string') return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * @param {object} order - Order with order_number, customer_name, subtotal, deposit_amount, balance_due
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function sendPushNotification(order) {
  const topic = process.env.NTFY_TOPIC
  if (!topic) {
    return { ok: false, error: 'Missing NTFY_TOPIC' }
  }

  const title = `Order ${order.order_number}`
  const message = [
    `${order.customer_name}`,
    `Deposit $${Number(order.deposit_amount).toFixed(2)} · Balance $${Number(order.balance_due).toFixed(2)}`,
  ].join(' — ')

  const res = await fetch(`${NTFY_URL}/${topic}`, {
    method: 'POST',
    headers: {
      Title: title,
      Priority: 'default',
    },
    body: message,
  })

  if (!res.ok) {
    return { ok: false, error: res.statusText }
  }
  return { ok: true }
}

/**
 * Run email and push in parallel; does not throw.
 * @param {object} order - Full order with items (see sendEmailNotification)
 * @returns {Promise<{ email: { ok: boolean, id?: string, error?: string }, push: { ok: boolean, error?: string } }>}
 */
export async function dispatchNotification(order) {
  const [emailResult, pushResult] = await Promise.allSettled([
    sendEmailNotification(order),
    sendPushNotification(order),
  ])

  const email = emailResult.status === 'fulfilled' ? emailResult.value : { ok: false, error: String(emailResult.reason) }
  const push = pushResult.status === 'fulfilled' ? pushResult.value : { ok: false, error: String(pushResult.reason) }

  if (!email.ok) console.error('Notify: email failed', email.error)
  if (!push.ok) console.error('Notify: push failed', push.error)

  return { email, push }
}
