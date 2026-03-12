import { describe, it, expect } from 'vitest'
import { calculateDeposit, calculateBalanceDue } from './depositCalc'

describe('depositCalc', () => {
  describe('calculateDeposit', () => {
    it('returns 50% of subtotal when above minimum', () => {
      expect(calculateDeposit(10000)).toBe(5000) // $100 -> $50
      expect(calculateDeposit(5000)).toBe(2500)   // $50 -> $25
    })

    it('returns minimum $20 when 50% is below minimum', () => {
      expect(calculateDeposit(2000)).toBe(2000)   // $20 -> $20 min
      expect(calculateDeposit(1000)).toBe(2000)   // $10 -> $20 min
      expect(calculateDeposit(0)).toBe(0)
    })

    it('returns 0 for zero or invalid subtotal', () => {
      expect(calculateDeposit(0)).toBe(0)
      expect(calculateDeposit(-100)).toBe(0)
    })
  })

  describe('calculateBalanceDue', () => {
    it('returns subtotal minus deposit when no deposit given', () => {
      expect(calculateBalanceDue(10000)).toBe(5000) // $100 - $50
      expect(calculateBalanceDue(5000)).toBe(2500)
    })

    it('uses provided deposit when given', () => {
      expect(calculateBalanceDue(10000, 3000)).toBe(7000)
      expect(calculateBalanceDue(10000, 10000)).toBe(0)
    })

    it('returns 0 for zero or invalid subtotal', () => {
      expect(calculateBalanceDue(0)).toBe(0)
      expect(calculateBalanceDue(-100)).toBe(0)
    })
  })
})
