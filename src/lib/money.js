/**
 * Money helpers.
 *
 * Prices are stored as integer PAISE (1 rupee = 100 paise) so arithmetic on
 * money is always exact. Never store or sum prices as floats.
 */

const groupIndian = (value) => {
  const s = Math.round(value).toString();
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
};

/** 899900 -> "₹8,999" */
export const formatPrice = (paise) => `₹${groupIndian(paise / 100)}`;

/** 899900 -> "8,999" (no symbol, for input fields) */
export const formatAmount = (paise) => groupIndian(paise / 100);

/**
 * 899900 -> "Rs. 8,999"
 *
 * For the PDF invoice only. The base-14 PDF fonts have no glyph for the rupee
 * sign, so it would render as a missing-glyph box; this is the same figure
 * written out in a way every PDF reader can draw.
 */
export const formatPricePdf = (paise) => `Rs. ${groupIndian(paise / 100)}`;
