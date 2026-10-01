/**
 * POST /api/create-order
 *
 * Step 1 of a Web Standard Checkout payment: create the Razorpay Order, then
 * hand its id to the browser so Checkout can open against it.
 *
 * The amount is recomputed here from the catalogue. Anything the browser sends
 * about money is ignored, otherwise a shopper could edit the total in devtools
 * and pay ₹1.
 *
 * Body: { items: [{ id, size, qty }], shipping: { …delivery details… } }
 * 200:  { orderId, amount, currency, receipt, keyId, total, shipping, lines }
 * 400:  { error }   empty/unknown cart, bad delivery details, or Razorpay
 *                   rejected the request
 * 405:  { error }   not POST
 * 429:  { error }   too many orders from this IP (see server/rateLimit.js)
 * 500:  { error }   Razorpay keys missing or malformed
 * 502:  { error }   Razorpay unreachable
 * 504:  { error }   Razorpay did not answer in time
 *
 * https://razorpay.com/docs/api/orders/create
 */

import crypto from "node:crypto";

import {
  MAX_RECEIPT_LENGTH,
  RazorpayError,
  createOrder,
  readCredentials,
} from "../server/razorpay.js";
import { take } from "../server/rateLimit.js";
import { getProduct } from "../src/data/products.js";
import { CURRENCY, priceLines } from "../src/lib/orders.js";
import { ShippingError, formatAddressLine, normaliseShipping } from "../src/lib/shipping.js";

const json = (status, body, extraHeaders = {}) => {
  // Vercel runs each invocation in a fresh runtime; a CDN must never cache this.
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, ...extraHeaders },
  });
};

/**
 * A unique, ASCII, <=40 character receipt. Razorpay treats this as an
 * idempotency key, so reusing one is rejected with 400 "Duplicate request",
 * and a new order is required for every payment attempt anyway.
 */
function newReceipt() {
  return `mf_${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`.slice(
    0,
    MAX_RECEIPT_LENGTH,
  );
}

/** Turn a Razorpay failure into a status the browser can act on. */
function respondToRazorpayError(error, log) {
  if (!(error instanceof RazorpayError)) {
    console.error(`${log} failed:`, error);
    return json(502, { error: "Could not start the payment. Please try again." });
  }

  // Log the documented envelope in full; the shopper gets the description only
  // for their own bad input, never for a configuration or upstream problem.
  console.error(`${log} failed:`, {
    code: error.code,
    description: error.description,
    source: error.source,
    step: error.step,
    reason: error.reason,
  });

  if (error.status >= 500) {
    return json(error.status, { error: "Could not start the payment. Please try again." });
  }
  return json(400, { error: error.description || "Could not start the payment." });
}

export async function createOrderHandler(request) {
  if (request.method !== "POST") {
    return json(405, { error: "Use POST" });
  }

  // Before any body parsing or Razorpay call: a rejected request must cost the
  // caller nothing, so an over-limit loop never reaches the order API at all.
  const limit = take("createOrder", request);
  if (!limit.allowed) {
    console.warn("[create-order] rate limited", {
      ip: request.headers.get("x-forwarded-for"),
      retryAfterSeconds: limit.retryAfterSeconds,
    });
    return json(
      429,
      { error: "Too many payment attempts. Please wait a moment and try again." },
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "Body must be JSON" });
  }

  let priced;
  try {
    priced = priceLines(payload?.items, getProduct);
  } catch (error) {
    return json(400, { error: error.message });
  }

  // Delivery details are re-validated here, not trusted from the browser. An
  // order that is paid for but cannot be shipped is worse than a rejection, so
  // a missing or malformed address fails before Razorpay is ever called.
  let delivery;
  try {
    delivery = normaliseShipping(payload?.shipping);
  } catch (error) {
    if (error instanceof ShippingError) {
      return json(400, { error: error.message, field: error.field });
    }
    console.error("[create-order] shipping validation failed:", error);
    return json(400, { error: "Enter your delivery details to continue." });
  }

  let credentials;
  try {
    credentials = readCredentials();
  } catch (error) {
    console.error("[create-order] misconfigured:", error.message);
    return json(500, { error: error.message });
  }

  try {
    const order = await createOrder({
      amount: priced.total,
      currency: CURRENCY,
      receipt: newReceipt(),
      credentials,
      notes: {
        // Razorpay's documented cap is 15 pairs of 256 characters. Everything
        // needed to pick, pack and ship the order is here so the dashboard row
        // is self-sufficient, with the product name and size rather than just
        // the id — a fulfilment packer reads this, not the catalogue.
        //
        // The first two are the ones that must always survive truncation, so
        // they go first.
        ship_to: delivery.fullName,
        items: priced.lines
          .map((line) => `${line.qty}x ${line.name}${line.size ? ` (${line.size})` : ""}`)
          .join(", "),
        item_count: String(priced.lines.reduce((sum, line) => sum + line.qty, 0)),
        email: delivery.email,
        phone: delivery.phone,
        address: formatAddressLine(delivery),
        city: delivery.city,
        state: delivery.state,
        pincode: delivery.postcode,
        country: delivery.country,
        // Money in paise, matching the order amount and AGENTS.md's rule.
        subtotal_paise: String(priced.subtotal),
        shipping_paise: String(priced.shipping),
        order_note: delivery.note,
      },
    });

    return json(200, {
      // Checkout needs exactly these three: the publishable key, the amount in
      // the smallest currency unit, and the order id it was created for.
      keyId: credentials.keyId,
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      orderStatus: order.status,
      total: priced.total,
      shipping: priced.shipping,
      lines: priced.lines,
      // Echoed back so the confirmation screen can show what was actually
      // recorded. The server's normalised copy is authoritative, not the form.
      delivery,
    });
  } catch (error) {
    return respondToRazorpayError(error, "[create-order]");
  }
}

/**
 * Vercel's `fetch` Web Standard export.
 *
 * A Web `Request` -> `Response` function must be exported either as per-method
 * named exports (`export function POST`) or as a default object with a `fetch`
 * method. A bare `export default someFunction` is neither shape: the function
 * is invoked, its promise is never awaited, and the request hangs with no
 * response at all (the CLI only logs "still running after 30s"). The `fetch`
 * form is used over a per-method `POST` export so this handler keeps control of
 * the non-POST reply and can return its documented JSON 405 body.
 *
 * https://vercel.com/docs/functions/functions-api-reference#fetch-web-standard
 */
export default { fetch: createOrderHandler };
