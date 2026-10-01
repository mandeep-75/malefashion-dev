/**
 * Delivery details, validated identically in the browser and in the API.
 *
 * Must stay dependency-free and isomorphic, like `src/lib/orders.js`: the
 * checkout form validates with it before offering payment, and
 * `api/create-order.js` validates with it again before telling Razorpay to
 * take the money. The second pass is the one that counts — a request can be
 * crafted by hand, so the server never trusts that the browser checked.
 *
 * The same rule Razorpay documents for the order's `notes` applies here: 15
 * key-value pairs, 256 characters each. Every field below is capped well under
 * that so an address is never silently truncated by the API instead.
 */

/** Per-field caps, chosen to fit Razorpay's 256-character note limit. */
export const MAX_NAME = 60;
export const MAX_EMAIL = 120;
export const MAX_PHONE = 20;
export const MAX_ADDRESS_LINE = 120;
export const MAX_CITY = 60;
export const MAX_STATE = 60;
export const MAX_POSTCODE = 10;
export const MAX_BUYER_NOTE = 200;

/**
 * Collapse runs of whitespace, strip control characters, and cap the length.
 *
 * Control characters and newlines are removed rather than trimmed because
 * these strings end up in Razorpay's dashboard, its CSV exports, and
 * fulfilment tools — a stray newline or ANSI escape corrupts a packing slip.
 */
function clean(value, max) {
  if (typeof value !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
const isPhone = (value) => /^\+?[\d\s()-]{6,20}$/.test(value);
const isPostcode = (value) => /^\d{4,10}$/.test(value);

export class ShippingError extends Error {
  constructor(field, message) {
    super(message);
    this.name = "ShippingError";
    this.field = field;
  }
}

/**
 * Validate and normalise the delivery details for an order.
 *
 * Throws `ShippingError` on the first problem. The address is mandatory on
 * purpose: an order that is paid for but has nowhere to ship is worse than a
 * rejected checkout, so this fails loudly rather than charging and hoping.
 */
export function normaliseShipping(input) {
  const raw = (key) => (input && typeof input[key] === "string" ? input[key] : "");

  const firstName = clean(raw("firstName"), MAX_NAME);
  const lastName = clean(raw("lastName"), MAX_NAME);
  const email = clean(raw("email"), MAX_EMAIL);
  const phone = clean(raw("phone"), MAX_PHONE);
  const address1 = clean(raw("address"), MAX_ADDRESS_LINE);
  const address2 = clean(raw("address2"), MAX_ADDRESS_LINE);
  const city = clean(raw("city"), MAX_CITY);
  const state = clean(raw("state"), MAX_STATE);
  const postcode = clean(raw("postcode"), MAX_POSTCODE);
  const note = clean(raw("notes"), MAX_BUYER_NOTE);

  if (!firstName) throw new ShippingError("firstName", "First name is required.");
  if (!lastName) throw new ShippingError("lastName", "Last name is required.");
  if (!isEmail(email)) throw new ShippingError("email", "Enter a valid email address.");
  if (!isPhone(phone)) throw new ShippingError("phone", "Enter a valid phone number.");
  if (!address1) throw new ShippingError("address", "Address line 1 is required.");
  if (!city) throw new ShippingError("city", "City is required.");
  if (!state) throw new ShippingError("state", "State is required.");
  if (!isPostcode(postcode)) throw new ShippingError("postcode", "Enter a valid PIN code.");

  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    email,
    phone,
    address1,
    address2,
    city,
    state,
    postcode,
    // Razorpay needs a country on the address; this store ships in India only.
    country: "IN",
    note,
  };
}

/**
 * Render the delivery details as the single-line address a packing slip needs.
 * Empty optional lines are dropped so there are no double spaces or stray
 * commas in the dashboard.
 */
export function formatAddressLine(shipping) {
  return [shipping.address1, shipping.address2, shipping.city, shipping.state, shipping.postcode]
    .filter(Boolean)
    .join(", ");
}
