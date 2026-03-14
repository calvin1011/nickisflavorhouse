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
const pickupAddress =
  import.meta.env.VITE_PICKUP_ADDRESS ?? '13505 Inwood Rd, Farmers Branch, TX 75244'
const locationCity =
  import.meta.env.VITE_LOCATION_CITY ?? 'Dallas, TX'

export const siteConfig = {
  brandName,
  tagline,
  paymentCopy,
  instagramUrl,
  pickupAddress,
  locationCity,
}
