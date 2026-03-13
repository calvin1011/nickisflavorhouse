import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'
import { siteConfig } from '@/lib/siteConfig'

const navLinks = [
  { to: '/menu', label: 'Order Now' },
  { to: '/contact', label: 'Contact' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const openDrawer = useCartStore((s) => s.openDrawer)
  const itemCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0))

  return (
    <header className="sticky top-0 z-50 border-b border-brand-muted/30 bg-brand-background/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="font-display text-xl font-bold text-brand-primary sm:text-2xl"
        >
          {siteConfig.brandName}
        </Link>

        <div className="flex items-center gap-4">
          <ul className="hidden items-center gap-8 sm:flex">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="text-brand-foreground/90 hover:text-brand-primary transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={openDrawer}
            className="relative rounded p-2 text-brand-foreground hover:bg-brand-muted/20 transition-colors"
            aria-label={`Open cart${itemCount > 0 ? ` (${itemCount} items)` : ''}`}
          >
            <ShoppingBag size={24} />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-primary px-1.5 text-xs font-medium text-white">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          className="rounded p-2 text-brand-foreground hover:bg-brand-muted/20 sm:hidden"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200 sm:hidden',
          mobileOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <ul className="flex flex-col gap-2 border-t border-brand-muted/30 bg-brand-background px-4 py-3">
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className="block py-2 text-brand-foreground/90 hover:text-brand-primary"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
