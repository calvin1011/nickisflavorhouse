import { Link } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { useFeaturedMenu } from '@/hooks/useFeaturedMenu'
import { MenuGrid } from '@/components/menu/MenuGrid'
import { InstagramFeed } from '@/components/instagram/InstagramFeed'
import { siteConfig } from '@/lib/siteConfig'

export function Home() {
  const { announcements, loading } = useAnnouncements()
  const { items: featuredItems, loading: featuredLoading } = useFeaturedMenu()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
          <h1 className="font-display text-4xl font-bold text-brand-primary sm:text-5xl md:text-6xl">
            {siteConfig.brandName}
          </h1>
          <p className="mt-4 max-w-lg text-lg text-brand-foreground/80">
            {siteConfig.tagline}
          </p>
          <Link
            to="/menu"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-brand-primary px-6 py-3 font-medium text-white hover:bg-brand-primary-dark transition-colors"
          >
            Order Now
          </Link>
        </section>

        {announcements.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="font-display text-2xl font-semibold text-brand-foreground mb-6">
              Announcements
            </h2>
            <div className="space-y-6">
              {announcements.map((a) => (
                <article
                  key={a.id}
                  className="overflow-hidden rounded-lg border border-brand-muted/30 bg-white shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row">
                    {a.image_url && (
                      <div className="sm:w-1/3 shrink-0">
                        <img
                          src={a.image_url}
                          alt=""
                          className="h-48 w-full object-cover sm:h-auto sm:min-h-[180px]"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-6">
                      <h3 className="font-display text-xl font-semibold text-brand-foreground">
                        {a.title}
                      </h3>
                      {a.body && (
                        <p className="mt-2 text-brand-foreground/80 whitespace-pre-wrap">
                          {a.body}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {!loading && announcements.length === 0 && (
          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="font-display text-2xl font-semibold text-brand-foreground">
              Announcements
            </h2>
            <p className="mt-2 text-brand-foreground/70">
              No announcements right now. Check back soon.
            </p>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="font-display text-2xl font-semibold text-brand-foreground">
            Featured
          </h2>
          {featuredLoading && (
            <p className="mt-2 text-brand-foreground/70">Loading…</p>
          )}
          {!featuredLoading && featuredItems.length > 0 && (
            <>
              <p className="mt-2 text-brand-foreground/70">
                Some of our favorites. Order from the full menu.
              </p>
              <div className="mt-6">
                <MenuGrid items={featuredItems} />
              </div>
              <Link
                to="/menu"
                className="mt-6 inline-block text-brand-primary hover:underline"
              >
                View full menu
              </Link>
            </>
          )}
          {!featuredLoading && featuredItems.length === 0 && (
            <p className="mt-2 text-brand-foreground/70">
              No featured items yet. Check out the full menu.
            </p>
          )}
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="font-display text-2xl font-semibold text-brand-foreground">
            Instagram
          </h2>
          <p className="mt-2 text-brand-foreground/70">
            Follow us for updates and more.
          </p>
          <div className="mt-6">
            <InstagramFeed />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
