import { useEffect } from 'react'

export default function InstagramFeed() {
  useEffect(() => {
    if (document.querySelector('script[src="https://w.behold.so/widget.js"]')) return

    const s = document.createElement('script')
    s.type = 'module'
    s.src = 'https://w.behold.so/widget.js'
    document.head.appendChild(s)

    return () => {
      const existing = document.querySelector('script[src="https://w.behold.so/widget.js"]')
      if (existing) existing.remove()
    }
  }, [])

  return (
    <section style={{
      padding: '3rem 1rem',
      textAlign: 'center',
      backgroundColor: 'var(--color-cream)',
    }}>
      <h2 style={{
        fontFamily: 'Playfair Display, serif',
        color: 'var(--color-primary)',
        fontSize: '2rem',
        marginBottom: '0.5rem',
      }}>
        Follow the Flavor
      </h2>
      <p style={{
        color: 'var(--color-text-muted)',
        marginBottom: '1.5rem',
        fontSize: '0.95rem',
      }}>
        @nickisflavorhouse
      </p>

      <behold-widget feed-id="5bZsbOWTaZSeac5bQuK5"></behold-widget>

      <a
        href="https://www.instagram.com/nickisflavorhouse"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: '1.5rem',
          display: 'inline-block',
          color: 'var(--color-accent)',
          fontWeight: '600',
          textDecoration: 'none',
          fontSize: '0.95rem',
        }}
      >
        View all on Instagram →
      </a>
    </section>
  )
}
