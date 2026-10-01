/**
 * Order maths shared by the browser and the serverless API.
 *
 * This module must stay dependency-free and isomorphic: `src/` imports it to
 * render the summary, and `api/create-order.js` imports it to recompute the
 * total. The server never trusts an amount sent by the client, so the shipping
 * rule has exactly one definition.
 *
 * All amounts are integer paise.
 */

export const FREE_SHIPPING_OVER = 200000;
export const SHIPPING_FEE = 9900;
export const CURRENCY = "INR";

/** Guard rails so a hand-crafted request cannot ask for an absurd order. */
export const MAX_LINES = 50;
export const MAX_QTY_PER_LINE = 99;

/**
 * Ceiling on what a single order may be worth, in paise (₹50,000).
 *
 * Chosen by the shop owner. At ~₹650–700 a tee this is roughly 70 units, so an
 * ordinary single shopper never reaches it, while 50 lines × 99 units — the most
 * the other guards allow — is far out of reach. Anything past this is a bulk
 * enquiry to handle by hand, and the error says so.
 *
 * Rate limiting bounds how often an order can be created; this bounds what each
 * one can be for. Both are needed, and neither replaces the other.
 */
export const MAX_ORDER_TOTAL = 5000000;

export function shippingFor(subtotal) {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
}

export function totalsFor(subtotal) {
  const shipping = shippingFor(subtotal);
  return { subtotal, shipping, total: subtotal + shipping };
}

/**
 * Rebuild the totals for a cart of `{ id, size, qty }` lines.
 *
 * `getProduct` is injected rather than imported so this file stays free of app
 * imports. Every id must resolve, otherwise the whole cart is rejected — that
 * is deliberate: a line the catalogue no longer knows about must fail loudly
 * server-side instead of being priced at zero.
 */
export function priceLines(lines, getProduct) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error("Cart is empty");
  }
  if (lines.length > MAX_LINES) {
    throw new Error("Too many distinct items in the cart");
  }

  let subtotal = 0;
  const priced = [];

  for (const line of lines) {
    const product = getProduct(line?.id);
    if (!product) throw new Error(`Unknown product: ${line?.id}`);

    // Floor rather than reject: a fractional quantity can only ever *lower* the
    // amount, which is the safe direction. Anything that floors below 1 is
    // rejected by the minimum check.
    const qty = Math.floor(Number(line?.qty));
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      throw new Error(`Invalid quantity for ${product.id}`);
    }

    const size = typeof line?.size === "string" ? line.size : "";
    if (product.sizes?.length && size && !product.sizes.includes(size)) {
      throw new Error(`Size "${size}" is not available for ${product.name}`);
    }

    const lineTotal = product.price * qty;
    subtotal += lineTotal;
    priced.push({
      id: product.id,
      name: product.name,
      size,
      qty,
      unitPrice: product.price,
      lineTotal,
    });
  }

  const totals = totalsFor(subtotal);
  if (totals.total > MAX_ORDER_TOTAL) {
    // Reported in rupees because that is the unit a shopper reads, and the
    // source of the number is a catalogue the merchant can change.
    throw new Error(
      `Order total of Rs.${(totals.total / 100).toLocaleString("en-IN")} is over the Rs.${(
        MAX_ORDER_TOTAL / 100
      ).toLocaleString("en-IN")} limit. Please contact us for a bulk order.`,
    );
  }

  return { lines: priced, ...totals };
}
