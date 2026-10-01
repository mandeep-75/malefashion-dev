/**
 * Invoice as a real PDF.
 *
 * `downloadInvoice` produces an actual `.pdf` binary and saves it as a file.
 * An HTML "invoice" is not a PDF whatever it is named, and Safari previews
 * `.html` blobs in a new tab — both of which are wrong here. The shopper gets
 * one file, no tab, no print dialog, and it opens in any reader on any device.
 *
 * Layout is drawn through the minimal writer in `src/lib/pdf.js` using the base-14
 * fonts, so nothing is embedded and the file is a few kilobytes.
 */

import { formatPricePdf } from "./money";
import { measureText, PDF_CONTENT_WIDTH, PDF_MARGIN, PDF_PAGE, PdfDocument } from "./pdf";
import {
  BUSINESS_NAME,
  CONTACT_EMAIL,
  FULFILMENT_WINDOW,
  INSTAGRAM_URL,
  WHATSAPP_DISPLAY,
  hasEmail,
  hasWhatsApp,
} from "./brand";

const BRAND = [0.898, 0.212, 0.216]; // #e53637
const INK = [0.067, 0.067, 0.067];
const BODY = [0.361, 0.361, 0.361];
const HAIRLINE = [0.882, 0.882, 0.882];

const dateLabel = (iso) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

/** `invoice-order_RZPX8K2M4Q.pdf` */
export function invoiceFilename(order) {
  const ref = String(order?.orderId ?? order?.paymentId ?? "order").replace(/[^\w-]+/g, "-");
  return `invoice-${ref}.pdf`;
}

const COLUMNS = {
  item: { x: PDF_MARGIN, width: 268 },
  qty: { x: PDF_MARGIN + 280, width: 34 },
  unit: { x: PDF_MARGIN + 322, width: 78 },
  amount: { x: PDF_MARGIN + 404, width: 97 },
};

/** The channels a buyer can reach us on, in the order we want them quoted. */
const contactChannels = () => {
  const channels = [];
  if (hasWhatsApp) channels.push(`WhatsApp (${WHATSAPP_DISPLAY})`);
  if (hasEmail) channels.push(CONTACT_EMAIL);
  channels.push("Instagram");
  return channels.length > 1 ? `${channels.slice(0, -1).join(", ")} or ${channels.at(-1)}` : channels[0];
};

/** Contact line in the page footer, built from whichever channels are configured. */
const footerLine = () => {
  const parts = [BUSINESS_NAME, `Instagram ${INSTAGRAM_URL.replace(/^https?:\/\/(www\.)?/, "")}`];
  if (hasWhatsApp) parts.push(`WhatsApp ${WHATSAPP_DISPLAY}`);
  if (hasEmail) parts.push(CONTACT_EMAIL);
  return parts.join(" \u00b7 ");
};

const TOTALS_WIDTH = 190;
const TOTALS_X = PDF_MARGIN + PDF_CONTENT_WIDTH - TOTALS_WIDTH;

/** Lowest y the content may reach, leaving room for the footer strip. */
const PAGE_BOTTOM = PDF_PAGE.height - PDF_MARGIN;

function drawTableHeader(doc) {
  doc.text("Item", { x: COLUMNS.item.x, size: 7.5, bold: true, color: BODY });
  doc.text("Qty", { x: COLUMNS.qty.x, size: 7.5, bold: true, color: BODY, align: "right", width: COLUMNS.qty.width });
  doc.text("Unit price", { x: COLUMNS.unit.x, size: 7.5, bold: true, color: BODY, align: "right", width: COLUMNS.unit.width });
  doc.text("Amount", { x: COLUMNS.amount.x, size: 7.5, bold: true, color: BODY, align: "right", width: COLUMNS.amount.width });
  doc.moveDown(3);
  doc.rule({ color: INK, weight: 0.8 });
  doc.moveDown(5);
}

function drawItemRow(doc, item) {
  // A wrapped product name can grow past one line, so reserve the full height
  // before writing rather than letting the next row overlap it.
  const name = item.size ? `${item.name} - Size ${item.size}` : item.name;
  const lines = Math.max(1, Math.ceil(measureText(name, 10) / COLUMNS.item.width));
  const height = lines * 14.5;

  doc.ensure(height + 12, drawTableHeader);
  doc.text(name, { x: COLUMNS.item.x, size: 10, y: doc.cursorY + 10 });
  doc.text(String(item.qty), { x: COLUMNS.qty.x, size: 10, align: "right", width: COLUMNS.qty.width, y: doc.cursorY + 10 });
  doc.text(formatPricePdf(item.unitPrice), { x: COLUMNS.unit.x, size: 10, align: "right", width: COLUMNS.unit.width, y: doc.cursorY + 10 });
  doc.text(formatPricePdf(item.lineTotal), { x: COLUMNS.amount.x, size: 10, bold: true, align: "right", width: COLUMNS.amount.width, y: doc.cursorY + 10 });

  doc.moveDown(height);
  doc.rule({ color: HAIRLINE, weight: 0.6 });
  doc.moveDown(5);
}

function totalRow(doc, label, value, { bold = false, size = 10, color = INK } = {}) {
  doc.text(label, { x: TOTALS_X, size, bold, color, y: doc.cursorY + size });
  doc.text(value, { x: TOTALS_X, size, bold, color, align: "right", width: TOTALS_WIDTH, y: doc.cursorY + size });
  doc.moveDown(size * 1.5);
}

/** Build the invoice document. Exported so it can be rendered or tested. */
export function buildInvoice(order) {
  const doc = new PdfDocument({ title: `Invoice ${order.orderId ?? ""}` });
  const customer = order.customer ?? {};
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Customer";

  // Header: wordmark on the left, document title on the right.
  doc.text(BUSINESS_NAME, { size: 15, bold: true, y: doc.cursorY + 15 });
  doc.text(`Dispatched within ${FULFILMENT_WINDOW}`, { size: 9, color: BODY, y: doc.cursorY + 32 });
  doc.text("INVOICE", { size: 20, bold: true, align: "right", y: doc.cursorY + 8 });
  doc.text(`Ref ${order.orderId ?? ""}`, { size: 9, color: BODY, align: "right", y: doc.cursorY + 32 });
  doc.text(dateLabel(order.placedAt), { size: 9, color: BODY, align: "right", y: doc.cursorY + 44 });
  doc.moveDown(56);

  doc.rect(PDF_MARGIN, doc.cursorY, PDF_CONTENT_WIDTH, 2, BRAND);
  doc.moveDown(14);

  // Parties, side by side. Each wraps independently so a long address cannot
  // push the other column off the page.
  const halfWidth = PDF_CONTENT_WIDTH / 2 - 16;
  const partyTop = doc.cursorY + 12;

  doc.text("BILLED TO", { size: 7.5, bold: true, color: BODY, width: halfWidth, y: doc.cursorY + 8 });
  doc.rule({ color: HAIRLINE, weight: 0.6, x: PDF_MARGIN, width: halfWidth });
  doc.moveDown(4);
  doc.paragraph(name, { size: 11, bold: true, width: halfWidth, x: PDF_MARGIN });
  if (customer.email) doc.paragraph(customer.email, { size: 9.5, color: BODY, width: halfWidth, x: PDF_MARGIN });
  if (customer.phone) doc.paragraph(customer.phone, { size: 9.5, color: BODY, width: halfWidth, x: PDF_MARGIN });

  const rightX = PDF_MARGIN + halfWidth + 32;
  const savedY = doc.cursorY;
  doc.cursorY = partyTop - 12;
  doc.text("SHIP TO", { size: 7.5, bold: true, color: BODY, x: rightX, y: doc.cursorY + 8 });
  doc.rule({ color: HAIRLINE, weight: 0.6, x: rightX, width: halfWidth });
  doc.moveDown(4);
  const address = [customer.address, customer.address2, customer.city, customer.state, customer.postcode]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(", ");
  doc.paragraph(address || "-", { size: 9.5, color: INK, width: halfWidth, x: rightX });
  doc.cursorY = Math.max(doc.cursorY, savedY);

  doc.moveDown(20);
  drawTableHeader(doc);
  for (const item of order.items ?? []) drawItemRow(doc, item);
  doc.moveDown(12);

  // Totals block, right-aligned under the table.
  doc.ensure(120);
  totalRow(doc, "Subtotal", formatPricePdf(order.totals.subtotal));
  totalRow(doc, "Shipping", order.totals.shipping === 0 ? "Free" : formatPricePdf(order.totals.shipping));
  totalRow(doc, "Total", formatPricePdf(order.totals.total), { bold: true, size: 11 });
  totalRow(doc, "Amount paid", formatPricePdf(order.amount), {
    bold: true,
    size: 12,
    color: BRAND,
  });
  doc.moveDown(10);

  // Payment reference block.
  const meta = [
    ["Payment ID", order.paymentId ?? ""],
    ["Order ID", order.orderId ?? ""],
    ["Status", order.status ?? ""],
    ["Currency", order.currency ?? "INR"],
  ];
  for (const [label, value] of meta) {
    doc.text(label, { size: 9, color: BODY, y: doc.cursorY + 9 });
    doc.text(value, { x: TOTALS_X + 90, size: 9, color: BODY, y: doc.cursorY + 9 });
    doc.moveDown(13);
  }

  if (customer.notes) {
    doc.moveDown(8);
    doc.paragraph(`Order notes: ${customer.notes}`, { size: 9, color: BODY, maxLines: 3 });
  }

  doc.moveDown(10);
  doc.paragraph(
    `What happens next: we have your order and payment. Our team confirms on ${
      contactChannels()
    } within ${FULFILMENT_WINDOW} and dispatches it to the address above.`,
    { size: 9, color: BODY, maxLines: 4 },
  );

  // Drawn on every page, so the contact details survive a page being separated
  // from the rest. Reserving the strip keeps body content from overprinting it.
  doc.bottomInset = 34;
  doc.setPageFooter(() => {
    const overlay = new PdfDocument({ title: "footer" });
    overlay.cursorY = PAGE_BOTTOM - 22;
    overlay.rule({ color: HAIRLINE, weight: 0.6 });
    overlay.moveDown(6);
    overlay.text(footerLine(), { size: 8.5, color: BODY });
    return overlay.ops;
  });

  return doc;
}

/** Build the invoice and hand it to the browser as a `.pdf` file download. */
export function downloadInvoice(order) {
  // Latin-1 throughout (see pdf.js), so the byte length matches the char count.
  const source = buildInvoice(order).toBlobString();
  const bytes = new Uint8Array(source.length);
  for (let i = 0; i < source.length; i++) bytes[i] = source.charCodeAt(i) & 0xff;

  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = invoiceFilename(order);
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
