import { Link } from 'react-router-dom'
import { UtensilsCrossed, ClipboardList } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'
import { OrderTable } from '@/components/admin/OrderTable'
import { formatDollars } from '@/utils/formatCurrency'

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function endOfToday() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

export function AdminDashboard() {
  const { orders, loading, error } = useOrders({ subscribeRealtime: false })

  const todayStart = startOfToday()
  const todayEnd = endOfToday()
  const todayOrders = orders.filter(
    (o) => o.created_at >= todayStart && o.created_at <= todayEnd
  )
  const pendingCount = orders.filter(
    (o) => (o.status ?? 'pending') === 'pending'
  ).length
  const totalRevenue = orders.reduce(
    (sum, o) => sum + (Number(o.subtotal) || 0) + (Number(o.delivery_fee) || 0),
    0
  )
  const recentOrders = orders.slice(0, 10)

  const handleSelectOrder = () => {}

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-brand-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-brand-foreground/70">
          At-a-glance metrics and recent orders.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p>Failed to load data: {error.message}</p>
        </div>
      )}

      {loading && (
        <p className="text-brand-foreground/70">Loading dashboard…</p>
      )}

      {!loading && !error && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-brand-muted/30 bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-brand-foreground/70">
                Today&apos;s orders
              </p>
              <p className="mt-1 text-2xl font-bold text-brand-foreground">
                {todayOrders.length}
              </p>
            </div>
            <div className="rounded-lg border border-brand-muted/30 bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-brand-foreground/70">
                Pending
              </p>
              <p className="mt-1 text-2xl font-bold text-brand-foreground">
                {pendingCount}
              </p>
            </div>
            <div className="rounded-lg border border-brand-muted/30 bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-brand-foreground/70">
                Total revenue
              </p>
              <p className="mt-1 text-2xl font-bold text-brand-foreground">
                {formatDollars(totalRevenue)}
              </p>
            </div>
            <div className="rounded-lg border border-brand-muted/30 bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-brand-foreground/70">
                Quick links
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  to="/admin/menu"
                  className="inline-flex items-center gap-1.5 rounded-md border border-brand-muted/40 bg-white px-3 py-1.5 text-sm font-medium text-brand-foreground hover:bg-brand-muted/10 transition-colors"
                >
                  <UtensilsCrossed className="h-4 w-4" />
                  Add menu item
                </Link>
                <Link
                  to="/admin/orders"
                  className="inline-flex items-center gap-1.5 rounded-md border border-brand-muted/40 bg-white px-3 py-1.5 text-sm font-medium text-brand-foreground hover:bg-brand-muted/10 transition-colors"
                >
                  <ClipboardList className="h-4 w-4" />
                  All orders
                </Link>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold text-brand-foreground">
              Recent orders
            </h2>
            <p className="mt-1 text-sm text-brand-foreground/70">
              Last 10 orders. View all in Orders.
            </p>
            <div className="mt-4">
              {recentOrders.length === 0 ? (
                <p className="rounded-lg border border-brand-muted/30 bg-white py-8 text-center text-sm text-brand-foreground/70">
                  No orders yet.
                </p>
              ) : (
                <OrderTable
                  orders={recentOrders}
                  onSelectOrder={handleSelectOrder}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
