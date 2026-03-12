/**
 * Deposit is a percentage of subtotal with an optional minimum.
 * Balance due = subtotal - deposit.
 */

const DEPOSIT_PERCENT = 0.5
const MIN_DEPOSIT_CENTS = 2000 // $20

/**
 * @param {number} subtotalCents - Order subtotal in cents
 * @returns {number} Deposit amount in cents
 */
export function calculateDeposit(subtotalCents) {
  if (typeof subtotalCents !== 'number' || subtotalCents <= 0) return 0
  const byPercent = Math.round(subtotalCents * DEPOSIT_PERCENT)
  return Math.max(byPercent, MIN_DEPOSIT_CENTS)
}

/**
 * @param {number} subtotalCents - Order subtotal in cents
 * @param {number} depositCents - Deposit paid in cents (default: calculated)
 * @returns {number} Balance due in cents
 */
export function calculateBalanceDue(subtotalCents, depositCents = null) {
  if (typeof subtotalCents !== 'number' || subtotalCents <= 0) return 0
  const deposit = depositCents ?? calculateDeposit(subtotalCents)
  return Math.max(0, subtotalCents - deposit)
}
