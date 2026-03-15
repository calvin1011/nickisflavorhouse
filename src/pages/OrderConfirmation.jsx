import { useSearchParams, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/utils/formatCurrency'
import { siteConfig } from '@/lib/siteConfig'
import { Instagram, MapPin } from 'lucide-react'
import PaymentLinks from '@/components/checkout/PaymentLinks'

export function OrderConfirmation() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const rawSessionId = searchParams.get('session_id')
  const orderId = searchParams.get('order_id')
  const paymentMethod = searchParams.get('method')
  const sessionId = typeof rawSessionId === 'string' ? rawSessionId.trim() : ''
  const validSessionId = sessionId && sessionId.startsWith('cs_') ? sessionId : null
  const clearCart = useCartStore((s) => s.clearCart)
  const [order, setOrder] = useState(location.state?.order ?? null)
  const [items, setItems] = useState(location.state?.items ?? [])
  const [loading, setLoading] = useState(!!validSessionId && !location.state?.order)
  const [error, setError] = useState(null)

  const isPayAtPickup = orderId && paymentMethod && paymentMethod !== 'stripe'
  const payAtPickupOrder = isPayAtPickup ? order : null
  const subtotalForPayAtPickup = payAtPickupOrder
    ? (Number(payAtPickupOrder.subtotal) || 0) + (Number(payAtPickupOrder.delivery_fee) || 0)
    : 0

  useEffect(() => {
    if (validSessionId) clearCart()
  }, [validSessionId, clearCart])

  useEffect(() => {
    if (!validSessionId) return
    if (location.state?.order) {
      setOrder(location.state.order)
      setItems(location.state.items || [])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    const url = `${window.location.origin}/api/order-by-session?session_id=${encodeURIComponent(validSessionId)}`
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? 'Order not found' : 'Could not load order')
        return r.json()
      })
      .then((data) => {
        if (!cancelled) {
          setOrder(data.order)
          setItems(data.items || [])
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [validSessionId, location.state])

  if (isPayAtPickup && payAtPickupOrder) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto flex-1 w-full max-w-2xl px-4 py-12 sm:px-6">
          <h1 className="font-display text-3xl font-bold text-brand-foreground">
            Thank you
          </h1>
          <p className="mt-4 text-brand-foreground/80">
            Order <strong>{payAtPickupOrder.order_number}</strong> is confirmed.
          </p>
          <div className="mt-6">
            <PaymentLinks paymentMethod={paymentMethod} subtotal={subtotalForPayAtPickup} />
          </div>
          {payAtPickupOrder.order_type === 'pickup' && (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-brand-muted/30 bg-white/50 p-4">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" aria-hidden />
              <div>
                <p className="font-medium text-brand-foreground">Pickup location</p>
                <p className="mt-1 text-sm text-brand-foreground/90">
                  {siteConfig.pickupAddress}
                </p>
                {payAtPickupOrder.pickup_date && (
                  <p className="mt-2 text-sm text-brand-foreground/80">
                    Your pickup: {new Date(payAtPickupOrder.pickup_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    {payAtPickupOrder.pickup_time && ` at ${payAtPickupOrder.pickup_time}`}
                  </p>
                )}
              </div>
            </div>
          )}
          <div className="mt-6">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-brand-primary hover:underline"
            >
              <Instagram size={18} aria-hidden />
              Follow us on Instagram
            </a>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (isPayAtPickup && !payAtPickupOrder) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto flex-1 w-full max-w-2xl px-4 py-12 sm:px-6">
          <h1 className="font-display text-3xl font-bold text-brand-foreground">
            Thank you
          </h1>
          <p className="mt-4 text-brand-foreground/80">
            Your order was placed. Please pay at pickup using the method you selected.
          </p>
          <div className="mt-6">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-brand-primary hover:underline"
            >
              <Instagram size={18} aria-hidden />
              Follow us on Instagram
            </a>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-brand-foreground">
          Thank you
        </h1>
        {!sessionId ? (
          <p className="mt-4 text-brand-foreground/80">
            No order session found. If you just completed payment, give us a moment and refresh.
          </p>
        ) : !validSessionId ? (
          <p className="mt-4 text-brand-foreground/80">
            Invalid session link. Please use the link from your confirmation email or contact us.
          </p>
        ) : loading ? (
          <p className="mt-4 text-brand-foreground/80">Loading your order...</p>
        ) : error ? (
          <p className="mt-4 text-brand-foreground/80">{error}</p>
        ) : order ? (
          <>
            <div
              className="rounded-xl p-5 text-center"
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '12px',
                padding: '1.25rem',
                textAlign: 'center',
                color: '#166534',
              }}
            >
              Payment received! Your order is confirmed.
            </div>
            <p className="mt-4 text-brand-foreground/80">
              Order <strong>{order.order_number}</strong>
            </p>
            <p className="mt-1 text-sm text-brand-foreground/60">
              {siteConfig.locationCity}
            </p>
            {order.order_type === 'pickup' && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-brand-muted/30 bg-white/50 p-4">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" aria-hidden />
                <div>
                  <p className="font-medium text-brand-foreground">Pickup location</p>
                  <p className="mt-1 text-sm text-brand-foreground/90">
                    {siteConfig.pickupAddress}
                  </p>
                  {order.pickup_date && (
                    <p className="mt-2 text-sm text-brand-foreground/80">
                      Your pickup: {new Date(order.pickup_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      {order.pickup_time && ` at ${order.pickup_time}`}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="mt-6 rounded-lg border border-brand-muted/30 bg-white/50 p-4">
              <h2 className="font-display text-lg font-semibold text-brand-foreground">Order summary</h2>
              <ul className="mt-3 space-y-2 text-sm text-brand-foreground/90">
                {items.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-1 border-t border-brand-muted/30 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-brand-foreground/80">Order total</dt>
                  <dd>{formatCurrency(order.total ?? order.subtotal)}</dd>
                </div>
                <div className="flex justify-between font-medium text-brand-foreground/80">
                  <dt>Payment</dt>
                  <dd>Paid in full</dd>
                </div>
              </dl>
            </div>
            <div className="mt-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand-primary hover:underline"
              >
                <Instagram size={18} aria-hidden />
                Follow us on Instagram
              </a>
            </div>
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}
