import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { formatCurrency, formatDollars } from '@/utils/formatCurrency'
import { OrderStatusBadge } from './OrderStatusBadge'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function OrderDetailDrawer({ order, open, onClose, onUpdateStatus, getOrderItems }) {
  const [items, setItems] = useState([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [statusValue, setStatusValue] = useState(order?.status ?? 'pending')
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (order) setStatusValue(order.status ?? 'pending')
  }, [order?.id, order?.status])

  useEffect(() => {
    if (!open || !order || !getOrderItems) return
    setItemsLoading(true)
    setError(null)
    getOrderItems(order.id)
      .then(setItems)
      .catch((err) => {
        setError(err?.message ?? 'Failed to load items')
        setItems([])
      })
      .finally(() => setItemsLoading(false))
  }, [open, order?.id, getOrderItems])

  const handleStatusChange = async () => {
    if (!order || statusValue === (order.status ?? 'pending')) return
    setUpdating(true)
    setError(null)
    try {
      await onUpdateStatus(order.id, statusValue)
    } catch (err) {
      setError(err?.message ?? 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  if (!order) return null

  return (
    <>
      <div
        role="presentation"
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-xl transition-transform duration-200 ease-out flex flex-col',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-modal="true"
        aria-labelledby="order-drawer-title"
      >
        <div className="flex items-center justify-between border-b border-brand-muted/30 px-4 py-3">
          <h2 id="order-drawer-title" className="font-display text-lg font-semibold text-brand-foreground">
            Order {order.order_number}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-brand-foreground/70 hover:bg-brand-muted/20 hover:text-brand-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="text-xs font-medium uppercase tracking-wide text-brand-foreground/60 mb-2">
              Customer
            </h3>
            <dl className="text-sm text-brand-foreground/90 space-y-1">
              <div><dt className="sr-only">Name</dt><dd>{order.customer_name ?? '—'}</dd></div>
              <div><dt className="sr-only">Email</dt><dd>{order.customer_email ?? '—'}</dd></div>
              <div><dt className="sr-only">Phone</dt><dd>{order.customer_phone ?? '—'}</dd></div>
            </dl>
          </section>

          <section>
            <h3 className="text-xs font-medium uppercase tracking-wide text-brand-foreground/60 mb-2">
              Order details
            </h3>
            <dl className="text-sm text-brand-foreground/90 space-y-1">
              <div className="flex justify-between">
                <dt>Type</dt>
                <dd>{order.order_type === 'catering' ? 'Catering' : 'Pickup'}</dd>
              </div>
              {order.pickup_date && (
                <div className="flex justify-between">
                  <dt>Pickup date</dt>
                  <dd>{formatDate(order.pickup_date)}</dd>
                </div>
              )}
              {order.pickup_time && (
                <div className="flex justify-between">
                  <dt>Pickup time</dt>
                  <dd>{order.pickup_time}</dd>
                </div>
              )}
              <div className="flex justify-between items-center">
                <dt>Status</dt>
                <dd><OrderStatusBadge status={order.status} /></dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="text-xs font-medium uppercase tracking-wide text-brand-foreground/60 mb-2">
              Update status
            </h3>
            <div className="flex gap-2">
              <select
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value)}
                className="flex-1 rounded-md border border-brand-muted/40 bg-white px-3 py-2 text-sm text-brand-foreground focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleStatusChange}
                disabled={updating || statusValue === (order.status ?? 'pending')}
                className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary-dark disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                {updating ? 'Saving…' : 'Save'}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </section>

          {order.notes && (
            <section>
              <h3 className="text-xs font-medium uppercase tracking-wide text-brand-foreground/60 mb-2">
                Customer notes
              </h3>
              <p className="text-sm text-brand-foreground/90 whitespace-pre-wrap">
                {order.notes}
              </p>
            </section>
          )}

          <section>
            <h3 className="text-xs font-medium uppercase tracking-wide text-brand-foreground/60 mb-2">
              Items
            </h3>
            {itemsLoading ? (
              <p className="text-sm text-brand-foreground/70">Loading items…</p>
            ) : (
              <ul className="space-y-2 text-sm text-brand-foreground/90">
                {items.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{formatCurrencyLine(item)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border-t border-brand-muted/30 pt-4">
            <dl className="text-sm space-y-1">
              <div className="flex justify-between text-brand-foreground/90">
                <dt>Subtotal</dt>
                <dd>{formatDollars(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-brand-foreground/90">
                <dt>Deposit</dt>
                <dd>{formatDollars(order.deposit_amount)}</dd>
              </div>
              <div className="flex justify-between font-medium text-brand-foreground">
                <dt>Balance due</dt>
                <dd>{formatDollars(order.balance_due)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </>
  )
}

function formatCurrencyLine(item) {
  const priceDollars = Number(item.price) || 0
  const qty = Number(item.quantity) || 0
  return formatCurrency(priceDollars * qty)
}
