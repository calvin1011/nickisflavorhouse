# Nicki's Flavor House — Next Phases

Small phase doc for: full payment upfront, delete uploaded image, admin cashout.

---

## Phase 14: Full payment upfront (no deposit)

**Goal:** Customers pay the full order total at checkout. No deposit or balance-due flow.

- [x] **API `create-checkout.js`**
  - Charge full `subtotal` (not 50% deposit). Single line item: "Order total — Nicki's Flavor House" with `unit_amount = subtotal * 100`.
  - Optionally keep `deposit_amount` / `balance_due` in DB for history, or set `deposit_amount = subtotal`, `balance_due = 0`.
- [x] **Stripe webhook**
  - On `checkout.session.completed`, set `deposit_paid_at` and treat as fully paid (e.g. `payment_status = 'paid'`). No balance due messaging.
- [x] **Checkout UI**
  - Replace deposit copy with "Pay full amount" / "Pay [total]". Remove or repurpose `DepositSummary` (show order total only).
- [x] **Order confirmation**
  - Remove "balance due at pickup" and Cash App/Zelle for balance; keep only "Thank you" and order summary (or note "Paid in full").
- [x] **Admin**
  - Orders: show "Paid in full" (or single total) instead of deposit + balance. Remove balance-due emphasis.
- [x] **Utils / copy**
  - Update `depositCalc` usage (or retire) and any "deposit" / "balance due" strings site-wide.

**Deliverable:** Checkout charges full order total; no deposit or balance-due flow in UI or copy.

---

## Phase 15: Delete uploaded image

**Goal:** Admin can remove an image that was uploaded by mistake (menu items and announcements).

- [ ] **Menu item (admin)**
  - In `MenuItemForm`: when editing an item that has `image_url`, show current image and a "Remove image" (or "Delete image") control. On confirm: set `image_url` to `null` in DB; optionally delete the object from Supabase Storage `menu-images/` using the path derived from the current URL to avoid orphaned files.
- [ ] **Announcement (admin)**
  - In `AnnouncementForm`: same pattern—show current image, "Remove image" control, clear `image_url` in DB and optionally remove file from Storage bucket `announcement-images/`.
- [ ] **Storage**
  - If you delete from Storage: derive object path from stored `image_url` (e.g. path after bucket name) and call `supabase.storage.from(bucket).remove([path])`. Handle 404 if already deleted.

**Deliverable:** Admin can remove/replace an image for a menu item or announcement; DB and optionally Storage stay in sync.

---

## Phase 16: Admin cashout (withdraw funds)

**Goal:** From the admin account, view and cash out funds received from customers (Stripe balance → bank).

- [ ] **Stripe**
  - Payouts are usually automatic (Stripe sends to your connected bank on a schedule). Option A: add an admin link that opens Stripe Dashboard → Payouts so you can see balance and payout history. Option B: use Stripe API (with secret key) to show balance and recent payouts in-app.
- [ ] **Admin UI**
  - New section or page under admin (e.g. "Payouts" or "Cashout" in sidebar). Content either:
    - **Link-only:** "View payouts and withdraw funds" → `https://dashboard.stripe.com/payouts` (open in new tab), or
    - **In-app:** Call Stripe API (Balance, Payouts list), show available balance and next payout date; link "Manage in Stripe Dashboard" for actual bank settings and withdrawals.
- [ ] **Security**
  - Page restricted to admin-only (same auth as rest of `/admin/*`). No API keys in client; any balance/payout data must be fetched via your backend (e.g. Vercel serverless) using `STRIPE_SECRET_KEY`.

**Deliverable:** Admin can open payouts/cashout (Dashboard link or in-app balance + link); funds can be withdrawn via Stripe as usual.

---

## Quick reference

| Phase | Focus |
|-------|--------|
| 14 | Full payment upfront (no deposit) |
| 15 | Delete uploaded image (menu + announcements) |
| 16 | Admin cashout (view/withdraw funds) |
