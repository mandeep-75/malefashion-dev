/**
 * Single source of truth for the business's public contact details.
 *
 * Anything a shopper is told to "message us on" lives here so the footer, the
 * order confirmation and the invoice can never drift apart.
 */

export const BUSINESS_NAME = "Male Fashion";
export const INSTAGRAM_URL = "https://www.instagram.com/aurex.co.inn/";

/**
 * WhatsApp number in E.164 digits with no `+`, e.g. `919876543210`.
 *
 * Read from the build-time env so the number can be changed without touching
 * code. It is deliberately NOT a secret: a VITE_ value is inlined into the
 * bundle by design, and a support number is public information anyway.
 */
const RAW_WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER ?? "";

/** Strip formatting a human might type in the dashboard, e.g. "+91 98765 43210". */
const toWaDigits = (raw) => String(raw).replace(/\D/g, "");

/** 10 digits, 12 starting 91, or 11 starting 0 — the shapes Indians actually type. */
const normaliseWhatsApp = (raw) => {
  const digits = toWaDigits(raw);
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return "";
};

export const WHATSAPP_NUMBER = normaliseWhatsApp(RAW_WHATSAPP);
export const hasWhatsApp = WHATSAPP_NUMBER !== "";

/** Human-facing number for the invoice and confirmation copy. */
export const WHATSAPP_DISPLAY = hasWhatsApp
  ? `+${WHATSAPP_NUMBER.replace(/^91/, "0")}`
  : "";

/**
 * A `wa.me` link with an optional prefilled message.
 *
 * Returns "" when no number is configured, so callers can hide the link rather
 * than render a dead one.
 */
export function whatsappUrl(message = "") {
  if (!hasWhatsApp) return "";
  const text = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${text}` : ""}`;
}

/** How long fulfilment takes, quoted to the shopper after they pay. */
export const FULFILMENT_WINDOW = "1-2 business days";
