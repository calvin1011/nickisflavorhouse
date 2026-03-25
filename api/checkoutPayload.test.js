/** @vitest-environment node */
import { describe, it, expect } from 'vitest'
import { payAtPickupPayloadSchema, checkoutPayloadSchema } from './lib/checkoutPayload.js'

const validUuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

describe('checkoutPayloadSchema', () => {
  it('accepts stripe checkout payload without payment_method in body', () => {
    const payload = {
      name: 'Test User',
      email: 'a@b.com',
      phone: '1234567890123',
      order_type: 'pickup',
      pickup_date: '2030-01-15',
      pickup_time: '12:00',
      notes: '',
      items: [{ id: validUuid, name: 'Item', price: 10, quantity: 1 }],
      subtotal: 10,
    }
    expect(checkoutPayloadSchema.safeParse(payload).success).toBe(true)
  })
})

describe('payAtPickupPayloadSchema', () => {
  it('accepts pay-at-pickup payload with payment_method', () => {
    const payload = {
      name: 'Test User',
      email: 'a@b.com',
      phone: '1234567890123',
      order_type: 'pickup',
      pickup_date: '2030-01-15',
      pickup_time: '12:00',
      notes: '',
      items: [{ id: validUuid, name: 'Item', price: 10, quantity: 1 }],
      subtotal: 10,
      payment_method: 'zelle',
    }
    expect(payAtPickupPayloadSchema.safeParse(payload).success).toBe(true)
  })

  it('rejects wrong payment_method', () => {
    const payload = {
      name: 'Test User',
      email: 'a@b.com',
      phone: '1234567890123',
      order_type: 'pickup',
      pickup_date: '2030-01-15',
      pickup_time: '12:00',
      notes: '',
      items: [{ id: validUuid, name: 'Item', price: 10, quantity: 1 }],
      subtotal: 10,
      payment_method: 'stripe',
    }
    expect(payAtPickupPayloadSchema.safeParse(payload).success).toBe(false)
  })
})
