import { formatCurrency } from '@/utils/formatCurrency'
import { useCartStore } from '@/store/cartStore'
import { cn } from '@/lib/utils'

/**
 * @param {{
 *   id: string
 *   name: string
 *   description?: string | null
 *   price: number
 *   image_url?: string | null
 *   is_catering?: boolean
 *   onDetailsClick?: () => void
 *   className?: string
 * }} props
 */
export function MenuCard({
  id,
  name,
  description,
  price,
  image_url,
  is_catering,
  onDetailsClick,
  className,
}) {
  const addItem = useCartStore((s) => s.addItem)

  const handleAdd = (e) => {
    e.preventDefault()
    addItem({ id, name, price, image_url, is_catering }, 1)
  }

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-brand-muted/30 bg-white shadow-sm transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="relative aspect-[4/3] bg-brand-muted/20">
        {image_url ? (
          <img
            src={image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-muted/50">
            No image
          </div>
        )}
        {is_catering && (
          <span className="absolute right-2 top-2 rounded bg-brand-primary px-2 py-0.5 text-xs font-medium text-white">
            Catering
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-brand-foreground">
            {name}
          </h3>
          <span className="shrink-0 text-brand-primary">
            {formatCurrency(price)}
          </span>
        </div>
        {description && (
          <p className="mt-1 line-clamp-2 text-sm text-brand-foreground/80">
            {description}
          </p>
        )}
        <div className="mt-auto flex gap-2 pt-3">
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 rounded-md bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:bg-brand-primary-dark transition-colors"
          >
            Add to Cart
          </button>
          {onDetailsClick && (
            <button
              type="button"
              onClick={onDetailsClick}
              className="rounded-md border border-brand-muted/40 px-3 py-2 text-sm text-brand-foreground hover:bg-brand-muted/20 transition-colors"
            >
              Details
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
