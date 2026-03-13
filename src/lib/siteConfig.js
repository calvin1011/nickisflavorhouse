/**
 * Centralized site copy and links. Prefer env vars for deployment-specific values.
 */

const brandName = import.meta.env.VITE_SITE_NAME ?? "Nicki's Flavor House"
const tagline =
  import.meta.env.VITE_SITE_TAGLINE ?? 'Homemade flavor, made with love. Order ahead for pickup.'
const paymentCopy =
  import.meta.env.VITE_PAYMENT_COPY ?? 'Pay deposit with Cash App or Zelle'
const instagramUrl =
  import.meta.env.VITE_INSTAGRAM_URL ?? 'https://instagram.com'

export const siteConfig = {
  brandName,
  tagline,
  paymentCopy,
  instagramUrl,
}
