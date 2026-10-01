/**
 * Browser-side Razorpay Web Standard Checkout.
 *
 * Mirrors the integration guide, in order:
 *   1. Ask our server for an Order (it holds the key secret).
 *   2. Open Checkout over that order, with a handler function.
 *   3. On success, send razorpay_payment_id / razorpay_order_id /
 *      razorpay_signature back to our server to be verified.
 *
 * Only the publishable key reaches this file, and it arrives from
 * /api/create-order rather than being hardcoded. Card and UPI details are
 * entered on Razorpay's own page — never here.
 *
 * https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration
 */

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const BRAND = { color: "#e53637" };
const BUSINESS_NAME = "Male Fashion";

/** Razorpay's own guidance: a blocked script never fires onload or onerror. */
const SCRIPT_TIMEOUT_MS = 15000;
const API_TIMEOUT_MS = 20000;

/** Seconds Checkout stays usable, per the `timeout` option. */
const CHECKOUT_TIMEOUT_SECONDS = 300;

let scriptPromise = null;

/** Load checkout.js once per page and reuse the promise. */
function loadCheckoutScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Checkout is only available in the browser"));
  }
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;

    const timer = setTimeout(() => {
      script.remove();
      scriptPromise = null;
      reject(
        new Error(
          "Razorpay's checkout script did not load in time. Check your connection, VPN or content blocker, then try again.",
        ),
      );
    }, SCRIPT_TIMEOUT_MS);

    script.onload = () => {
      clearTimeout(timer);
      if (window.Razorpay) {
        resolve(window.Razorpay);
      } else {
        reject(new Error("Razorpay checkout failed to initialise"));
      }
    };
    script.onerror = () => {
      clearTimeout(timer);
      // Allow a later attempt to retry rather than caching the failure forever.
      scriptPromise = null;
      reject(new Error("Could not reach Razorpay. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

/**
 * The API reference wants `contact` as `+<country code><number>`, and defaults a
 * bare 10-digit Indian number to +91 anyway. Normalise so a number the shopper
 * typed as "+91 98765 43210" prefills instead of being mangled.
 */
function formatContact(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  return digits ? `+${digits}` : "";
}

async function postJson(path, body, { timeoutMessage, networkMessage }) {
  let response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
  } catch (error) {
    if (error?.name === "TimeoutError") throw new Error(timeoutMessage);
    throw new Error(networkMessage);
  }

  // A static host or plain Vite answers an unknown /api path with HTML, so say
  // the useful thing instead of "unexpected response".
  const NO_API_HINT =
    "The order API is not available on this origin. Locally, run `vercel dev` rather than `npm run dev` — plain Vite has no serverless functions.";

  let payload = null;
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(NO_API_HINT);
  }

  if (payload === null || typeof payload !== "object") throw new Error(NO_API_HINT);
  if (!response.ok) throw new Error(payload.error || "Could not start the payment.");
  return payload;
}

/**
 * Ask the server for an order, then open Razorpay Checkout over it.
 *
 * Resolves with `{ orderId, paymentId, signature, amount }` on success. Rejects
 * if the shopper dismisses the modal or the payment fails.
 */
export async function startCheckout({ items, prefill, shipping, apiBase = "" }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  // Delivery details ride along so the server can attach them to the order and
  // the shipment can be fulfilled. They are validated again server-side; this
  // copy exists to fail fast with a readable message.
  if (!shipping) throw new Error("Delivery details are required.");

  const order = await postJson(`${apiBase}/api/create-order`, { items, shipping }, {
    timeoutMessage: `The order API did not answer within ${API_TIMEOUT_MS / 1000} seconds. Locally that means \`vercel dev\` is not running the serverless function — check that terminal, and make sure the browser is on the port it printed.`,
    networkMessage:
      "Could not reach the payment server. This usually means the site is running on a plain `npm run dev` — the order API only exists on the deployed host (use `vercel dev` locally).",
  });

  // Exactly the fields Checkout needs, per the option reference. `amount` is in
  // the smallest currency unit and must be an integer.
  if (!order.orderId || !order.keyId) {
    throw new Error("The order API did not return an order. Please try again.");
  }

  const Razorpay = await loadCheckoutScript();
  const itemsSummary = Array.isArray(order.lines) ? order.lines : [];
  const description =
    itemsSummary.length === 1
      ? (itemsSummary[0].name ?? "Order")
      : `${itemsSummary.length} items`;

  return new Promise((resolve, reject) => {
    const checkout = new Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: BUSINESS_NAME,
      // The reference requires this to start with an alphanumeric character.
      description,
      order_id: order.orderId,
      prefill: {
        name: [prefill?.firstName, prefill?.lastName].filter(Boolean).join(" ") || undefined,
        email: prefill?.email || undefined,
        contact: formatContact(prefill?.phone) || undefined,
      },
      notes: { order_id: order.orderId },
      theme: BRAND,
      timeout: CHECKOUT_TIMEOUT_SECONDS,
      retry: { enabled: true },
      config: { display: { language: "en" } },
      modal: {
        escape: true,
        backdropclose: false,
        confirm_close: false,
        // Fires when the shopper closes the modal. Retry is enabled above, so
        // this is a dismissal rather than a failure we already reported.
        ondismiss: () => reject(new Error("Payment cancelled.")),
      },
      handler: (response) => {
        checkout.close();
        resolve({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          amount: order.amount,
        });
      },
    });

    checkout.on("payment.failed", (response) => {
      const description = response?.error?.description || "The payment failed.";
      // Close before rejecting: leaving the modal open after the promise has
      // settled would let a retry succeed with nobody listening for it.
      checkout.close();
      reject(new Error(description));
    });

    checkout.open();
  });
}

/**
 * Ask the server to confirm the payment before the order is treated as paid.
 * A success callback from the browser is not proof on its own.
 */
export async function confirmPayment({ orderId, paymentId, signature, apiBase = "" }) {
  return postJson(
    `${apiBase}/api/verify-payment`,
    { orderId, paymentId, razorpaySignature: signature },
    {
      timeoutMessage:
        "The payment server did not confirm in time. Do not pay again — the payment may have gone through; check your order or contact support.",
      networkMessage:
        "Lost the connection while confirming the payment. Do not pay again — check your order or contact support.",
    },
  );
}
