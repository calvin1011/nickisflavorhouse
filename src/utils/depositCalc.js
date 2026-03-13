/**
 * Deposit is a percentage of subtotal with an optional minimum.
 * Balance due = subtotal - deposit. All amounts in dollars (DB/frontend); Stripe converts to cents only at API.
 */

const DEPOSIT_PERCENT = 0.5
const MIN_DEPOSIT_DOLLARS = 20

/**
 * @param {number} subtotalDollars - Order subtotal in dollars
 * @returns {number} Deposit amount in dollars
 */
export function calculateDeposit(subtotalDollars) {
  if (typeof subtotalDollars !== 'number' || subtotalDollars <= 0) return 0
  const byPercent = subtotalDollars * DEPOSIT_PERCENT
  return Math.max(byPercent, MIN_DEPOSIT_DOLLARS)
}

/**
 * @param {number} subtotalDollars - Order subtotal in dollars
 * @param {number} [depositDollars] - Deposit paid in dollars (default: calculated)
 * @returns {number} Balance due in dollars
 */
export function calculateBalanceDue(subtotalDollars, depositDollars = null) {
  if (typeof subtotalDollars !== 'number' || subtotalDollars <= 0) return 0
  const deposit = depositDollars ?? calculateDeposit(subtotalDollars)
  return Math.max(0, subtotalDollars - deposit)
}
