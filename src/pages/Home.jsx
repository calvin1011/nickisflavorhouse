import { Link } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
          <h1 className="font-display text-4xl font-bold text-brand-primary sm:text-5xl md:text-6xl">
            Nicki's Flavor House
          </h1>
          <p className="mt-4 max-w-lg text-lg text-brand-foreground/80">
            Homemade flavor, made with love. Order ahead for pickup.
          </p>
          <Link
            to="/menu"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-brand-primary px-6 py-3 font-medium text-white hover:bg-brand-primary-dark transition-colors"
          >
            Order Now
          </Link>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="font-display text-2xl font-semibold text-brand-foreground">
            Announcements
          </h2>
          <p className="mt-2 text-brand-foreground/70">Coming soon.</p>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="font-display text-2xl font-semibold text-brand-foreground">
            Featured
          </h2>
          <p className="mt-2 text-brand-foreground/70">Coming soon.</p>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="font-display text-2xl font-semibold text-brand-foreground">
            Instagram
          </h2>
          <p className="mt-2 text-brand-foreground/70">Coming soon.</p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
