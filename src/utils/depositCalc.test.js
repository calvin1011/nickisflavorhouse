import { describe, it, expect } from 'vitest'
import { calculateDeposit, calculateBalanceDue } from './depositCalc'

describe('depositCalc', () => {
  describe('calculateDeposit', () => {
    it('returns 50% of subtotal when above minimum', () => {
      expect(calculateDeposit(100)).toBe(50)   // $100 -> $50
      expect(calculateDeposit(50)).toBe(25)     // $50 -> $25
    })

    it('returns minimum $20 when 50% is below minimum', () => {
      expect(calculateDeposit(20)).toBe(20)    // $20 -> $20 min
      expect(calculateDeposit(10)).toBe(20)    // $10 -> $20 min
      expect(calculateDeposit(0)).toBe(0)
    })

    it('returns 0 for zero or invalid subtotal', () => {
      expect(calculateDeposit(0)).toBe(0)
      expect(calculateDeposit(-100)).toBe(0)
    })
  })

  describe('calculateBalanceDue', () => {
    it('returns subtotal minus deposit when no deposit given', () => {
      expect(calculateBalanceDue(100)).toBe(50)  // $100 - $50
      expect(calculateBalanceDue(50)).toBe(25)
    })

    it('uses provided deposit when given', () => {
      expect(calculateBalanceDue(100, 30)).toBe(70)
      expect(calculateBalanceDue(100, 100)).toBe(0)
    })

    it('returns 0 for zero or invalid subtotal', () => {
      expect(calculateBalanceDue(0)).toBe(0)
      expect(calculateBalanceDue(-100)).toBe(0)
    })
  })
})
