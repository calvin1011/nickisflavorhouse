import { useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/utils/formatCurrency'
import { Instagram } from 'lucide-react'

export function OrderConfirmation() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const clearCart = useCartStore((s) => s.clearCart)
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(!!sessionId)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (sessionId) clearCart()
  }, [sessionId, clearCart])

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/api/order-by-session?session_id=${encodeURIComponent(sessionId)}`)
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
  }, [sessionId])

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
        ) : loading ? (
          <p className="mt-4 text-brand-foreground/80">Loading your order...</p>
        ) : error ? (
          <p className="mt-4 text-brand-foreground/80">{error}</p>
        ) : order ? (
          <>
            <p className="mt-4 text-brand-foreground/80">
              Order <strong>{order.order_number}</strong> is confirmed. Paid in full.
            </p>
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
                  <dd>{formatCurrency(order.subtotal)}</dd>
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
