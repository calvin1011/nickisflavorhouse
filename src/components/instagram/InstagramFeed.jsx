import { useState, useEffect } from 'react'
import { Instagram } from 'lucide-react'
import { siteConfig } from '@/lib/siteConfig'

export function InstagramFeed() {
  const [media, setMedia] = useState([])
  const [profileUrl, setProfileUrl] = useState(siteConfig.instagramUrl)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function fetchFeed() {
      try {
        const base = import.meta.env.VITE_APP_URL ?? ''
        const res = await fetch(`${base}/api/instagram-feed`)
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setError(data?.error ?? 'Failed to load')
          setMedia([])
          if (data.profileUrl) setProfileUrl(data.profileUrl)
          return
        }
        setMedia(data.media ?? [])
        if (data.profileUrl) setProfileUrl(data.profileUrl)
      } catch (err) {
        if (!cancelled) {
          setError(err?.message ?? 'Failed to load')
          setMedia([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchFeed()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-lg bg-brand-muted/20"
            aria-hidden
          />
        ))}
      </div>
    )
  }

  if (error || media.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-brand-muted/30 bg-white/50 py-8">
        <Instagram className="h-10 w-10 text-brand-muted/50" aria-hidden />
        <p className="text-sm text-brand-foreground/70">
          {error ?? 'No posts to show.'}
        </p>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-brand-primary hover:underline"
        >
          <Instagram size={18} />
          View on Instagram
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {media.slice(0, 6).map((post) => (
          <a
            key={post.id}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="group block aspect-square overflow-hidden rounded-lg border border-brand-muted/30 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <img
              src={post.thumbnail_url || post.media_url}
              alt={post.caption?.slice(0, 100) ?? 'Instagram post'}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </a>
        ))}
      </div>
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-brand-primary hover:underline"
      >
        <Instagram size={18} />
        Follow on Instagram
      </a>
    </div>
  )
}
