# Male Fashion

A men's fashion storefront — jackets, t-shirts, footwear, bags and accessories — in INR.

Rebuilt Sept 2026 as a React + Vite single-page app. The visual design, spacing and
typography were carried over 1:1 from the previous build; only the technology changed.

## Stack

| Concern | Choice |
|---|---|
| Framework | React 19 |
| Build | Vite 8 (`@vitejs/plugin-react`) |
| Routing | `react-router-dom` 7 |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` |
| Icons | `lucide-react` |
| Lint | `oxlint` |
| Payment | Razorpay Standard Checkout + Vercel serverless Orders API |
| Fonts | Nunito Sans (Google Fonts) |

There is no Sass, Bootstrap, jQuery, or icon-font dependency. The old `sass/`, `css/`,
`js/`, `fonts/`, and the nine standalone HTML pages were removed.

## Commands

```bash
npm install     # install deps
npm run dev     # dev server
npm run build   # production build to dist/
npm run lint    # oxlint
npm run preview # serve the built dist/
vercel dev      # dev server that ALSO runs the /api payment functions
```

`index.html` at the repo root is Vite's build entry and must stay — it is the only HTML
file in the project. Every other page is a React route.

## Routes

| Path | Page |
|---|---|
| `/` | Home — hero, banners, category filter, deal countdown, Instagram grid |
| `/shop` | Listing with category filter, search, and price sort |
| `/product/:id` | Product detail with size/colour pickers and related products |
| `/cart` | Cart with quantity steppers, remove, and clear |
| `/checkout` | Billing form and order summary |
| `/about`, `/contact` | Static content |
| `*` | 404 |

## Layout

```
index.html          Vite entry (the only HTML file)
src/
  main.jsx          BrowserRouter + CartProvider
  App.jsx           routes
  index.css         Tailwind import, design tokens, component classes
  data/products.js  the catalogue
  context/          cart reducer, provider, useCart hook
  lib/money.js      paise -> INR formatting
  lib/orders.js     shipping/total maths, shared by browser and server
  lib/razorpay.js   loads Razorpay Checkout, opens the payment sheet
  components/       Header, Footer, SearchModal, ProductCard, Breadcrumb, QuantityStepper
  pages/            one file per route
public/             static assets served at the web root (img/, favicon.svg)
api/                Vercel functions: create-order, verify-payment
server/             server-only Razorpay helpers (never import from src/)
vercel.json         SPA rewrite so deep links do not 404
```

## Conventions

- **Money is integer paise.** Never store a float amount. Format with `lib/money.js`.
- **Design tokens are CSS custom properties** in the `@theme` block in `src/index.css`.
- **`.container` is defined unlayered at the bottom of `src/index.css`** on purpose:
  Tailwind v4 ships its own `container` utility with a different width ladder, and a
  layered rule would lose to it. JSX uses `class="container"` to match the width ladder.
- **Unna is not used.** A second display face was declared but never applied; the site is
  entirely Nunito Sans. `--font-display` is an alias kept for readability.
- **Background images are inline `style`**, not a jQuery `data-setbg` scan.

## Payments

Checkout takes real payments through Razorpay Standard Checkout. `api/create-order.js`
creates the order and **recomputes the total from the catalogue**, ignoring any amount
the browser sends, so the price cannot be edited in devtools. `api/verify-payment.js`
verifies the HMAC signature in constant time and then checks the order's real status
with Razorpay; only a captured `paid` order counts as a sale.

Card and UPI details are entered on Razorpay's own page. This site never handles them.

To enable it, copy `.env.example` to `.env.local` and fill in `RAZORPAY_KEY_ID` and
`RAZORPAY_KEY_SECRET`. `RAZORPAY_KEY_SECRET` is read only in `server/razorpay.js` —
never set it as a `VITE_` variable, because those are inlined into the public bundle.
Set the same two variables in the Vercel dashboard for production.

## State

Cart state lives in a reducer in `src/context/CartProvider.jsx` and is persisted to
`localStorage` under `malefashion.cart.v1`. There is no database or user account, and
the contact form, newsletter signup, and discount field are client-side only. A paid
order is not currently stored or emailed anywhere — see `PRODUCTION-TODO.md`.
