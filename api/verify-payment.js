/**
 * POST /api/verify-payment
 *
 * Step 2 of a Web Standard Checkout payment, and the only trustworthy one. The
 * browser claims a payment succeeded; this proves it, in the two ways the
 * integration guide requires:
 *
 *   1. Verify the signature — HMAC-SHA256(order_id|payment_id, key_secret)
 *      against the `razorpay_signature` Checkout returned. A mismatch is a
 *      tampered or forged callback: reject the order entirely, do not retry.
 *   2. Verify the status — fetch the Payment (and its Order) and require
 *      `captured: true`. Goods ship only after capture; an `authorized`
 *      payment is money that has not moved and will auto-refund if uncaptured.
 *
 * Body: { orderId, paymentId, razorpaySignature }
 * 200:  { verified: true, paid, status, orderStatus, orderId, paymentId, method, amount }
 * 400:  { error }   missing or malformed fields
 * 401:  { error }   signature mismatch, or the payment belongs to another order
 * 405:  { error }   not POST
 * 500:  { error }   Razorpay keys missing or malformed
 * 502:  { error }   Razorpay unreachable
 * 504:  { error }   Razorpay did not answer in time
 *
 * https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration
 */

import {
  RazorpayError,
  fetchOrder,
  fetchPayment,
  readCredentials,
  verifyPaymentSignature,
} from "../server/razorpay.js";

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

/** Razorpay identifiers are 14 alphanumeric characters with a known prefix. */
const ID_PATTERN = /^(order|pay)_[A-Za-z0-9]+$/;

export async function verifyPaymentHandler(request) {
  if (request.method !== "POST") {
    return json(405, { error: "Use POST" });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Body must be JSON" });
  }

  const orderId = body?.orderId;
  const paymentId = body?.paymentId;
  const signature = body?.razorpaySignature ?? body?.signature;

  if (!ID_PATTERN.test(orderId ?? "") || !ID_PATTERN.test(paymentId ?? "")) {
    return json(400, { error: "A valid orderId and paymentId are required." });
  }
  if (typeof signature !== "string" || signature.length === 0) {
    return json(400, { error: "razorpaySignature is required." });
  }

  let credentials;
  try {
    credentials = readCredentials();
  } catch (error) {
    console.error("[verify-payment] misconfigured:", error.message);
    return json(500, { error: error.message });
  }

  if (!verifyPaymentSignature({ orderId, paymentId, signature, keySecret: credentials.keySecret })) {
    console.warn("[verify-payment] signature mismatch", { orderId, paymentId });
    return json(401, { verified: false, error: "Payment could not be verified." });
  }

  let payment;
  let order;
  try {
    payment = await fetchPayment(paymentId, credentials);
    order = await fetchOrder(orderId, credentials);
  } catch (error) {
    if (error instanceof RazorpayError) {
      console.error("[verify-payment] lookup failed:", {
        code: error.code,
        description: error.description,
      });
    } else {
      console.error("[verify-payment] lookup failed:", error);
    }
    // The signature was good, so the money may well have moved. Say so rather
    // than telling the shopper to retry a payment that already succeeded.
    return json(502, {
      verified: false,
      error: "Could not confirm the payment with Razorpay. Do not pay again — check your order or contact support.",
    });
  }

  // A valid signature over a payment id from a *different* order would still
  // verify, so tie the two together explicitly.
  if (payment.orderId !== order.orderId) {
    console.warn("[verify-payment] payment does not belong to order", {
      orderId,
      paymentOrderId: payment.orderId,
    });
    return json(401, { verified: false, error: "Payment could not be verified." });
  }
  if (payment.amount !== order.amount) {
    console.warn("[verify-payment] amount mismatch", {
      orderId,
      paymentAmount: payment.amount,
      orderAmount: order.amount,
    });
    return json(401, { verified: false, error: "Payment could not be verified." });
  }

  // `captured` is the check the go-live checklist names. An order only reaches
  // "paid" once its payment is captured, so both are reported and the browser
  // decides what to show.
  const paid = payment.captured && payment.status === "captured";

  return json(200, {
    verified: true,
    paid,
    status: payment.status,
    orderStatus: order.status,
    orderId: order.orderId,
    paymentId: payment.paymentId,
    method: payment.method,
    amount: payment.amount,
    currency: payment.currency,
    amountRefunded: payment.amountRefunded,
  });
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
export default { fetch: verifyPaymentHandler };
