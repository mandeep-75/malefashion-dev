/**
 * Browser-local order receipts.
 *
 * IMPORTANT: this is a convenience for the *shopper*, not an order record. The
 * store has no database and no webhook, so nothing here is authoritative — it
 * lives in this one browser and is lost if storage is cleared or the shopper
 * switches devices. The merchant's copy of an order is the Razorpay dashboard.
 *
 * Saved because the confirmation screen is the only place a paid order is ever
 * visible to the customer, and it is gone the moment they navigate away. This
 * is what makes "download my invoice" possible more than once.
 */

import { CURRENCY } from "./orders";

const STORAGE_KEY = "malefashion.orders.v1";

/** Newest first, capped so localStorage cannot grow without bound. */
const MAX_ORDERS = 20;

const read = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (order) => order && typeof order === "object" && typeof order.id === "string",
    );
  } catch {
    // Private mode, disabled storage, or corrupt JSON. The receipt still works
    // for this session; it just will not be there next time.
    return [];
  }
};

const write = (orders) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch {
    return false;
  }
};

export const readOrders = read;

/**
 * Persist a completed order, newest first.
 *
 * Keyed on the payment id and idempotent, so a double-invoked effect or a second
 * visit to the confirmation screen updates the existing record instead of
 * stacking duplicates.
 */
export function saveOrder(order) {
  if (!order?.id) return read();
  const next = [order, ...read().filter((saved) => saved.id !== order.id)].slice(0, MAX_ORDERS);
  write(next);
  return next;
}

/**
 * Build the stored record from what the checkout already knows.
 *
 * Called before the cart is cleared, because `detailed` is the only place the
 * priced lines exist.
 */
export function buildOrder({ payment, result, lines, shipping, form }) {
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const amount = result.amount ?? payment.amount ?? subtotal + shipping;

  return {
    id: payment.paymentId,
    orderId: payment.orderId,
    paymentId: payment.paymentId,
    status: result.status,
    currency: result.currency ?? CURRENCY,
    amount,
    placedAt: new Date().toISOString(),
    items: lines.map((line) => ({
      id: line.id,
      name: line.product.name,
      size: line.size ?? "",
      qty: line.qty,
      unitPrice: line.product.price,
      lineTotal: line.lineTotal,
    })),
    totals: { subtotal, shipping, total: subtotal + shipping },
    customer: {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      address: form.address,
      address2: form.address2,
      city: form.city,
      state: form.state,
      postcode: form.postcode,
      notes: form.notes,
    },
  };
}

/** "3 items" / "1 item", for the orders list. */
export const itemCount = (order) =>
  (order?.items ?? []).reduce((sum, item) => sum + (item.qty ?? 0), 0);
