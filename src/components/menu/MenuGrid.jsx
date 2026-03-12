import { MenuCard } from './MenuCard'

/**
 * @param {{
 *   items: Array<{ id: string; name: string; description?: string | null; price: number; image_url?: string | null; is_catering?: boolean }>
 *   onItemDetails?: (item: { id: string; name: string; description?: string | null; price: number; image_url?: string | null; is_catering?: boolean }) => void
 * }} props
 */
export function MenuGrid({ items, onItemDetails }) {
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-brand-foreground/70">
        No items in this category.
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id}>
          <MenuCard
            {...item}
            onDetailsClick={
              onItemDetails ? () => onItemDetails(item) : undefined
            }
          />
        </li>
      ))}
    </ul>
  )
}
