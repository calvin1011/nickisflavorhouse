# Nicki's Flavor House — Build Phases

Feature-by-feature build plan. Complete each phase before moving to the next. Supabase (schema, RLS, storage) is already done.

---

## Phase 0: Project bootstrap (if not done)

- [x] React 18 + Vite project init
- [x] Tailwind CSS + shadcn/ui setup
- [x] React Router v6, Zustand, React Hook Form, Zod
- [x] Brand CSS variables in `index.css` (Section 3 of design doc)
- [x] Google Fonts: Playfair Display + Inter via `index.html` `<link>`
- [x] Copy `.env.example` → `.env.local`, fill Supabase vars only for now
- [x] `src/lib/supabase.js` client
- [x] `vercel.json` (rewrites + API headers)

**Deliverable:** App runs locally, Supabase client connects, base layout/styles ready.

---

## Phase 1: Layout + static shell

- [x] `src/components/layout/Navbar.jsx` — logo, Order Now, Contact, mobile menu
- [x] `src/components/layout/Footer.jsx` — Cash App/Zelle, Instagram, contact
- [x] `src/App.jsx` — routes: `/`, `/menu`, `/checkout`, `/order-confirmation`, `/contact`, `/admin/*`
- [x] `src/pages/Home.jsx` — hero (logo, tagline, Order Now CTA), placeholder for announcements + featured + Instagram
- [x] `src/pages/Contact.jsx` — static content + placeholder form
- [x] `src/pages/Menu.jsx` — placeholder “Menu coming soon”
- [x] `src/pages/Checkout.jsx` — placeholder
- [x] `src/pages/OrderConfirmation.jsx` — placeholder

**Deliverable:** All customer routes render; navigation and footer work; no data yet.

---

## Phase 2: Menu (read-only) + cart state

- [x] `src/hooks/useMenu.js` — fetch categories + available menu items from Supabase
- [x] `src/store/cartStore.js` — Zustand store (items, add, remove, update qty, clear)
- [x] `src/components/menu/CategoryFilter.jsx` — category tabs (sticky on mobile)
- [x] `src/components/menu/MenuGrid.jsx` + `MenuCard.jsx` — photo, name, price, Add to Cart; catering badge when `is_catering`
- [x] `src/components/menu/MenuItemModal.jsx` — optional detail modal
- [x] `src/components/cart/CartDrawer.jsx` — slide from right; full-screen on mobile, 400px on desktop
- [x] `src/components/cart/CartItem.jsx` + `CartSummary.jsx` — line items, subtotal, deposit preview, “Proceed to Checkout”
- [x] `src/utils/depositCalc.js` — `calculateDeposit`, `calculateBalanceDue`
- [x] `src/utils/formatCurrency.js`
- [x] Wire Menu page: category filter → grid → cart drawer; sticky “View Cart” bar on mobile

**Deliverable:** Menu loads from Supabase; users can add/remove items and see cart + deposit preview.

---

## Phase 3: Checkout flow (no payment yet)

- [x] `src/utils/validators.js` — Zod schemas: `checkoutSchema`, `cateringSchema`
- [x] `src/lib/sanitize.js` — DOMPurify: `sanitizeString`, `sanitizeOrder`
- [x] `src/components/checkout/CheckoutForm.jsx` — steps: Cart review → Customer info (name, email, phone, order type, pickup date/time, notes)
- [x] `src/components/checkout/CateringForm.jsx` — event date/time/location, guest count, catering notes; show only if cart has catering or type is catering
- [x] `src/components/checkout/DepositSummary.jsx` — subtotal, deposit, balance due
- [x] Checkout page: multi-step form with validation; on submit for now just log payload (no API call)

**Deliverable:** Full checkout form with validation and sanitization; deposit summary correct; no Stripe yet.

---

## Phase 4: Stripe Checkout + order creation

- [ ] `src/lib/stripe.js` — Stripe client (publishable key) for redirect
- [ ] `api/create-checkout.js` (Vercel serverless): validate + sanitize order, compute deposit server-side, create Stripe Checkout Session, return session URL
  - Use `VITE_APP_URL` or equivalent for success/cancel URLs (set in Vercel env as needed)
- [ ] `src/components/checkout/PaymentButton.jsx` — POST to `/api/create-checkout` with order payload, redirect to Stripe
- [ ] Wire Checkout page: on “Pay Deposit” → call API → redirect to Stripe
- [ ] **Webhook:** `api/stripe-webhook.js` — verify signature, on `checkout.session.completed` insert into `orders` (generate `order_number`), insert `order_items` from metadata or from a separate “pending order” flow if you store it server-side
  - **Note:** Checkout Session metadata has limited size; if cart is large, consider creating a “pending order” in Supabase before redirect and passing `order_id` in metadata, then webhook fills payment info and order_items from DB. Otherwise encode minimal order summary in metadata and keep items in metadata or a single JSON field.
- [ ] After payment: redirect to `/order-confirmation?session_id=...`; confirmation page can show “Thank you” + order number (from URL or by fetching session)

**Deliverable:** Customer can pay deposit via Stripe; webhook creates order in Supabase; confirmation page shows success.

---

## Phase 5: Notifications

- [ ] `api/notify.js` — `sendEmailNotification(order)` (Resend), `sendPushNotification(order)` (ntfy.sh), `dispatchNotification(order)` (Promise.allSettled)
- [ ] Call `dispatchNotification(order)` from Stripe webhook after order insert
- [ ] Add Resend, NTFY_TOPIC, NICKI_EMAIL to `.env.example` (already there) and document in README or PHASES

**Deliverable:** Each new order triggers email to Nicki + push via ntfy.

---

## Phase 6: Order confirmation + contact form

- [ ] Order Confirmation page: read `session_id`; fetch order by `stripe_session_id` (or from session) and show order number, items, deposit paid, balance due; Cash App/Zelle reminder; Instagram CTA
- [ ] Contact page: form (name, email, message) → send via Resend to NICKI_EMAIL (new serverless `api/send-contact.js` or extend `notify.js`)

**Deliverable:** Confirmation shows real order details; contact form sends email to Nicki.

---

## Phase 7: Admin auth + layout

- [ ] `src/store/authStore.js` — Zustand + Supabase auth state (session, user)
- [ ] `src/hooks/useAuth.js` — sign in, sign out, session persistence
- [ ] `src/pages/admin/AdminLogin.jsx` — email/password; no sign-up; redirect to `/admin/dashboard` on success
- [ ] `src/components/layout/AdminLayout.jsx` — sidebar/nav for dashboard, menu, orders, announcements, reports
- [ ] `<AdminRoute>` wrapper: if not authenticated, redirect to `/admin/login`; use for all `/admin/*` routes
- [ ] Create Nicki’s account once in Supabase Auth (manual)

**Deliverable:** Admin can log in; all `/admin/*` routes protected; admin layout wraps dashboard pages.

---

## Phase 8: Admin — Menu manager

- [ ] `src/pages/admin/AdminMenu.jsx` — list all menu items (with category), inline available/unavailable toggle
- [ ] `src/components/admin/MenuItemForm.jsx` — create/edit: name, description, category, price, image upload (Supabase Storage `menu-images/`), catering toggle, min/max price, sort order
- [ ] Upload to Storage with RLS (authenticated only); set `image_url` on `menu_items`
- [ ] Add / Edit / Delete menu items; validate image type (webp/jpg/png) and size (<5MB)

**Deliverable:** Nicki can CRUD menu items and upload photos.

---

## Phase 9: Admin — Orders

- [ ] `src/hooks/useOrders.js` — fetch orders (and optionally subscribe to Supabase Realtime)
- [ ] `src/pages/admin/AdminOrders.jsx` — full order table; filters: All, Pending, Confirmed, Preparing, Ready, Completed, Cancelled
- [ ] `src/components/admin/OrderTable.jsx` + `OrderStatusBadge.jsx`
- [ ] Order detail drawer: customer info, items, deposit, balance due; status dropdown to update; notes
- [ ] Update order status (and optionally `updated_at`) in Supabase; realtime refresh if subscribed

**Deliverable:** Nicki can view and update order status from the dashboard.

---

## Phase 10: Admin — Announcements

- [ ] `src/pages/admin/AdminAnnouncements.jsx` — list announcements; create/edit/delete; active/inactive toggle
- [ ] `src/components/admin/AnnouncementForm.jsx` — title, body, image upload (`announcement-images/`), is_active
- [ ] Home page: fetch active announcements and render banner(s)

**Deliverable:** Nicki can manage announcements; homepage shows active ones.

---

## Phase 11: Admin — Dashboard + Reports

- [ ] `src/pages/admin/AdminDashboard.jsx` — stats: today’s orders, pending count, total revenue (deposits), “new” if desired; recent orders table (last 10); quick links to Add Menu Item, All Orders
- [ ] `src/pages/admin/AdminReports.jsx` — date range; total revenue (deposits); orders by type; popular items; simple charts (e.g. Recharts)
- [ ] `src/components/admin/RevenueChart.jsx` — bar/line for revenue over time

**Deliverable:** Dashboard gives at-a-glance metrics; Reports give revenue and breakdowns.

---

## Phase 12: Home page polish + Instagram

- [ ] Featured menu items: admin-curated (e.g. flag on `menu_items` or a “featured” table); show top 6 on home
- [ ] `src/components/instagram/InstagramFeed.jsx` — fetch from Instagram Basic Display API (token from env or `admin_profile`); show latest 6; link to profile
- [ ] Finalize hero, footer copy, and Cash App/Zelle in one place (e.g. config or env)

**Deliverable:** Home has hero, announcements, featured menu, Instagram feed, and footer.

---

## Phase 13: Security + deployment checklist

- [ ] Env: all vars in `.env.example`; no secrets in repo
- [ ] Stripe webhook signature verification in `api/stripe-webhook.js`
- [ ] Service role key only in Vercel env (server); anon key for client
- [ ] Sanitize all inputs before DB (checkout, contact, admin forms)
- [ ] Zod validation client-side; server-side validation in `create-checkout` and contact API
- [ ] Rate limiting on `/api/create-checkout` (e.g. Vercel or Upstash)
- [ ] CORS/headers per design doc on API routes
- [ ] Vercel: env set, domain `nickisflavorhouse.com`, rewrites and headers
- [ ] Stripe webhook URL: `https://nickisflavorhouse.com/api/stripe-webhook`
- [ ] E2E test: place order → pay deposit → Nicki gets email + push → admin updates status
- [ ] Mobile pass: iOS Safari, Android Chrome

**Deliverable:** Production-ready and documented.

---

## Quick reference: phase → deliverable

| Phase | Focus |
|-------|--------|
| 0 | Bootstrap (Vite, Tailwind, Supabase client, env) |
| 1 | Layout + static customer pages |
| 2 | Menu from DB + cart (Zustand) + cart drawer |
| 3 | Checkout form + validation (no payment) |
| 4 | Stripe Checkout + webhook → orders |
| 5 | Email + ntfy notifications |
| 6 | Order confirmation page + contact form email |
| 7 | Admin login + protected routes + layout |
| 8 | Admin menu CRUD + image upload |
| 9 | Admin orders list + detail + status update |
| 10 | Admin announcements + homepage banner |
| 11 | Admin dashboard stats + reports |
| 12 | Home featured + Instagram feed |
| 13 | Security hardening + deployment |

Build feature-by-feature in this order; adjust only if you need to demo payments or admin before full menu (e.g. Phase 4 before Phase 12).
