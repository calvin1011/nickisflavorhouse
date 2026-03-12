import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export function Contact() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-brand-foreground">
          Contact
        </h1>
        <p className="mt-4 text-brand-foreground/80">
          Have a question or want to place a custom order? Get in touch.
        </p>

        <div className="mt-8 rounded-lg border border-brand-muted/30 bg-white/50 p-6">
          <p className="text-sm text-brand-foreground/70">Contact form placeholder.</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
