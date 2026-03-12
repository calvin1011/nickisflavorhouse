/**
 * Stripe publishable key for client-side use (e.g. redirect to Checkout, future Elements).
 * Secret key and API calls are server-side only (api/create-checkout.js, api/stripe-webhook.js).
 */
export const stripePublishableKey =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
    : ''
