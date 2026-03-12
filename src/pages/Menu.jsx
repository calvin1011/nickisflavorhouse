import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useMenu } from '@/hooks/useMenu'
import { CategoryFilter } from '@/components/menu/CategoryFilter'
import { MenuGrid } from '@/components/menu/MenuGrid'
import { MenuItemModal } from '@/components/menu/MenuItemModal'
import { useCartStore } from '@/store/cartStore'
import { ShoppingBag } from 'lucide-react'

export function Menu() {
  const { categories, getItemsForCategory, loading, error } = useMenu()
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [modalItem, setModalItem] = useState(null)
  const openDrawer = useCartStore((s) => s.openDrawer)
  const itemCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0))

  const displayItems = getItemsForCategory(selectedCategoryId)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-brand-foreground">
          Menu
        </h1>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p>Unable to load menu. Please check your connection and try again.</p>
            <p className="mt-1 text-sm text-red-600">{error.message}</p>
          </div>
        )}

        {!error && (
          <>
            <CategoryFilter
              categories={categories}
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
              className="mt-6"
            />

            <div className="mt-6">
              {loading ? (
                <p className="py-12 text-center text-brand-foreground/70">
                  Loading menu…
                </p>
              ) : (
                <MenuGrid
                  items={displayItems}
                  onItemDetails={(item) => setModalItem(item)}
                />
              )}
            </div>
          </>
        )}

        <Link
          to="/"
          className="mt-8 inline-block text-brand-primary hover:underline"
        >
          Back to home
        </Link>
      </main>

      {!error && !loading && (
        <div className="sticky bottom-0 z-30 border-t border-brand-muted/30 bg-brand-background/95 px-4 py-3 backdrop-blur sm:hidden">
          <button
            type="button"
            onClick={openDrawer}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-primary py-3 font-medium text-white hover:bg-brand-primary-dark transition-colors"
          >
            <ShoppingBag size={20} />
            View Cart
            {itemCount > 0 && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-sm">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      )}

      <MenuItemModal
        item={modalItem}
        open={!!modalItem}
        onClose={() => setModalItem(null)}
      />
      <Footer />
    </div>
  )
}
