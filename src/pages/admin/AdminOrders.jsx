import { useState, useMemo } from 'react'
import { useOrders } from '@/hooks/useOrders'
import { OrderTable } from '@/components/admin/OrderTable'
import { OrderDetailDrawer } from '@/components/admin/OrderDetailDrawer'

const FILTER_LABELS = {
  all: 'All',
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function AdminOrders() {
  const {
    orders,
    loading,
    error,
    refetch,
    updateOrderStatus,
    getOrderItems,
    statusFilters,
  } = useOrders({ subscribeRealtime: true })

  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders
    return orders.filter((o) => (o.status ?? 'pending') === statusFilter)
  }, [orders, statusFilter])

  const handleSelectOrder = (order) => {
    setSelectedOrder(order)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedOrder(null)
  }

  const handleUpdateStatus = async (orderId, status) => {
    await updateOrderStatus(orderId, status)
  }

  return (
    <div className="p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-foreground">
            Orders
          </h1>
          <p className="mt-1 text-sm text-brand-foreground/70">
            View and update order status. List updates in real time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center justify-center rounded-md border border-brand-muted/40 bg-white px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-muted/10 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {statusFilters.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === key
                ? 'bg-brand-primary text-white'
                : 'bg-brand-muted/20 text-brand-foreground/80 hover:bg-brand-muted/30'
            }`}
          >
            {FILTER_LABELS[key] ?? key}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p>Failed to load orders: {error.message}</p>
        </div>
      )}

      {!error && loading && (
        <p className="mt-8 text-brand-foreground/70">Loading orders…</p>
      )}

      {!error && !loading && (
        <div className="mt-6">
          <OrderTable orders={filteredOrders} onSelectOrder={handleSelectOrder} />
        </div>
      )}

      <OrderDetailDrawer
        order={
          drawerOpen && selectedOrder
            ? orders.find((o) => o.id === selectedOrder.id) ?? selectedOrder
            : null
        }
        open={drawerOpen}
        onClose={handleCloseDrawer}
        onUpdateStatus={handleUpdateStatus}
        getOrderItems={getOrderItems}
      />
    </div>
  )
}
