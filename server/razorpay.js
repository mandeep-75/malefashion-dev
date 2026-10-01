/**
 * Server-only Razorpay API client.
 *
 * This is the documented server half of a Web Standard Checkout payment, and
 * nothing more:
 *
 *   Create an Order   POST /v1/orders        amount, currency, receipt?, notes?
 *   Fetch an Order    GET  /v1/orders/:id
 *   Fetch a Payment   GET  /v1/payments/:id
 *   Verify signature  HMAC-SHA256(order_id + "|" + payment_id, key_secret)
 *
 * Every request is authenticated with HTTP Basic auth, as the API reference
 * requires: `Authorization: Basic base64(key_id + ":" + key_secret)`. The
 * header must match that shape exactly — `basic `, `Basic "…"` and a literal
 * `$` are all rejected with 400 by Razorpay.
 *
 * References:
 *   https://razorpay.com/docs/api/authentication
 *   https://razorpay.com/docs/api/orders/create
 *   https://razorpay.com/docs/api/orders/fetch-with-id
 *   https://razorpay.com/docs/api/payments/fetch-with-id
 *   https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration
 *
 * Never import this from `src/` — it is the one place `RAZORPAY_KEY_SECRET` is
 * read, and every file under `src/` is downloaded by the browser.
 */

import crypto from "node:crypto";

const API_BASE = "https://api.razorpay.com/v1";

/** Razorpay publishes a 30s soft limit on request processing. */
const REQUEST_TIMEOUT_MS = 15000;

/** 429 means "slow down", so retry with backoff — but only a few times. */
const MAX_ATTEMPTS = 3;

/** Documented caps, enforced here rather than discovered as a 400. */
const MIN_AMOUNT = 100;
export const MAX_RECEIPT_LENGTH = 40;
const MAX_NOTES = 15;
const MAX_NOTE_LENGTH = 256;

/**
 * An error from the Razorpay API, carrying the documented error envelope
 * (`error.code`, `error.description`, `error.source`, `error.step`,
 * `error.reason`) so handlers can log it and shoppers get something useful.
 *
 * `status` is the status *our* API should reply with, not Razorpay's.
 */
export class RazorpayError extends Error {
  constructor(message, { status = 502, code, description, source, step, reason } = {}) {
    super(message);
    this.name = "RazorpayError";
    this.status = status;
    this.code = code;
    this.description = description;
    this.source = source;
    this.step = step;
    this.reason = reason;
  }
}

/**
 * Read the key pair from the environment.
 *
 * Values are trimmed: the API reference calls out stray whitespace as a cause
 * of 400 "Authentication failed", and an env file is exactly where that creeps
 * in. A key that is obviously not a Razorpay key is rejected before the request
 * so a half-configured deployment fails with a useful message.
 */
export function readCredentials(env = process.env) {
  const keyId = (env.RAZORPAY_KEY_ID ?? "").trim();
  const keySecret = (env.RAZORPAY_KEY_SECRET ?? "").trim();

  if (!keyId || !keySecret) {
    throw new RazorpayError(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the deployment environment.",
      { status: 500, code: "CONFIG_MISSING" },
    );
  }
  if (!/^rzp_(test|live)_/.test(keyId) || !/^[A-Za-z0-9]+$/.test(keySecret)) {
    throw new RazorpayError(
      "Razorpay keys are malformed. They should be rzp_test_…/rzp_live_… from Dashboard -> Account & Settings -> API Keys.",
      { status: 500, code: "CONFIG_MALFORMED" },
    );
  }
  return { keyId, keySecret };
}

const basicAuth = ({ keyId, keySecret }) =>
  `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Backoff with jitter, so parallel retries don't arrive as one thundering herd. */
const backoff = (attempt) => 250 * 2 ** (attempt - 1) + Math.floor(Math.random() * 150);

async function call(path, { method = "GET", body, credentials, attempt = 1 } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: basicAuth(credentials),
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    // Never let a dead socket become an unanswered HTTP request: the browser
    // is waiting on this, and a pending promise is indistinguishable from a
    // hung server.
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    throw new RazorpayError(
      timedOut
        ? `Razorpay did not respond within ${REQUEST_TIMEOUT_MS / 1000}s (${method} ${path}).`
        : `Could not reach Razorpay (${method} ${path}): ${error?.message ?? "network error"}`,
      { status: 504, code: timedOut ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNREACHABLE" },
    );
  }

  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new RazorpayError(
        `Razorpay returned a non-JSON response (${response.status}) for ${method} ${path}.`,
        { status: 502, code: "BAD_UPSTREAM_RESPONSE" },
      );
    }
  }

  if (response.ok) return payload;

  // The API reference documents 429 rate limiting and asks for exponential
  // backoff rather than an immediate retry.
  if (response.status === 429 && attempt < MAX_ATTEMPTS) {
    await sleep(backoff(attempt));
    return call(path, { method, body, credentials, attempt: attempt + 1 });
  }

  const error = payload?.error ?? {};
  const description = error.description || response.statusText || "Unknown error";
  // An auth failure is a deployment problem, not a shopper problem. Say so
  // generically to the browser and keep the detail in the server log.
  const misconfigured = /auth/i.test(description) || response.status === 401;

  throw new RazorpayError(description, {
    status: misconfigured ? 500 : response.status >= 500 ? 502 : 400,
    code: error.code,
    description,
    source: error.source,
    step: error.step,
    reason: error.reason,
  });
}

/**
 * Create an Order. A Razorpay Order ID maps 1:1 to a payment attempt, so this is
 * called once per attempt and the returned `id` is handed to Checkout.
 *
 * `receipt` doubles as Razorpay's idempotency key: sending the same value twice
 * is rejected with 400 "Duplicate request", so it must be unique per order and
 * no more than 40 characters.
 */
export async function createOrder({ amount, currency, receipt, notes, credentials }) {
  if (!Number.isInteger(amount) || amount < MIN_AMOUNT) {
    throw new RazorpayError(
      `Order amount must be an integer of at least ${MIN_AMOUNT} paise (Razorpay's minimum is INR 1.00).`,
      { status: 400, code: "BAD_REQUEST_ERROR" },
    );
  }
  if (typeof currency !== "string" || currency.length !== 3) {
    throw new RazorpayError("Currency must be a 3-character ISO code, e.g. INR.", {
      status: 400,
      code: "BAD_REQUEST_ERROR",
    });
  }
  if (typeof receipt === "string") {
    if (receipt.length > MAX_RECEIPT_LENGTH) {
      throw new RazorpayError(`Receipt must be at most ${MAX_RECEIPT_LENGTH} characters.`, {
        status: 400,
        code: "BAD_REQUEST_ERROR",
      });
    }
    // The reference rejects non-ASCII receipts (emoji, accents) outright.
    if (!/^[\x20-\x7e]+$/.test(receipt)) {
      throw new RazorpayError("Receipt must be printable ASCII.", {
        status: 400,
        code: "BAD_REQUEST_ERROR",
      });
    }
  }

  const order = await call("/orders", {
    method: "POST",
    credentials,
    body: {
      amount,
      currency,
      ...(receipt ? { receipt } : {}),
      ...(notes && Object.keys(notes).length ? { notes: trimNotes(notes) } : {}),
    },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    amountPaid: order.amount_paid,
    amountDue: order.amount_due,
    currency: order.currency,
    receipt: order.receipt,
    status: order.status,
    attempts: order.attempts,
  };
}

/** Fetch an Order. `status` is one of created | attempted | paid. */
export async function fetchOrder(orderId, credentials) {
  const order = await call(`/orders/${encodeURIComponent(orderId)}`, { credentials });
  return {
    orderId: order.id,
    amount: order.amount,
    amountPaid: order.amount_paid,
    amountDue: order.amount_due,
    currency: order.currency,
    status: order.status,
    attempts: order.attempts,
    notes: order.notes ?? {},
  };
}

/**
 * Fetch a Payment. `status` is one of created | authorized | captured |
 * refunded | failed, and `captured` is the boolean the go-live checklist tells
 * you to check before shipping goods.
 */
export async function fetchPayment(paymentId, credentials) {
  const payment = await call(`/payments/${encodeURIComponent(paymentId)}`, { credentials });
  return {
    paymentId: payment.id,
    orderId: payment.order_id ?? null,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    captured: payment.captured === true,
    method: payment.method,
    amountRefunded: payment.amount_refunded ?? 0,
    refundStatus: payment.refund_status ?? null,
    email: payment.email ?? null,
    contact: payment.contact ?? null,
    errorDescription: payment.error_description ?? null,
  };
}

/**
 * Confirm a Checkout success callback really came from Razorpay.
 *
 * The documented construction is
 *   hmac_sha256(order_id + "|" + razorpay_payment_id, key_secret)
 * compared against `razorpay_signature`. The docs also say to take `order_id`
 * from your own server rather than from the browser — with no database here we
 * use the id the browser sent, which is safe: any substitution changes the HMAC
 * input and the comparison fails.
 */
export function verifyPaymentSignature({ orderId, paymentId, signature, keySecret }) {
  if (!orderId || !paymentId || !signature) return false;

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const given = Buffer.from(String(signature), "utf8");
  const want = Buffer.from(expected, "utf8");
  if (given.length !== want.length) return false;
  return crypto.timingSafeEqual(given, want);
}

function trimNotes(notes) {
  const out = {};
  for (const [key, value] of Object.entries(notes).slice(0, MAX_NOTES)) {
    out[String(key).slice(0, MAX_NOTE_LENGTH)] = String(value).slice(0, MAX_NOTE_LENGTH);
  }
  return out;
}
