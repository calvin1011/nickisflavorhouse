import { useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useCartStore } from '@/store/cartStore'

export function OrderConfirmation() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const clearCart = useCartStore((s) => s.clearCart)

  useEffect(() => {
    if (sessionId) clearCart()
  }, [sessionId, clearCart])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-brand-foreground">
          Thank you
        </h1>
        {sessionId ? (
          <>
            <p className="mt-4 text-brand-foreground/80">
              Your deposit has been paid. We’ll send order confirmation details to your email.
            </p>
            <p className="mt-2 text-sm text-brand-foreground/60">
              Balance due at pickup (Cash App or Zelle).
            </p>
          </>
        ) : (
          <p className="mt-4 text-brand-foreground/80">
            No order session found. If you just completed payment, give us a moment and refresh.
          </p>
        )}
      </main>
      <Footer />
    </div>
  )
}
