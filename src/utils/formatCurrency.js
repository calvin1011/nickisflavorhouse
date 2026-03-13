/**
 * Format a number as USD currency. DB and frontend use dollars; only Stripe uses cents.
 * @param {number} amount - Amount in dollars
 * @returns {string} e.g. "$12.50"
 */
export function formatCurrency(amount) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Alias for formatCurrency (amount in dollars).
 * @param {number} dollars - Amount in dollars
 * @returns {string} e.g. "$12.50"
 */
export function formatDollars(dollars) {
  return formatCurrency(dollars)
}
