import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Smartphone,
  CreditCard,
  Landmark,
  Wallet,
  Lock,
  CheckCircle2,
  Loader2,
  Download,
  MessageCircle,
  Camera,
  ReceiptText,
} from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import { useCart } from "../context/useCart";
import { formatPrice } from "../lib/money";
import { shippingFor } from "../lib/orders";
import { startCheckout, confirmPayment } from "../lib/razorpay";
import { ShippingError, normaliseShipping } from "../lib/shipping";
import { downloadInvoice } from "../lib/invoice";
import { buildOrder, isRefunded, netPaid, saveOrder } from "../lib/orderStore";
import {
  FULFILMENT_WINDOW,
  INSTAGRAM_URL,
  hasWhatsApp,
  whatsappUrl,
} from "../lib/brand";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const METHODS = [
  { icon: Smartphone, label: "UPI" },
  { icon: CreditCard, label: "Cards" },
  { icon: Landmark, label: "Net banking" },
  { icon: Wallet, label: "Wallets" },
];

function Field({ id, label, type = "text", required = true, value, onChange, placeholder, half }) {
  return (
    <div className={half ? "sm:col-span-1" : "sm:col-span-2"}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-ink">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-hairline-2 px-4 py-3 text-sm focus:border-primary focus:outline-none"
      />
    </div>
  );
}

export default function Checkout() {
  const { detailed, subtotal, count, lines, clear } = useCart();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    address2: "",
    city: "",
    state: "",
    postcode: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [receipt, setReceipt] = useState(null);

  // Same rule the server uses in src/lib/orders.js, so the figure shown here
  // is the figure that gets charged.
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;

  const set = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // The same validator the order API runs, so the shopper sees a field-level
  // message instead of a generic rejection from the server. It is a
  // convenience, not the check that counts — the server re-runs this.
  const validate = () => {
    const next = {};
    try {
      normaliseShipping(form);
    } catch (error) {
      if (error instanceof ShippingError) next[error.field] = error.message;
      else next.form = "Check your delivery details and try again.";
    }
    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.getElementById("checkout-errors")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setPaymentError("");
    setPaying(true);
    try {
      const payment = await startCheckout({
        // Only ids and quantities are sent for pricing. The server prices the
        // cart itself and never trusts an amount from here.
        items: lines.map(({ id, size, qty }) => ({ id, size, qty })),
        prefill: form,
        shipping: form,
        apiBase: API_BASE,
      });

      const result = await confirmPayment({ ...payment, apiBase: API_BASE });
      if (!result.paid) {
        throw new Error(`Payment is ${result.status}, not captured. Contact support if you were charged.`);
      }

      // Built from the priced lines *before* the cart is cleared — this is the
      // last moment they exist.
      const order = buildOrder({ payment, result, lines: detailed, shipping, form });
      saveOrder(order);
      setReceipt(order);
      clear();
    } catch (error) {
      setPaymentError(error.message || "Something went wrong. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const errorList = Object.entries(errors).filter(([, message]) => Boolean(message));

  // Hand the shopper their invoice without making them ask for it. Keyed on the
  // payment id so a re-render, a StrictMode double-invoke, or coming back to
  // this screen never stacks up duplicate downloads.
  const autoDownloaded = useRef(null);
  useEffect(() => {
    if (!receipt) return;
    if (autoDownloaded.current === receipt.id) return;
    autoDownloaded.current = receipt.id;
    downloadInvoice(receipt);
  }, [receipt]);

  if (receipt) {
    const refunded = isRefunded(receipt);
    const whatsapp = whatsappUrl(
      `Hi, I have placed order ${receipt.orderId} and I have a question about it.`,
    );

    return (
      <>
        <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Order confirmed" }]} />
        <section className="spad">
          <div className="container max-w-2xl text-center">
            <CheckCircle2 size={56} className="mx-auto text-primary" aria-hidden="true" />
            <h1 className="mt-6 font-display text-3xl text-ink">Thank you, your order is confirmed</h1>
            <p className="mt-4">
              Your payment of <strong className="font-semibold text-ink">{formatPrice(receipt.amount)}</strong>{" "}
              has gone through. There is no receipt email on this store, so your PDF invoice has
              been saved to your downloads and kept under <em className="not-italic">My Orders</em>.
            </p>

            <dl className="mx-auto mt-8 max-w-sm space-y-2 border-y border-hairline py-6 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-body">Payment ID</dt>
                <dd className="font-mono text-ink">{receipt.paymentId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-body">Order ID</dt>
                <dd className="font-mono text-ink">{receipt.orderId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-body">Amount paid</dt>
                <dd className="font-semibold text-ink">{formatPrice(netPaid(receipt))}</dd>
              </div>
              {refunded && (
                <div className="flex justify-between gap-4">
                  <dt className="text-body">Refunded</dt>
                  <dd className="font-semibold text-body">
                    &minus;{formatPrice(receipt.amountRefunded)}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-8 border border-hairline p-6 text-left">
              <h2 className="flex items-center gap-2 font-display text-lg text-ink">
                <MessageCircle size={18} className="text-primary" aria-hidden="true" />
                What happens next
              </h2>
              <p className="mt-3 text-sm text-body">
                Our team will message you on{" "}
                {hasWhatsApp ? (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-ink underline underline-offset-4 hover:text-primary"
                  >
                    WhatsApp
                  </a>
                ) : (
                  <span className="font-semibold text-ink">WhatsApp</span>
                )}{" "}
                or{" "}
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-ink underline underline-offset-4 hover:text-primary"
                >
                  Instagram
                </a>{" "}
                within <strong className="font-semibold text-ink">{FULFILMENT_WINDOW}</strong> to
                confirm your order and send it out. Quote order {receipt.orderId} if you message us
                about anything.
              </p>
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => downloadInvoice(receipt)}
                className="primary-btn inline-flex w-full items-center justify-center gap-2 sm:w-auto"
              >
                <Download size={15} aria-hidden="true" />
                Download invoice (PDF)
              </button>

              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2 text-sm">
                <Link
                  to="/orders"
                  className="inline-flex items-center gap-1.5 text-body underline underline-offset-4 transition-colors hover:text-primary"
                >
                  <ReceiptText size={15} aria-hidden="true" />
                  My Orders
                </Link>
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-1.5 font-semibold text-primary underline underline-offset-4"
                >
                  Continue shopping
                </Link>
              </div>
            </div>

            <p className="mt-6 text-xs text-body">
              Saved to this browser only. If you switch device or clear your browser data, download
              the invoice now and keep the copy.
            </p>

            <p className="mt-6 flex items-center justify-center gap-2 text-xs text-body">
              <Camera size={14} aria-hidden="true" />
              Prefer Instagram? Message us at{" "}
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 hover:text-primary"
              >
                aurex.co.inn
              </a>
              .
            </p>
          </div>
        </section>
      </>
    );
  }

  if (count === 0) {
    return (
      <>
        <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Check Out" }]} />
        <section className="spad">
          <div className="container text-center">
            <h1 className="font-display text-3xl text-ink">Your cart is empty</h1>
            <p className="mt-3">Add something to your cart before checking out.</p>
            <Link to="/shop" className="primary-btn mt-7">
              Browse products
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Check Out" }]} />

      <section className="spad">
        <div className="container">
          <h1 className="mb-10 font-display text-3xl text-ink">Check Out</h1>

          {errorList.length > 0 && (
            <div
              id="checkout-errors"
              role="alert"
              className="mb-8 border-l-4 border-primary bg-surface px-6 py-5"
            >
              <h2 className="mb-2 text-sm font-bold text-ink">
                Please fix {errorList.length} field{errorList.length === 1 ? "" : "s"}:
              </h2>
              <ul className="list-inside list-disc space-y-1 text-sm text-body">
                {errorList.map(([key, message]) => (
                  <li key={key}>
                    <a href={`#${key}`} className="underline">
                      {message}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 className="mb-6 font-display text-xl text-ink">Billing details</h2>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="firstName" label="First name" value={form.firstName} onChange={set("firstName")} half />
                <Field id="lastName" label="Last name" value={form.lastName} onChange={set("lastName")} half />
                <Field id="email" label="Email" type="email" value={form.email} onChange={set("email")} />
                <Field id="phone" label="Phone" type="tel" value={form.phone} onChange={set("phone")} />
                <Field id="address" label="Address" value={form.address} onChange={set("address")} placeholder="Street address" />
                <div className="sm:col-span-2">
                  <label htmlFor="address2" className="mb-2 block text-sm font-semibold text-ink">
                    Apartment, suite, unit <span className="text-body">(optional)</span>
                  </label>
                  <input
                    id="address2"
                    value={form.address2}
                    onChange={set("address2")}
                    className="w-full border border-hairline-2 px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <Field id="city" label="Town / City" value={form.city} onChange={set("city")} half />
                <Field id="state" label="State" value={form.state} onChange={set("state")} half />
                <Field id="postcode" label="PIN code" value={form.postcode} onChange={set("postcode")} half />
                <div className="sm:col-span-2">
                  <label htmlFor="notes" className="mb-2 block text-sm font-semibold text-ink">
                    Order notes <span className="text-body">(optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={form.notes}
                    onChange={set("notes")}
                    placeholder="Notes about your order, e.g. special notes for delivery."
                    className="w-full border border-hairline-2 px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="border border-hairline p-7">
                <h2 className="mb-5 font-display text-xl text-ink">Your order</h2>

                <ul className="mb-5 divide-y divide-hairline border-b border-hairline">
                  {detailed.map((line) => (
                    <li key={`${line.id}-${line.size}`} className="flex justify-between gap-4 py-3 text-sm">
                      <span className="text-body">
                        {line.qty} &times; {line.product.name}
                        {line.size && <em className="not-italic text-body"> ({line.size})</em>}
                      </span>
                      <span className="shrink-0 font-semibold text-ink">{formatPrice(line.lineTotal)}</span>
                    </li>
                  ))}
                </ul>

                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between">
                    <span className="text-body">Subtotal</span>
                    <span className="font-semibold text-ink">{formatPrice(subtotal)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-body">Shipping</span>
                    <span className="font-semibold text-ink">
                      {shipping === 0 ? "Free" : formatPrice(shipping)}
                    </span>
                  </li>
                  <li className="flex justify-between border-t border-hairline pt-4 text-base">
                    <span className="font-bold text-ink">Total</span>
                    <span className="font-bold text-primary">{formatPrice(total)}</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 bg-secondary p-7 text-white">
                <h2 className="mb-4 font-display text-lg text-white">Payment method</h2>

                <div className="mb-5 grid grid-cols-2 gap-px bg-white/15 sm:grid-cols-4">
                  {METHODS.map((method) => (
                    <div key={method.label} className="bg-secondary px-3 py-4 text-center">
                      <method.icon size={20} className="mx-auto mb-2 text-primary" />
                      <span className="text-[11px] tracking-wider text-white/75 uppercase">
                        {method.label}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mb-5 flex gap-2 text-xs leading-6 text-white/70">
                  <Lock size={14} className="mt-1 shrink-0 text-primary" aria-hidden="true" />
                  You&apos;re taken to Razorpay&apos;s secure page to pay. Card and UPI details are entered
                  there, never on this site.
                </p>

                {paymentError && (
                  <p
                    role="alert"
                    className="mb-5 border-l-2 border-primary bg-white/5 px-4 py-3 text-xs leading-6 text-white/85"
                  >
                    {paymentError}
                  </p>
                )}

                <button type="submit" className="site-btn w-full" disabled={paying}>
                  {paying ? (
                    <>
                      <Loader2 size={14} className="mr-2 inline animate-spin" aria-hidden="true" />
                      Opening secure payment…
                    </>
                  ) : (
                    `Pay ${formatPrice(total)} securely`
                  )}
                </button>

                <p className="mt-4 text-center text-[11px] leading-5 text-white/50">
                  The amount is recalculated on the server from our catalogue, so the total you see is
                  the total you are charged.
                </p>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
