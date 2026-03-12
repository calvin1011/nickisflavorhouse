import { describe, it, expect } from 'vitest'
import { formatCurrency } from './formatCurrency'

describe('formatCurrency', () => {
  it('formats cents as USD', () => {
    expect(formatCurrency(1250)).toBe('$12.50')
    expect(formatCurrency(0)).toBe('$0.00')
    expect(formatCurrency(9999)).toBe('$99.99')
  })

  it('returns $0.00 for NaN or non-number', () => {
    expect(formatCurrency(NaN)).toBe('$0.00')
    expect(formatCurrency('invalid')).toBe('$0.00')
  })
})
