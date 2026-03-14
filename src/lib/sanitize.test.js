import { describe, it, expect } from 'vitest'
import { sanitizeString, sanitizeOrder } from './sanitize'

describe('sanitizeString', () => {
  it('returns empty string for null/undefined', () => {
    expect(sanitizeString(null)).toBe('')
    expect(sanitizeString(undefined)).toBe('')
  })

  it('strips HTML tags', () => {
    expect(sanitizeString('<script>alert(1)</script>')).toBe('')
    expect(sanitizeString('<b>bold</b>')).toBe('bold')
    expect(sanitizeString('Hello <img onerror="x">')).toBe('Hello')
  })

  it('trims whitespace', () => {
    expect(sanitizeString('  foo  ')).toBe('foo')
  })

  it('returns plain text unchanged', () => {
    expect(sanitizeString('Safe text')).toBe('Safe text')
  })
})

describe('sanitizeOrder', () => {
  it('sanitizes string fields', () => {
    const input = { name: '<b>Nick</b>', email: 'n@x.com' }
    expect(sanitizeOrder(input)).toEqual({ name: 'Nick', email: 'n@x.com' })
  })

  it('recursively sanitizes nested objects', () => {
    const input = { customer: { name: '<script>x</script>' }, count: 1 }
    expect(sanitizeOrder(input)).toEqual({ customer: { name: '' }, count: 1 })
  })

  it('preserves numbers and non-string primitives', () => {
    const input = { qty: 2, flag: true }
    expect(sanitizeOrder(input)).toEqual({ qty: 2, flag: true })
  })

  it('returns empty object for null/undefined', () => {
    expect(sanitizeOrder(null)).toEqual({})
    expect(sanitizeOrder(undefined)).toEqual({})
  })
})
