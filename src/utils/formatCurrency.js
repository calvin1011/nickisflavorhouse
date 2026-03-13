/**
 * Format a number as USD currency.
 * @param {number} cents - Amount in cents
 * @returns {string} e.g. "$12.50"
 */
export function formatCurrency(cents) {
  if (typeof cents !== 'number' || Number.isNaN(cents)) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

/**
 * Format a dollar amount (already in dollars, e.g. from orders table).
 * @param {number} dollars - Amount in dollars
 * @returns {string} e.g. "$12.50"
 */
export function formatDollars(dollars) {
  if (typeof dollars !== 'number' || Number.isNaN(dollars)) return '$0.00'
  return formatCurrency(Math.round(dollars * 100))
}
