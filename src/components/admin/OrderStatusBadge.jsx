import { cn } from '@/lib/utils'

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-sky-100 text-sky-800',
  ready: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-brand-muted/30 text-brand-foreground/70',
}

export function OrderStatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? 'bg-brand-muted/20 text-brand-foreground/80'
  const label = status ? String(status).charAt(0).toUpperCase() + String(status).slice(1) : '—'
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        style
      )}
    >
      {label}
    </span>
  )
}
