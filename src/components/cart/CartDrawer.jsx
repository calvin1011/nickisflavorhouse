import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useCartStore, getCartSubtotal } from '@/store/cartStore'
import { CartItem } from './CartItem'
import { CartSummary } from './CartSummary'
import { cn } from '@/lib/utils'

/**
 * @param {{ open: boolean; onClose: () => void }} props
 */
export function CartDrawer({ open, onClose }) {
  const items = useCartStore((s) => s.items)
  const subtotalCents = useCartStore(getCartSubtotal)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed top-0 right-0 z-50 flex h-full w-full max-w-full flex-col bg-white shadow-xl transition-transform duration-300 ease-out',
          'sm:h-full sm:w-[400px] sm:max-w-[400px]',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-brand-muted/30 px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-brand-foreground">
            Your Cart
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-brand-foreground/80 hover:bg-brand-muted/20 hover:text-brand-foreground transition-colors"
            aria-label="Close cart"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-brand-foreground/70">
              <p>Your cart is empty.</p>
              <button
                type="button"
                onClick={onClose}
                className="text-brand-primary hover:underline"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {items.map((item) => (
                  <CartItem key={item.id} {...item} />
                ))}
              </div>
              <CartSummary subtotalCents={subtotalCents} onClose={onClose} />
            </>
          )}
        </div>
      </aside>
    </>
  )
}
