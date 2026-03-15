import { useAvailability, formatPickupHoursSummary } from '@/hooks/useAvailability'

/**
 * Shows Nicki's availability so customers see when they can pick up or receive delivery.
 */
export function PickupHoursSummary({ orderType = 'pickup' } = {}) {
  const { byDay, loading, error } = useAvailability()

  if (loading || error || !byDay) return null

  const rows = formatPickupHoursSummary(byDay)
  if (!rows.length) return null

  const isDelivery = orderType === 'delivery'
  const heading = isDelivery
    ? 'Availability (choose a date and time for delivery within these windows)'
    : 'Pickup hours (choose a date and time within these windows)'

  return (
    <div className="rounded-lg border border-brand-muted/30 bg-brand-muted/10 p-4">
      <p className="mb-2 text-sm font-medium text-brand-foreground">
        {heading}
      </p>
      <ul className="text-sm text-brand-foreground/90" aria-label={isDelivery ? 'Delivery availability by day' : 'Pickup availability by day'}>
        {rows.map(({ day, text }) => (
          <li key={day} className="flex justify-between gap-4 py-0.5">
            <span className="font-medium">{day}</span>
            <span className={text === 'Not available' ? 'text-brand-foreground/60' : ''}>
              {text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
