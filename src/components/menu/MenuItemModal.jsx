import { useEffect } from 'react'
import { X } from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'
import { useCartStore } from '@/store/cartStore'
import { cn } from '@/lib/utils'

/**
 * @param {{
 *   item: { id: string; name: string; description?: string | null; price: number; image_url?: string | null; is_catering?: boolean } | null
 *   open: boolean
 *   onClose: () => void
 * }} props
 */
export function MenuItemModal({ item, open, onClose }) {
  const addItem = useCartStore((s) => s.addItem)

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

  if (!item) return null

  const handleAdd = (qty = 1) => {
    addItem(item, qty)
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative max-h-[90vh] w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl',
          'flex flex-col'
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 z-10 rounded-full p-2 text-brand-foreground/80 hover:bg-brand-muted/20 hover:text-brand-foreground"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="relative aspect-[4/3] bg-brand-muted/20">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-brand-muted/50">
              No image
            </div>
          )}
          {item.is_catering && (
            <span className="absolute right-2 top-2 rounded bg-brand-primary px-2 py-0.5 text-xs font-medium text-white">
              Catering
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          <h2 id="modal-title" className="font-display text-xl font-semibold text-brand-foreground">
            {item.name}
          </h2>
          <p className="mt-2 text-brand-primary font-medium">
            {formatCurrency(item.price)}
          </p>
          {item.description && (
            <p className="mt-2 text-sm text-brand-foreground/80">
              {item.description}
            </p>
          )}
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={() => handleAdd(1)}
              className="flex-1 rounded-md bg-brand-primary px-4 py-2 font-medium text-white hover:bg-brand-primary-dark transition-colors"
            >
              Add to Cart
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-brand-muted/40 px-4 py-2 text-brand-foreground hover:bg-brand-muted/20 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
