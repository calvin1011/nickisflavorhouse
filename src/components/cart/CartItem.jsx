import { formatCurrency } from '@/utils/formatCurrency'
import { useCartStore } from '@/store/cartStore'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * @param {{
 *   id: string
 *   name: string
 *   price: number
 *   quantity: number
 *   image_url?: string | null
 *   className?: string
 * }} props
 */
export function CartItem({ id, name, price, quantity, image_url, className }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  const lineTotal = price * quantity

  const handleDecrease = () => {
    if (quantity <= 1) removeItem(id)
    else updateQuantity(id, quantity - 1)
  }

  return (
    <div
      className={cn(
        'flex gap-3 border-b border-brand-muted/20 py-3 last:border-0',
        className
      )}
    >
      {image_url && (
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-brand-muted/20">
          <img
            src={image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-brand-foreground truncate">{name}</p>
        <p className="text-sm text-brand-foreground/70">
          {formatCurrency(price)} each
        </p>
        <div className="mt-1 flex items-center gap-2">
          <div className="flex items-center rounded border border-brand-muted/30">
            <button
              type="button"
              onClick={handleDecrease}
              className="flex h-8 w-8 items-center justify-center text-brand-foreground hover:bg-brand-muted/20 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-[2rem] text-center text-sm" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(id, quantity + 1)}
              className="flex h-8 w-8 items-center justify-center text-brand-foreground hover:bg-brand-muted/20 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>
          <span className="text-sm font-medium text-brand-foreground">
            {formatCurrency(lineTotal)}
          </span>
        </div>
      </div>
    </div>
  )
}
