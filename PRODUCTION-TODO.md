# Production TODO

Everything still blocking this storefront from taking real orders. Verified against the
React rewrite, Sept 2026.

The app renders, routes, filters, searches, and keeps a working cart. What it does
**not** do is take money, send mail, or authenticate anyone.

---

## 1. Payment — code is in, keys are not

Checkout is wired to Razorpay Standard Checkout via a serverless Orders API:

- `api/create-order.js` — creates the order. It **recomputes the total from the
  catalogue** and ignores any amount sent by the browser, so the total cannot be
  edited in devtools. Rejects unknown ids, bad quantities, and unavailable sizes.
- `api/verify-payment.js` — verifies the HMAC signature in constant time, then
  asks Razorpay for the order's real status. Only `paid` counts as paid; an
  `authorized` (uncaptured) order does not.
- `server/razorpay.js` — the only place `RAZORPAY_KEY_SECRET` is read.
- `server/rateLimit.js` — per-IP request budget for both order endpoints, so an
  anonymous caller cannot flood the merchant dashboard. **In-process only**: on
  Vercel each invocation may get a fresh instance, so this bounds casual abuse but
  is not a hard global ceiling. See section 7.
- `src/lib/orders.js` — the shipping/total maths, shared by browser and server so
  both agree on the figure. Also holds `MAX_ORDER_TOTAL` (₹50,000), which the
  server enforces before creating anything at Razorpay.
- `src/lib/shipping.js` — the delivery-address validator, imported by **both** the
  checkout form and `api/create-order.js`, so there is one definition of a valid
  address. The server re-validates; the browser check is a convenience, not the
  check that counts.

**To take real money:**

- [ ] Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the Vercel dashboard, or in
      `.env.local` (see `.env.example`). Test keys start `rzp_test_`.
- [ ] **Never** set the secret as a `VITE_`-prefixed variable — those are inlined
      into the public bundle. There is an automated check that no file under
      `src/` mentions the secret.
- [ ] The catalogue currently holds **draft prices**. Replace them with real ones
      before charging anyone; the server prices from this same file.
- [ ] **Delivery details reach Razorpay, but there is no order record.** They are
      written to the order's `notes` (13 of Razorpay's 15 allowed pairs) so the
      dashboard row, its CSV export, and the webhook payload are enough to pick,
      pack and ship by hand. That is the whole of it: nothing is stored, and there
      is no order history, refund record, or fulfilment queue. See section 6.
- [ ] Delivery notes are **PII on Razorpay's servers** — name, email, phone, full
      address. That is the intended use of `notes` and unavoidable if Razorpay is to
      have the address, but it is a real DPDP consideration. Decide what to retain
      and for how long before going live at volume.

Local development needs `vercel dev` so the functions run; plain `npm run dev`
serves no `/api` route and the checkout says so rather than failing silently.

## 6. No order storage — webhook plus Firebase (planned, not built)

**This is the largest remaining gap, and it blocks going live.** Today the only
record that a payment succeeded is the shopper's own browser telling the server so.
That fails whenever the browser does not finish the call — shopper closes the tab
after paying, loses connection, or the request never arrives. The money moved; the
server never heard about it. Razorpay is the only party that knows for certain, and
the fix is to let it tell us directly.

**Goal: a verified webhook writing every order to Firebase, so order state lives on
the server and not in a browser that can be closed.**

```
Shopper pays
     ↓
Razorpay ──→  POST /api/webhook        (independent of the browser)
                    { event: "payment.captured", payload.payment.entity }
                    X-Razorpay-Signature: <hmac of the raw body>
                          ↓
              verify HMAC with RAZORPAY_WEBHOOK_SECRET   → reject if it fails
                          ↓
              dedupe on payload.payment.entity.id         → ignore replays
                          ↓
              write/merge into Firestore, status = captured
                          ↓
              200, always, once the event is durably recorded
```

- [ ] `RAZORPAY_WEBHOOK_SECRET` set in the Vercel dashboard. This is **not** the API
      key secret — it is a separate value chosen in Razorpay under Settings →
      Webhooks. Never `VITE_`-prefixed.
- [ ] `api/webhook.js`. Two rules are non-negotiable:
      - **Verify the signature over the raw request body** with
        `RAZORPAY_WEBHOOK_SECRET`. The endpoint is public, so any process can POST to
        it; without this check anyone can send `{"event":"payment.captured"}` and mark
        unpaid orders as paid.
      - **Be idempotent.** Razorpay retries until it gets a 200 and may deliver the
        same event more than once. Key on `payload.payment.entity.id` and treat a
        repeat as a no-op, or the same parcel ships twice.
- [ ] Return 200 as soon as the event is durably written, and do the fulfilment work
      after — a non-200 makes Razorpay retry the whole event.
- [ ] Handle at minimum `payment.captured`, `payment.failed`, and `refund.processed`;
      `payment.authorized` must **not** be treated as paid (see section 1).
- [ ] Register the endpoint in Razorpay (Settings → Webhooks) as
      `https://<domain>/api/webhook`, subscribed to those events. Note that localhost
      is unreachable, so a tunnel is needed to test locally.
- [ ] **Keep the keys server-side.** The Firebase Admin SDK needs a service-account
      credential, which is equivalent to a database root password. Initialise it only
      in `server/`, never under `src/`, and never as a `VITE_` variable. The existing
      `RAZORPAY_KEY_SECRET` rule applies unchanged.
- [ ] Firestore rules: deny client reads/writes by default and reach the database only
      through the Admin SDK in the function. A storefront database of customer names,
      emails, phone numbers and addresses must not be world-readable.
- [ ] Order document: `razorpay_order_id`, `razorpay_payment_id`, `amount` (integer
      paise), `currency`, `status`, `items[]`, the delivery block from
      `src/lib/shipping.js`, `created_at`, `paid_at`. Keep money as integer paise, per
      the rule in AGENTS.md.
- [ ] Once orders are stored, `api/verify-payment.js` can read the order's status from
      Firestore instead of asking Razorpay on every checkout, and the confirmation
      screen can survive a page refresh.
- [ ] Refunds: move the document through `REFUND_REQUESTED` → `REFUNDED` off the
      `refund.processed` event rather than by editing the dashboard.

Deliberately **not** in scope yet: accounts and auth, an admin dashboard, invoicing,
subscriptions, and a customer-facing order history. Each needs the stored orders
first.

## 7. Rate limiting is per-instance, not enforced at the edge

`server/rateLimit.js` gives `/api/create-order` and `/api/verify-payment` a per-IP
budget (10/min and 30/min). It works and it is dependency-free, but the buckets
live in a module-level `Map` in a serverless runtime. Two consequences:

- A Vercel invocation may run in a **fresh, short-lived instance**, so a flood
  spreads across instances and the effective global limit is
  `10 × (number of instances)`. The bucket is not a hard ceiling.
- `x-forwarded-for` is the only client address a Web `Request` exposes, and it is
  caller-controlled. A determined attacker can send their own header and get a new
  bucket per request. The left-most entry is used, which is the correct convention,
  but it is not authenticated.

**Add the edge rule before taking real volume.** In the Vercel dashboard, or:

```
vercel firewall rules add --condition 'req.url.path == "/api/create-order"' \
  --action rate_limit --rate-limit-requests 10 --rate-limit-window 60 \
  --rate-limit-keys ip
vercel firewall publish
```

This is enforced at the edge, keyed on the connection Vercel actually sees, and
holds across every region and instance. `npx vercel firewall overview` currently
reports **Firewall: Not configured** for this project, so nothing is live yet.

Keep the in-process limiter after adding the edge rule. It costs nothing, it keeps
`vercel dev` and any future non-Vercel host limited, and it fails safe if the
firewall rule is ever unpublished by accident.

The related value ceiling is **not** subject to any of this: `MAX_ORDER_TOTAL` is
computed in `src/lib/orders.js` and enforced in `api/create-order.js` before
Razorpay is called, so it holds for every request no matter where it runs.

## 2. No backend for any form

All three forms are client-side only; they display a confirmation and discard the input.

- [ ] **Contact form** (`src/pages/Contact.jsx`) — needs an endpoint or a form service.
- [ ] **Newsletter signup** (`src/components/Footer.jsx`) — needs a mailing list provider.
- [ ] **Discount code field** on the cart page — validation must happen server-side, or
      anyone can read the discount logic and forge codes.

## 3. Catalogue data is invented

- [ ] Seven products with **draft prices** in `src/data/products.js`. Replace with the
      real catalogue.
- [ ] `public/img/product/product-5.jpg` is **unused**; its intended product is unknown.
- [ ] "Fall - Winter Collections 2030" and the other collection headlines are
      placeholder copy.
- [ ] `DEAL_ENDS` in `src/pages/Home.jsx` is a hardcoded `2026/12/31`. Set the real promo
      date, or delete the countdown. The widget renders an "ended" state when it lapses.
- [ ] `public/img/` is demo photography, not real products. That includes
      `logo.png`, `footer-logo.png`, and `payment.png` (the vendor's own payment badges).
- [ ] Contact details and the Instagram URL (`https://instagram.com`) are placeholders.

## 4. SEO and deployment

- [ ] No `robots.txt` or sitemap.
- [ ] No Open Graph / Twitter card tags, so link previews will be blank.
- [ ] **This is a SPA with real URLs** (`/shop`, `/cart`, …). The production host must
      rewrite unknown paths to `index.html`, or every deep link and refresh 404s. Vite's
      dev server does this automatically; most static hosts need a rule.
- [ ] `vercel.json` carries the SPA rewrite that keeps deep links working. Confirm it
      survives the first real deploy.
- [ ] No CI or deploy config, and **no committed test suite** — the Playwright passes
      used during this work ran from a scratch directory and were not kept.

## 5. Minor

- [ ] Product colour selection on the detail page is display-only; colour is not stored
      on the cart line, so two colour variants of one product merge into a single line
      (`sameLine` in `src/context/CartProvider.jsx` compares `id` and `size` only).
- [ ] `index.html` has a single generic `<title>` and `<meta description>`; the original
      per-page SEO titles are gone, so add a per-route title via a small hook.

---

## Resolved during the React rewrite

- ~~Static HTML build with no cart, no search, no routing~~ → React Router, reducer-based
  cart persisted to `localStorage`, real search, filter, and sort.
- ~~`html lang="zxx"`~~ → `lang="en"`.
- ~~Missing title, description, and favicon~~ → all present in `index.html`.
- ~~363 dead `href="#"` links~~ → no `href="#"` remains in `src/`.
- ~~Icon-only links with no accessible text~~ → `lucide-react` icons are `aria-hidden`
  beside real text.
- ~~Closed drawer and search modal focusable while invisible~~ → both carry `inert`
  until opened.
- ~~Footer printed "Copyright © 20262026"~~ → year is rendered from `new Date()`.
- ~~Quantity stepper wrote `NaN`~~ → clamped to a non-negative integer.
- ~~Unna declared but never used~~ → dropped; the site is Nunito Sans throughout.
- ~~Checkout button did nothing when submitted~~ → real Razorpay Standard Checkout with
  a server-side order, signature verification, and a captured-only success state.
- ~~Tailwind's `container` utility overrode the 1170/1140/960/540 ladder~~
  → the ladder is defined unlayered in `src/index.css`.
- ~~Vendor CVEs from jQuery 3.3.1 / Bootstrap 4.2.1~~ → dependency removed entirely.
- ~~`Source/`, the vendor splash page, and 3.2 MB of vendor zips~~ → deleted.
- ~~Interiors-company copy on the contact page~~ → rewritten for a clothing store.
