export function calculateDeliveryFee(distanceMiles) {
  if (distanceMiles > 10) return null
  const fee = 4 + (distanceMiles / 10) * 11
  return Math.round(fee * 100) / 100
}
