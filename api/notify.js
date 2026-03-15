/**
 * Notifications: email via Resend, push via ntfy.sh.
 * dispatchNotification(order) runs both in parallel; uses Promise.allSettled so one failure doesn't block the other.
 */

const RESEND_URL = 'https://api.resend.com/emails'
const NTFY_URL = 'https://ntfy.sh'

function escapeHtml(s) {
  if (typeof s !== 'string') return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * @param {object} order - Order with items, customer fields, etc.
 * @returns {string} HTML email body
 */
function buildOrderEmailHtml(order) {
  const orderNum = escapeHtml(String(order.order_number ?? ''))
  const customerName = escapeHtml(String(order.customer_name ?? ''))
  const customerEmail = escapeHtml(String(order.customer_email ?? ''))
  const customerPhone = escapeHtml(String(order.customer_phone ?? ''))
  const orderType = escapeHtml(String(order.order_type ?? 'pickup'))
  const subtotal = Number(order.subtotal ?? 0).toFixed(2)
  const notes = order.notes ? escapeHtml(String(order.notes)) : ''
  const cateringNotes = order.catering_notes ? escapeHtml(String(order.catering_notes)) : ''

  const pickupLine =
    order.pickup_date && order.order_type === 'pickup'
      ? `${escapeHtml(String(order.pickup_date))}${order.pickup_time ? ` at ${escapeHtml(String(order.pickup_time))}` : ''}`
      : ''
  const eventLine =
    order.is_catering && order.event_date
      ? `${escapeHtml(String(order.event_date))} ${escapeHtml(String(order.event_time ?? ''))} — ${escapeHtml(String(order.event_location ?? ''))}${order.guest_count ? ` (${escapeHtml(String(order.guest_count))} guests)` : ''}`
      : ''

  const items = (order.items || []).map((i) => ({
    name: escapeHtml(String(i.name ?? '')),
    quantity: Number(i.quantity) || 0,
    price: Number(i.price) || 0,
    lineTotal: ((Number(i.quantity) || 0) * (Number(i.price) || 0)).toFixed(2),
  }))

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order ${orderNum}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#2d5016 0%,#3d6b1f 100%);padding:24px 28px;">
              <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;letter-spacing:-0.02em;">New order</h1>
              <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.9);">${orderNum}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #eee;">
                    <span style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Customer</span><br>
                    <span style="font-size:16px;font-weight:600;color:#1a1a1a;">${customerName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #eee;">
                    <span style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Email</span><br>
                    <a href="mailto:${customerEmail}" style="font-size:15px;color:#2d5016;text-decoration:none;">${customerEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #eee;">
                    <span style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Phone</span><br>
                    <a href="tel:${customerPhone}" style="font-size:15px;color:#1a1a1a;text-decoration:none;">${customerPhone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #eee;">
                    <span style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Type</span><br>
                    <span style="font-size:15px;color:#1a1a1a;text-transform:capitalize;">${orderType}</span>
                  </td>
                </tr>
                ${pickupLine ? `
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #eee;">
                    <span style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Pickup</span><br>
                    <span style="font-size:15px;color:#1a1a1a;">${pickupLine}</span>
                  </td>
                </tr>
                ` : ''}
                ${eventLine ? `
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #eee;">
                    <span style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Event</span><br>
                    <span style="font-size:15px;color:#1a1a1a;">${eventLine}</span>
                  </td>
                </tr>
                ` : ''}
              </table>

              <p style="margin:0 0 8px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Items</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:8px;margin-bottom:20px;">
                <thead>
                  <tr style="background-color:#f9f9f9;">
                    <th align="left" style="padding:12px 14px;font-size:12px;color:#666;font-weight:600;text-transform:uppercase;">Item</th>
                    <th align="center" style="padding:12px 14px;font-size:12px;color:#666;font-weight:600;text-transform:uppercase;">Qty</th>
                    <th align="right" style="padding:12px 14px;font-size:12px;color:#666;font-weight:600;text-transform:uppercase;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map((i) => `
                  <tr>
                    <td style="padding:12px 14px;font-size:15px;color:#1a1a1a;border-top:1px solid #eee;">${i.name}</td>
                    <td align="center" style="padding:12px 14px;font-size:15px;color:#1a1a1a;border-top:1px solid #eee;">${i.quantity}</td>
                    <td align="right" style="padding:12px 14px;font-size:15px;color:#1a1a1a;border-top:1px solid #eee;">$${i.lineTotal}</td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td align="right" style="padding:6px 0;">
                    <span style="font-size:15px;color:#666;">Order total</span>
                    <span style="font-size:18px;font-weight:700;color:#2d5016;margin-left:12px;">$${subtotal}</span>
                  </td>
                </tr>
                <tr>
                  <td align="right" style="padding:4px 0;">
                    <span style="font-size:13px;color:#2d5016;font-weight:600;">Paid in full</span>
                  </td>
                </tr>
              </table>
              ${notes ? `
              <p style="margin:0 0 4px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Order notes</p>
              <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;background:#f9f9f9;padding:12px;border-radius:8px;border-left:3px solid #2d5016;">${notes}</p>
              ` : ''}
              ${cateringNotes ? `
              <p style="margin:0 0 4px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Catering notes</p>
              <p style="margin:0;font-size:15px;color:#1a1a1a;background:#f9f9f9;padding:12px;border-radius:8px;border-left:3px solid #2d5016;">${cateringNotes}</p>
              ` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background-color:#f9f9f9;border-top:1px solid #eee;font-size:12px;color:#666;">
              Nicki's Flavor House — order notification
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

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
    return { ok: false, error: 'Missing RESEND_FROM' }
  }
  if (from.includes('resend.dev')) {
    return {
      ok: false,
      error: 'RESEND_FROM cannot use resend.dev in production. Verify a domain in Resend and use e.g. orders@yourdomain.com',
    }
  }

  const subject = `New order ${order.order_number} — Nicki's Flavor House`
  const html = buildOrderEmailHtml(order)

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

/**
 * @param {object} order - Order with order_number, customer_name, subtotal
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
    `Paid in full — $${Number(order.subtotal).toFixed(2)}`,
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

const CUSTOMER_STATUS_SUBJECTS = {
  confirmed: "Your order is confirmed — Nicki's Flavor House",
  ready: "Your order is ready for pickup — Nicki's Flavor House",
}

/**
 * @param {object} order - Order with order_number, customer_name, pickup_date, pickup_time, order_type
 * @param {'confirmed'|'ready'} status
 * @param {{ pickupAddress?: string }} [options] - Pickup address for "ready" emails
 * @returns {string} HTML email body
 */
function buildCustomerStatusEmailHtml(order, status, options = {}) {
  const orderNum = escapeHtml(String(order.order_number ?? ''))
  const customerName = escapeHtml(String(order.customer_name ?? ''))
  const pickupLine =
    order.pickup_date && order.order_type === 'pickup'
      ? `${escapeHtml(String(order.pickup_date))}${order.pickup_time ? ` at ${escapeHtml(String(order.pickup_time))}` : ''}`
      : ''

  const isReady = status === 'ready'
  const headline = isReady ? 'Your order is ready for pickup' : 'Your order is confirmed'
  const bodyCopy = isReady
    ? `Order #${orderNum} is ready. Please come pick it up${pickupLine ? ` on ${pickupLine}` : ''}.`
    : `We've confirmed order #${orderNum}.${pickupLine ? ` Pickup: ${pickupLine}.` : ''}`
  const pickupAddress = options.pickupAddress ? escapeHtml(String(options.pickupAddress)) : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(headline)}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#2d5016 0%,#3d6b1f 100%);padding:24px 28px;">
              <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;letter-spacing:-0.02em;">${escapeHtml(headline)}</h1>
              <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.9);">Order #${orderNum}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;font-size:16px;color:#1a1a1a;line-height:1.5;">Hi ${customerName},</p>
              <p style="margin:0 0 24px;font-size:16px;color:#1a1a1a;line-height:1.5;">${bodyCopy}</p>
              ${isReady && pickupAddress ? `
              <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;line-height:1.5;"><strong>Pickup address:</strong><br>${pickupAddress}</p>
              ` : ''}
              <p style="margin:0;font-size:15px;color:#666;">Thank you for ordering from Nicki's Flavor House.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background-color:#f9f9f9;border-top:1px solid #eee;font-size:12px;color:#666;">
              Nicki's Flavor House
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Send status update email to the customer (confirmed or ready only).
 * @param {object} order - Full order with customer_email, order_number, etc.
 * @param {'confirmed'|'ready'} status
 * @param {{ pickupAddress?: string }} [options] - Pickup address for "ready" emails (from PICKUP_ADDRESS env)
 * @returns {Promise<{ ok: boolean, id?: string, error?: string }>}
 */
export async function sendCustomerStatusEmail(order, status, options = {}) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  const to = order.customer_email

  if (!apiKey || !from) {
    return { ok: false, error: 'Missing RESEND_API_KEY or RESEND_FROM' }
  }
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    return { ok: false, error: 'Invalid or missing customer email' }
  }
  if (status !== 'confirmed' && status !== 'ready') {
    return { ok: false, error: 'Status must be confirmed or ready' }
  }

  const subject = CUSTOMER_STATUS_SUBJECTS[status]
  const html = buildCustomerStatusEmailHtml(order, status, options)

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
