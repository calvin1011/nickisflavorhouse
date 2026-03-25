export function formatPaymentMethodLabel(method) {
  if (method === 'stripe') return 'Card (Stripe)'
  if (method === 'cashapp') return 'Cash App'
  if (method === 'zelle') return 'Zelle'
  if (method === 'cash') return 'Cash at pickup'
  return method ? String(method) : ''
}

export function formatPaymentStatusLabel(status) {
  if (status === 'paid_in_full') return 'Paid in full'
  if (status === 'deposit_paid') return 'Deposit paid'
  if (status === 'pending') return 'Payment pending'
  if (status === 'refunded') return 'Refunded'
  return status ? String(status) : ''
}
