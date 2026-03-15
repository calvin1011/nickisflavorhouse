import { useAvailability, formatPickupHoursSummary } from '@/hooks/useAvailability'

/**
 * Shows Nicki's chosen pickup hours so customers see availability before picking a date/time.
 */
export function PickupHoursSummary() {
  const { byDay, loading, error } = useAvailability()

  if (loading || error || !byDay) return null

  const rows = formatPickupHoursSummary(byDay)
  if (!rows.length) return null

  return (
    <div className="rounded-lg border border-brand-muted/30 bg-brand-muted/10 p-4">
      <p className="mb-2 text-sm font-medium text-brand-foreground">
        Pickup hours (choose a date and time within these windows)
      </p>
      <ul className="text-sm text-brand-foreground/90" aria-label="Pickup availability by day">
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
