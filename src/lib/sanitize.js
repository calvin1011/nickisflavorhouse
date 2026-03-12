import DOMPurify from 'dompurify'

const TEXT_ONLY = { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }

/**
 * Sanitize a string for safe display/storage (strip HTML).
 * @param {string} str
 * @returns {string}
 */
export function sanitizeString(str) {
  if (str == null || typeof str !== 'string') return ''
  return DOMPurify.sanitize(str, TEXT_ONLY).trim()
}

/**
 * Recursively sanitize string values in an object (one level for known fields).
 * @param {Record<string, unknown>} obj - Checkout/catering payload
 * @returns {Record<string, unknown>}
 */
export function sanitizeOrder(obj) {
  if (obj == null || typeof obj !== 'object') return {}
  const out = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      out[key] = sanitizeString(value)
    } else if (value != null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      out[key] = sanitizeOrder(value)
    } else {
      out[key] = value
    }
  }
  return out
}
