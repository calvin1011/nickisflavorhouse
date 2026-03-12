import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export function Checkout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-brand-foreground">
          Checkout
        </h1>
        <p className="mt-4 text-brand-foreground/80">Checkout placeholder.</p>
      </main>
      <Footer />
    </div>
  )
}
