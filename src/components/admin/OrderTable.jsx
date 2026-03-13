import { formatDollars } from '@/utils/formatCurrency'
import { OrderStatusBadge } from './OrderStatusBadge'

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function OrderTable({ orders, onSelectOrder }) {
  if (!orders.length) {
    return (
      <p className="py-8 text-center text-sm text-brand-foreground/70">
        No orders match the current filter.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-brand-muted/30 bg-white">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead>
          <tr className="border-b border-brand-muted/30 bg-brand-muted/10">
            <th className="px-4 py-3 font-medium text-brand-foreground">Order</th>
            <th className="px-4 py-3 font-medium text-brand-foreground">Customer</th>
            <th className="px-4 py-3 font-medium text-brand-foreground">Type</th>
            <th className="px-4 py-3 font-medium text-brand-foreground">Date</th>
            <th className="px-4 py-3 font-medium text-brand-foreground">Total</th>
            <th className="px-4 py-3 font-medium text-brand-foreground">Status</th>
            <th className="px-4 py-3 font-medium text-brand-foreground text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="border-b border-brand-muted/20 last:border-0 hover:bg-brand-muted/5"
            >
              <td className="px-4 py-3">
                <span className="font-medium text-brand-foreground">
                  {order.order_number ?? '—'}
                </span>
              </td>
              <td className="px-4 py-3 text-brand-foreground/90">
                {order.customer_name ?? '—'}
              </td>
              <td className="px-4 py-3 text-brand-foreground/80">
                {order.order_type === 'catering' ? 'Catering' : 'Pickup'}
              </td>
              <td className="px-4 py-3 text-brand-foreground/80">
                {formatDate(order.pickup_date ?? order.created_at)}
              </td>
              <td className="px-4 py-3 text-brand-foreground/80">
                {formatDollars(order.subtotal)}
              </td>
              <td className="px-4 py-3">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onSelectOrder(order)}
                  className="rounded px-3 py-1.5 text-sm font-medium text-brand-primary hover:bg-brand-primary/10 transition-colors"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
