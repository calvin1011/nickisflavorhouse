import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RevenueChart } from '@/components/admin/RevenueChart'
import { formatDollars } from '@/utils/formatCurrency'

function startOfDay(iso) {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function endOfDay(iso) {
  const d = new Date(iso)
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

function toDateKey(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const ORDER_COLUMNS =
  'id, order_number, customer_name, order_type, status, subtotal, deposit_amount, balance_due, created_at'

export function AdminReports() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  })
  const [orders, setOrders] = useState([])
  const [popularItems, setPopularItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchReportData = useCallback(async () => {
    if (!supabase) {
      setError(new Error('Supabase not configured'))
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const start = startOfDay(startDate)
    const end = endOfDay(endDate)
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(ORDER_COLUMNS)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: true })

      if (ordersError) throw ordersError
      const orderList = ordersData ?? []
      setOrders(orderList)

      if (orderList.length === 0) {
        setPopularItems([])
        setLoading(false)
        return
      }

      const orderIds = orderList.map((o) => o.id)
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('name, quantity')
        .in('order_id', orderIds)

      if (itemsError) throw itemsError
      const items = itemsData ?? []
      const byName = {}
      for (const row of items) {
        const name = row.name ?? 'Unknown'
        byName[name] = (byName[name] ?? 0) + (Number(row.quantity) || 0)
      }
      setPopularItems(
        Object.entries(byName)
          .map(([name, quantity]) => ({ name, quantity }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 15)
      )
    } catch (err) {
      setError(err)
      setOrders([])
      setPopularItems([])
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchReportData()
  }, [fetchReportData])

  const totalRevenue = orders.reduce(
    (sum, o) => sum + (Number(o.deposit_amount) || 0),
    0
  )
  const ordersByType = orders.reduce(
    (acc, o) => {
      const type = o.order_type === 'catering' ? 'catering' : 'pickup'
      acc[type] = (acc[type] ?? 0) + 1
      return acc
    },
    { pickup: 0, catering: 0 }
  )
  const revenueByDate = (() => {
    const byDate = {}
    for (const o of orders) {
      const key = (o.created_at || '').slice(0, 10)
      if (!key) continue
      byDate[key] = (byDate[key] ?? 0) + (Number(o.deposit_amount) || 0)
    }
    return Object.entries(byDate)
      .map(([date, revenue]) => ({ date: toDateKey(date), revenue }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  })()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-brand-foreground">
          Reports
        </h1>
        <p className="mt-1 text-sm text-brand-foreground/70">
          Revenue and order breakdowns by date range.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label
            htmlFor="report-start"
            className="block text-sm font-medium text-brand-foreground/80"
          >
            Start date
          </label>
          <input
            id="report-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 rounded-md border border-brand-muted/40 bg-white px-3 py-2 text-sm text-brand-foreground"
          />
        </div>
        <div>
          <label
            htmlFor="report-end"
            className="block text-sm font-medium text-brand-foreground/80"
          >
            End date
          </label>
          <input
            id="report-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 rounded-md border border-brand-muted/40 bg-white px-3 py-2 text-sm text-brand-foreground"
          />
        </div>
        <button
          type="button"
          onClick={() => fetchReportData()}
          className="rounded-md border border-brand-muted/40 bg-white px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-muted/10 transition-colors"
        >
          Update
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p>Failed to load report: {error.message}</p>
        </div>
      )}

      {loading && (
        <p className="text-brand-foreground/70">Loading report…</p>
      )}

      {!loading && !error && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-brand-muted/30 bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-brand-foreground/70">
                Total revenue (deposits)
              </p>
              <p className="mt-1 text-2xl font-bold text-brand-foreground">
                {formatDollars(totalRevenue)}
              </p>
            </div>
            <div className="rounded-lg border border-brand-muted/30 bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-brand-foreground/70">
                Pickup orders
              </p>
              <p className="mt-1 text-2xl font-bold text-brand-foreground">
                {ordersByType.pickup ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-brand-muted/30 bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-brand-foreground/70">
                Catering orders
              </p>
              <p className="mt-1 text-2xl font-bold text-brand-foreground">
                {ordersByType.catering ?? 0}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <RevenueChart data={revenueByDate} title="Revenue over time" />
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold text-brand-foreground">
              Popular items
            </h2>
            <p className="mt-1 text-sm text-brand-foreground/70">
              Top 15 by quantity sold in this range.
            </p>
            {popularItems.length === 0 ? (
              <p className="mt-4 rounded-lg border border-brand-muted/30 bg-white py-8 text-center text-sm text-brand-foreground/70">
                No items in this range.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-lg border border-brand-muted/30 bg-white">
                <table className="w-full min-w-[300px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-brand-muted/30 bg-brand-muted/10">
                      <th className="px-4 py-3 font-medium text-brand-foreground">
                        Item
                      </th>
                      <th className="px-4 py-3 font-medium text-brand-foreground text-right">
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {popularItems.map(({ name, quantity }) => (
                      <tr
                        key={name}
                        className="border-b border-brand-muted/20 last:border-0"
                      >
                        <td className="px-4 py-3 text-brand-foreground/90">
                          {name}
                        </td>
                        <td className="px-4 py-3 text-right text-brand-foreground/80">
                          {quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
