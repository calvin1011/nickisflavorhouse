import { Link } from 'react-router-dom'
import { Instagram } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-brand-muted/30 bg-brand-foreground/5">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-display text-lg font-semibold text-brand-primary">
              Nicki's Flavor House
            </p>
            <p className="mt-1 text-sm text-brand-foreground/70">
              Pay deposit with Cash App or Zelle
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-brand-foreground/90 hover:text-brand-primary transition-colors"
            >
              <Instagram size={20} aria-hidden />
              Instagram
            </a>
            <Link
              to="/contact"
              className="text-brand-foreground/90 hover:text-brand-primary transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-brand-foreground/60">
          &copy; {new Date().getFullYear()} Nicki's Flavor House. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
