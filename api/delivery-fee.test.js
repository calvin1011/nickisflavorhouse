/**
 * API route tests for POST /api/delivery-fee (checkout/order flow).
 * Validation, boundary behavior, and response shape.
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import handler from './delivery-fee.js'

function createMockRes() {
  const out = { _status: null, _body: null, _ended: false }
  return {
    ...out,
    status(code) {
      this._status = code
      return this
    },
    json(body) {
      this._body = body
      return this
    },
    end() {
      this._ended = true
      return this
    },
    setHeader() {
      return this
    },
  }
}

describe('POST /api/delivery-fee', () => {
  let mockFetch
  const originalEnv = process.env.GOOGLE_MAPS_API_KEY

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    process.env.GOOGLE_MAPS_API_KEY = 'test-key'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    process.env.GOOGLE_MAPS_API_KEY = originalEnv
  })

  it('returns 405 for non-POST', async () => {
    const res = createMockRes()
    await handler({ method: 'GET' }, res)
    expect(res._status).toBe(405)
  })

  it('returns 400 when customerAddress is missing', async () => {
    const res = createMockRes()
    await handler({ method: 'POST', body: {} }, res)
    expect(res._status).toBe(400)
    expect(res._body).toMatchObject({ error: 'Address required' })
  })

  it('returns 400 when customerAddress is blank string', async () => {
    const res = createMockRes()
    await handler({ method: 'POST', body: { customerAddress: '   ' } }, res)
    expect(res._status).toBe(400)
    expect(res._body).toMatchObject({ error: 'Address required' })
  })

  it('returns 400 when customerAddress is not a string', async () => {
    const res = createMockRes()
    await handler({ method: 'POST', body: { customerAddress: 123 } }, res)
    expect(res._status).toBe(400)
    expect(res._body).toMatchObject({ error: 'Address required' })
  })

  it('returns 500 when GOOGLE_MAPS_API_KEY is not set', async () => {
    delete process.env.GOOGLE_MAPS_API_KEY
    const res = createMockRes()
    await handler(
      { method: 'POST', body: { customerAddress: '123 Main St, Dallas, TX' } },
      res
    )
    expect(res._status).toBe(500)
    expect(res._body).toMatchObject({ error: 'Delivery distance is not configured' })
    process.env.GOOGLE_MAPS_API_KEY = 'test-key'
  })

  it('returns 400 and rejects when distance exceeds 10 miles', async () => {
    const milesInMeters = 20 * 1609.34
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        rows: [
          {
            elements: [
              {
                status: 'OK',
                distance: { value: milesInMeters },
              },
            ],
          },
        ],
      }),
    })
    const res = createMockRes()
    await handler(
      { method: 'POST', body: { customerAddress: 'Far Away, TX' } },
      res
    )
    expect(res._status).toBe(400)
    expect(res._body.error).toMatch(/only deliver within 10 miles/)
    expect(res._body.error).toMatch(/20\.0 miles/)
  })

  it('returns 200 with miles and fee for in-range address', async () => {
    const milesInMeters = 5 * 1609.34
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        rows: [
          {
            elements: [
              {
                status: 'OK',
                distance: { value: milesInMeters },
              },
            ],
          },
        ],
      }),
    })
    const res = createMockRes()
    await handler(
      { method: 'POST', body: { customerAddress: '123 Main St, Dallas, TX' } },
      res
    )
    expect(res._status).toBe(200)
    expect(res._body).toHaveProperty('miles')
    expect(res._body).toHaveProperty('fee')
    expect(typeof res._body.miles).toBe('string')
    expect(typeof res._body.fee).toBe('number')
    expect(parseFloat(res._body.miles)).toBeCloseTo(5, 1)
    expect(res._body.fee).toBeGreaterThanOrEqual(4)
    expect(res._body.fee).toBeLessThanOrEqual(15)
  })

  it('returns 400 when Distance Matrix returns non-OK element status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        rows: [{ elements: [{ status: 'ZERO_RESULTS' }] }],
      }),
    })
    const res = createMockRes()
    await handler(
      { method: 'POST', body: { customerAddress: 'Invalid Address' } },
      res
    )
    expect(res._status).toBe(400)
    expect(res._body.error).toMatch(/Could not calculate distance/)
  })

  it('returns 502 when fetch throws (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))
    const res = createMockRes()
    await handler(
      { method: 'POST', body: { customerAddress: '123 Main St' } },
      res
    )
    expect(res._status).toBe(502)
    expect(res._body).toHaveProperty('error')
  })

  it('returns 502 when fetch times out', async () => {
    mockFetch.mockImplementationOnce(
      () => new Promise((_, reject) => setTimeout(() => reject(new Error('AbortError')), 0))
    )
    const res = createMockRes()
    await handler(
      { method: 'POST', body: { customerAddress: '123 Main St' } },
      res
    )
    expect(res._status).toBe(502)
    expect(res._body).toHaveProperty('error')
  })
})
