import { describe, it, expect } from 'vitest'
import { calculateDeliveryFee } from './deliveryFee'

describe('deliveryFee', () => {
  it('returns null when distance exceeds 10 miles', () => {
    expect(calculateDeliveryFee(10.01)).toBe(null)
    expect(calculateDeliveryFee(15)).toBe(null)
  })

  it('returns fee at 0 miles (base)', () => {
    expect(calculateDeliveryFee(0)).toBe(4)
  })

  it('returns fee at 10 miles (max)', () => {
    const fee = calculateDeliveryFee(10)
    expect(fee).toBe(15)
  })

  it('rounds to two decimal places', () => {
    const fee = calculateDeliveryFee(5)
    expect(Number.isInteger(fee * 100)).toBe(true)
  })
})
