/**
 * Per-IP fixed-window rate limiting for the order API.
 *
 * WHY THIS EXISTS AND WHAT IT DOES NOT DO
 *
 * `/api/create-order` is unauthenticated by necessity — a shopper with no
 * account must be able to start a payment — and it creates a real order at
 * Razorpay on every call. Unbounded, that is a cheap way to flood the merchant
 * dashboard, burn API quota, and trip the processor's risk engine on the
 * merchant account itself.
 *
 * This limiter is IN-PROCESS, held in module scope. On Vercel each serverless
 * invocation may run in a fresh, short-lived instance, and traffic is spread
 * across many of them, so a single attacker can multiply the effective limit by
 * the instance count. It reliably stops a naive loop and bounds the damage from
 * casual abuse; it is NOT a hard global ceiling and must not be treated as one.
 *
 * For a real per-account limit across all regions, configure a Vercel Firewall
 * rate limit rule on `/api/*` (dashboard, or `vercel firewall rules add`). That
 * is enforced at the edge and is the control to rely on. This exists so the
 * endpoint is not wide open in the meantime, and so `vercel dev` and any future
 * non-Vercel host still have a limit.
 */

/** Per-IP request budget per window, per action. */
export const LIMITS = {
  // A shopper creates one order per payment attempt, and Razorpay's own
  // checkout allows a couple of retries. 10/minute is generous for one person
  // and still caps a scripted loop.
  createOrder: { max: 10, windowMs: 60_000 },
  // Each verify does two Razorpay reads, and a legitimate client can retry after
  // a dropped connection, so this is looser than create-order.
  verifyPayment: { max: 30, windowMs: 60_000 },
};

/** Entries older than this are dropped on the next sweep. */
const SWEEP_INTERVAL_MS = 5 * 60_000;

/** key -> { count, resetAt } */
const buckets = new Map();

let lastSweep = Date.now();

const sweep = () => {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

/**
 * The caller's IP, as Vercel presents it.
 *
 * `x-forwarded-for` is a comma-separated chain, left-most being the original
 * client. Trusting it wholesale would let a caller spoof a fresh identity per
 * request by sending their own header — but it is the only address Vercel gives
 * a Web `Request`, so it is the best available signal. Firewall rate limiting
 * is what actually enforces at the edge.
 */
export function clientIp(request) {
  const forwarded = request?.headers?.get?.("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request?.headers?.get?.("x-real-ip")?.trim() || "unknown";
}

/**
 * Count one request against `action` and report whether it is allowed.
 *
 * Returns `{ allowed, remaining, retryAfterSeconds }`. The window is fixed, not
 * sliding: a caller at the limit waits out the window rather than being
 * penalised by their own recent requests.
 */
export function take(action, request) {
  sweep();

  const { max, windowMs } = LIMITS[action];
  if (!max) return { allowed: true, remaining: Infinity, retryAfterSeconds: 0 };

  const now = Date.now();
  const key = `${action}:${clientIp(request)}`;

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return {
    allowed: true,
    remaining: max - bucket.count,
    retryAfterSeconds: 0,
  };
}

/** Test seam: forget every bucket. */
export function resetLimiter() {
  buckets.clear();
  lastSweep = Date.now();
}
