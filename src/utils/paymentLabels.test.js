import { describe, it, expect } from 'vitest'
import { formatPaymentMethodLabel, formatPaymentStatusLabel } from './paymentLabels'

describe('formatPaymentMethodLabel', () => {
  it('maps known methods', () => {
    expect(formatPaymentMethodLabel('cashapp')).toBe('Cash App')
    expect(formatPaymentMethodLabel('zelle')).toBe('Zelle')
    expect(formatPaymentMethodLabel('cash')).toBe('Cash at pickup')
    expect(formatPaymentMethodLabel('stripe')).toBe('Card (Stripe)')
  })
})

describe('formatPaymentStatusLabel', () => {
  it('maps known statuses', () => {
    expect(formatPaymentStatusLabel('pending')).toBe('Payment pending')
    expect(formatPaymentStatusLabel('paid_in_full')).toBe('Paid in full')
  })
})
