import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Camera, Download, Mail, MessageCircle, ReceiptText } from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import { formatPrice } from "../lib/money";
import { downloadInvoice } from "../lib/invoice";
import { itemCount, readOrders } from "../lib/orderStore";
import { FULFILMENT_WINDOW, INSTAGRAM_URL, hasEmail, hasWhatsApp, emailUrl, whatsappUrl } from "../lib/brand";

const dateLabel = (iso) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-IN", { dateStyle: "medium" });
};

function OrderCard({ order }) {
  const [open, setOpen] = useState(false);
  const units = itemCount(order);

  return (
    <li className="border border-hairline">
      <div className="flex flex-wrap items-start justify-between gap-4 p-6">
        <div>
          <p className="font-mono text-xs text-body">{order.orderId}</p>
          <p className="mt-1 text-sm text-body">
            {dateLabel(order.placedAt)} &middot; {units} item{units === 1 ? "" : "s"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold text-ink">{formatPrice(order.amount)}</p>
          <p className="mt-0.5 text-xs tracking-wider text-body uppercase">{order.status}</p>
        </div>
      </div>

      <ul className="border-t border-hairline px-6">
        {(order.items ?? []).map((item) => (
          <li
            key={`${item.id}-${item.size}`}
            className="flex justify-between gap-4 border-b border-hairline py-3 text-sm last:border-b-0"
          >
            <span className="text-body">
              {item.qty} &times; {item.name}
              {item.size && <em className="not-italic text-body"> ({item.size})</em>}
            </span>
            <span className="shrink-0 font-semibold text-ink">{formatPrice(item.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3 border-t border-hairline p-6">
        <button
          type="button"
          onClick={() => downloadInvoice(order)}
          className="primary-btn inline-flex items-center gap-2"
        >
          <Download size={15} aria-hidden="true" />
          Download invoice (PDF)
        </button>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="inline-flex cursor-pointer items-center gap-2 px-2 py-2 text-[13px] font-bold tracking-wider text-body uppercase transition-colors hover:text-primary"
        >
          <ReceiptText size={15} aria-hidden="true" />
          {open ? "Hide details" : "Details"}
        </button>
      </div>

      {open && (
        <dl className="grid gap-x-8 gap-y-3 border-t border-hairline px-6 py-6 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs tracking-wider text-body uppercase">Payment ID</dt>
            <dd className="mt-1 font-mono text-xs break-all text-ink">{order.paymentId}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wider text-body uppercase">Subtotal</dt>
            <dd className="mt-1 text-ink">{formatPrice(order.totals.subtotal)}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wider text-body uppercase">Shipping</dt>
            <dd className="mt-1 text-ink">
              {order.totals.shipping === 0 ? "Free" : formatPrice(order.totals.shipping)}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wider text-body uppercase">Deliver to</dt>
            <dd className="mt-1 text-ink">
              {[order.customer?.address, order.customer?.city, order.customer?.postcode]
                .filter(Boolean)
                .join(", ")}
            </dd>
          </div>
        </dl>
      )}
    </li>
  );
}

export default function Orders() {
  // Read once on mount. The list only changes when a new order is saved, which
  // happens on the checkout screen before the shopper navigates here.
  const [orders] = useState(readOrders);

  return (
    <>
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "My Orders" }]} />

      <section className="spad">
        <div className="container">
          <h1 className="font-display text-3xl text-ink">My Orders</h1>

          {orders.length === 0 ? (
            <div className="mt-6 max-w-xl text-center">
              <p>
                No saved orders on this device. A receipt is saved here after every successful
                payment, on the browser you paid from.
              </p>
              <Link to="/shop" className="primary-btn mt-7 inline-flex items-center gap-2">
                Browse products <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <>
              {/*
                Not an order record. The merchant's copy is the Razorpay
                dashboard; this is the shopper's own receipt cache.
              */}
              <p className="mt-4 max-w-2xl text-sm text-body">
                Saved in this browser only. Clearing site data removes them, and they will not
                follow you to another device. We confirm every order on WhatsApp or Instagram
                within {FULFILMENT_WINDOW}.
              </p>

              <ul className="mt-8 space-y-6">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </ul>

              <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-hairline pt-8">
                {hasWhatsApp && (
                  <a
                    href={whatsappUrl("Hi, I have a question about my order")}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 border border-hairline-2 px-5 py-2.5 text-[13px] font-bold tracking-wider text-ink uppercase transition-colors hover:border-primary hover:text-primary"
                  >
                <MessageCircle size={15} aria-hidden="true" />
                  Message on WhatsApp
                  </a>
                )}
                {hasEmail && (
                  <a
                    href={emailUrl({ subject: "My order" })}
                    className="inline-flex items-center gap-2 border border-hairline-2 px-5 py-2.5 text-[13px] font-bold tracking-wider text-ink uppercase transition-colors hover:border-primary hover:text-primary"
                  >
                    <Mail size={15} aria-hidden="true" />
                    Email us
                  </a>
                )}
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border border-hairline-2 px-5 py-2.5 text-[13px] font-bold tracking-wider text-ink uppercase transition-colors hover:border-primary hover:text-primary"
                >
                  <Camera size={15} aria-hidden="true" />
                  Instagram
                </a>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
