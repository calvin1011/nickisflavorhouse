/**
 * Fetches latest Instagram media for the business account.
 * Uses Instagram Graph API; requires INSTAGRAM_USER_ID and INSTAGRAM_ACCESS_TOKEN in env.
 */
const FIELDS = 'id,media_url,permalink,thumbnail_url,timestamp,caption'
const LIMIT = 6
const API_VERSION = 'v21.0'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = process.env.INSTAGRAM_USER_ID
  const token = process.env.INSTAGRAM_ACCESS_TOKEN

  const profileUrl = process.env.INSTAGRAM_PROFILE_URL ?? 'https://instagram.com'

  if (!userId || !token) {
    return res.status(503).json({
      error: 'Instagram feed not configured',
      media: [],
      profileUrl,
    })
  }

  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${userId}/media?fields=${FIELDS}&limit=${LIMIT}&access_token=${encodeURIComponent(token)}`
    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      const message = data?.error?.message ?? `Instagram API error ${response.status}`
      return res.status(response.status >= 500 ? 502 : 400).json({
        error: message,
        media: [],
        profileUrl: process.env.INSTAGRAM_PROFILE_URL ?? 'https://instagram.com',
      })
    }

    const media = (data.data ?? []).map((m) => ({
      id: m.id,
      media_url: m.media_url,
      permalink: m.permalink,
      thumbnail_url: m.thumbnail_url,
      timestamp: m.timestamp,
      caption: m.caption ?? '',
    }))

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return res.status(200).json({
      media,
      profileUrl,
    })
  } catch (err) {
    console.error('Instagram feed error:', err)
    return res.status(502).json({
      error: 'Failed to load Instagram feed',
      media: [],
      profileUrl: process.env.INSTAGRAM_PROFILE_URL ?? 'https://instagram.com',
    })
  }
}
