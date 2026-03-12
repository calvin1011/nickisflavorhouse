import { Link } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export function Menu() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-brand-foreground">
          Menu
        </h1>
        <p className="mt-4 text-brand-foreground/80">
          Menu coming soon. Check back for our full selection.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block text-brand-primary hover:underline"
        >
          Back to home
        </Link>
      </main>
      <Footer />
    </div>
  )
}
