import { cn } from '@/lib/utils'

/**
 * @param {{ categories: Array<{ id: string | null; name: string }>; selectedId: string | null; onSelect: (id: string | null) => void; className?: string }} props
 */
export function CategoryFilter({ categories, selectedId, onSelect, className }) {
  return (
    <div
      className={cn(
        'sticky top-14 z-10 -mx-4 flex gap-2 overflow-x-auto border-b border-brand-muted/30 bg-brand-background/95 px-4 py-3 backdrop-blur sm:top-[4.25rem] sm:mx-0 sm:px-0',
        className
      )}
    >
      {categories.map((cat) => (
        <button
          key={cat.id ?? 'all'}
          type="button"
          onClick={() => onSelect(cat.id)}
          className={cn(
            'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
            selectedId === cat.id
              ? 'bg-brand-primary text-white'
              : 'bg-brand-muted/20 text-brand-foreground hover:bg-brand-muted/40'
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
