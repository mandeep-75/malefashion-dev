import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare, Package, Truck, RefreshCcw, ShieldCheck } from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import { PRODUCTS } from "../data/products";

/**
 * Return & Exchange requests run over messages, not a ticket form.
 *
 * There is no backend behind this yet — no orders table, no seller inbox, no
 * mail relay. So the thread below is seeded locally and the seller replies are
 * canned, on a timer, purely to show the shape of the conversation. The comment
 * next to each scripted reply marks it. Swap `scriptedReply` for a fetch to
 * api/ when the real thing lands.
 */

const STORAGE_KEY = "malefashion.returns.v1";

const STEPS = [
  {
    icon: Package,
    title: "You open a request",
    body: "Pick the order and what you want — a refund or a swap for another size. Tell us why, it speeds things up.",
  },
  {
    icon: MessageSquare,
    title: "The seller messages you",
    body: "A confirmation lands here first. Keep replying in the same thread; nothing is lost between messages.",
  },
  {
    icon: Truck,
    title: "You ship it back",
    body: "We'll send a prepaid label in the thread. Package it with the tag on and hand it to the courier.",
  },
  {
    icon: RefreshCcw,
    title: "Refund or exchange",
    body: "Refunds land 3–5 working days after the parcel reaches us. Exchanges ship the day your size is reserved.",
  },
];

const WINDOW_DAYS = 7;

/**
 * Canned seller replies, chosen by how far the conversation has got. Each is
 * keyed on the number of customer messages so far, which keeps the thread
 * moving without any backend.
 */
function scriptedReply(customerMessageCount) {
  switch (customerMessageCount) {
    case 1:
      return "Thanks for reaching out — I've got your request. Could you add a photo of the item and the size you need?";
    case 2:
      return "Prepaid label sent to your inbox, and we've reserved the replacement in your size for 5 days.";
    default:
      return "Got it — nothing else needed from you. We'll confirm as soon as the parcel is scanned.";
  }
}

const readThreads = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

let nextId = 0;
const makeId = () => `req-${Date.now().toString(36)}-${nextId++}`;

export default function Returns() {
  const [threads, setThreads] = useState(readThreads);
  const [draft, setDraft] = useState("");
  const [activeId, setActiveId] = useState(null);

  const active = threads.find((t) => t.id === activeId) ?? null;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    } catch {
      // Storage blocked or full. The thread still works for this session.
    }
  }, [threads]);

  // The scripted seller reply lands a beat after the customer sends, so the
  // thread reads like a conversation instead of an instant echo.
  useEffect(() => {
    if (!active) return;
    const last = active.messages.at(-1);
    if (!last || last.from !== "you" || last.responding) return;

    const id = setTimeout(() => {
      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id !== active.id) return thread;
          const mine = thread.messages.filter((m) => m.from === "you").length;
          return {
            ...thread,
            status: mine > 1 ? "label-sent" : "open",
            messages: [
              ...thread.messages,
              { from: "seller", text: scriptedReply(mine), at: Date.now() },
            ],
          };
        })
      );
    }, 900);

    return () => clearTimeout(id);
  }, [active]);

  const openRequest = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const productId = data.get("productId");
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;

    const thread = {
      id: makeId(),
      productId: product.id,
      productName: product.name,
      kind: data.get("kind"),
      reason: String(data.get("reason") ?? "").trim(),
      status: "open",
      createdAt: Date.now(),
      messages: [
        {
          from: "you",
          text: `I'd like to ${data.get("kind")} the ${product.name}${
            data.get("newSize") ? `, size ${data.get("newSize")}` : ""
          }. ${String(data.get("reason") ?? "").trim()}`,
          at: Date.now(),
        },
      ],
    };

    setThreads((prev) => [thread, ...prev]);
    setActiveId(thread.id);
    event.currentTarget.reset();
  };

  const sendMessage = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !active) return;

    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === active.id
          ? { ...thread, messages: [...thread.messages, { from: "you", text, at: Date.now() }] }
          : thread
      )
    );
    setDraft("");
  };

  const threadEnd = useRef(null);
  useEffect(() => {
    threadEnd.current?.scrollIntoView({ block: "nearest" });
  }, [active?.messages.length]);

  return (
    <>
      <Breadcrumb
        items={[{ label: "Home", to: "/" }, { label: "Return & Exchanges" }]}
      />

      <section className="spad">
        <div className="container">
          <div className="section-title">
            <span>Information</span>
            <h2>Return &amp; Exchange</h2>
            <p>
              Every request runs as a conversation. You talk to the seller, the seller talks
              back, and the whole thread stays on this page for reference.
            </p>
          </div>

          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <li key={step.title}>
                <step.icon size={26} strokeWidth={1.5} className="text-primary" aria-hidden="true" />
                <h3 className="mt-4 text-[17px] font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-7">{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-14 flex items-start gap-3 border border-hairline bg-surface p-6">
            <ShieldCheck size={20} className="mt-1 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm">
              You have {WINDOW_DAYS} days from delivery to open a request. Items should come
              back unworn with their tags attached. Exchanges are subject to the size being
              in stock — the seller will tell you in the thread if it isn&apos;t.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-spad">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-12">
            {/* Open a new request. */}
            <div className="lg:col-span-5">
              <h3 className="font-display text-xl text-ink">Open a request</h3>
              <p className="mt-2 text-sm">
                Tell us what happened and the seller will reply in the thread.
              </p>

              <form onSubmit={openRequest} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="return-product" className="block text-sm font-semibold text-ink">
                    Item
                  </label>
                  <select
                    id="return-product"
                    name="productId"
                    required
                    className="mt-1.5 w-full border border-hairline-2 bg-white px-4 py-3.5 text-sm focus:border-primary focus:outline-none"
                  >
                    {PRODUCTS.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <fieldset>
                  <legend className="text-sm font-semibold text-ink">What do you want?</legend>
                  <div className="mt-2 flex gap-4">
                    {["return", "exchange"].map((kind) => (
                      <label key={kind} className="flex items-center gap-2 text-sm capitalize">
                        <input
                          type="radio"
                          name="kind"
                          value={kind}
                          defaultChecked={kind === "return"}
                          className="accent-primary"
                        />
                        {kind}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="return-size" className="block text-sm font-semibold text-ink">
                    Exchange for size <span className="font-normal text-muted">(optional)</span>
                  </label>
                  <select
                    id="return-size"
                    name="newSize"
                    className="mt-1.5 w-full border border-hairline-2 bg-white px-4 py-3.5 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="">No change</option>
                    {["S", "M", "L", "XL"].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="return-reason" className="block text-sm font-semibold text-ink">
                    Reason
                  </label>
                  <textarea
                    id="return-reason"
                    name="reason"
                    rows={4}
                    placeholder="Wrong size, arrived damaged, changed your mind…"
                    className="mt-1.5 w-full resize-y border border-hairline-2 px-4 py-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <button type="submit" className="site-btn w-full sm:w-auto">
                  Start the conversation
                </button>
              </form>
            </div>

            {/* The threads. */}
            <div className="lg:col-span-7">
              <h3 className="font-display text-xl text-ink">Your messages</h3>

              {threads.length === 0 ? (
                <p className="mt-4 border border-dashed border-hairline-2 p-8 text-center text-sm">
                  No requests yet. Open one and the seller&apos;s reply appears here.
                </p>
              ) : (
                <>
                  {active && (
                    <ul className="mt-6 space-y-2">
                      {threads.map((thread) => (
                        <li key={thread.id}>
                          <button
                            type="button"
                            onClick={() => setActiveId(thread.id)}
                            aria-current={thread.id === activeId}
                            className={`w-full cursor-pointer border px-4 py-3 text-left transition-colors ${
                              thread.id === activeId
                                ? "border-primary bg-surface"
                                : "border-hairline hover:border-hairline-2"
                            }`}
                          >
                            <span className="block text-sm font-semibold text-ink">
                              {thread.productName}
                            </span>
                            <span className="block text-xs capitalize text-body">
                              {thread.kind} · {thread.status === "label-sent" ? "label sent" : "open"}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {active && (
                    <div className="mt-4 border border-hairline">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-hairline bg-surface px-5 py-3">
                        <h4 className="text-[15px] font-bold text-ink">{active.productName}</h4>
                        <p className="text-xs capitalize text-body">
                          {active.kind}
                          {active.status === "label-sent" ? " · label sent" : " · awaiting seller"}
                        </p>
                      </div>

                      <ul className="max-h-[420px] space-y-3 overflow-y-auto p-5">
                        {active.messages.map((message, i) => (
                          <li
                            key={i}
                            className={`flex ${message.from === "you" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] px-4 py-2.5 text-sm ${
                                message.from === "you"
                                  ? "bg-primary text-white"
                                  : "border border-hairline bg-white text-ink"
                              }`}
                            >
                              {message.text}
                            </div>
                          </li>
                        ))}
                        <li ref={threadEnd} aria-hidden="true" />
                      </ul>

                      <form
                        onSubmit={sendMessage}
                        className="flex border-t border-hairline"
                      >
                        <label htmlFor="return-reply" className="sr-only">
                          Reply to the seller
                        </label>
                        <input
                          id="return-reply"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          placeholder="Reply to the seller"
                          className="min-w-0 flex-1 px-4 py-3.5 text-sm focus:outline-none"
                        />
                        <button
                          type="submit"
                          aria-label="Send message"
                          className="cursor-pointer px-4 text-primary transition-colors hover:text-primary-dark"
                        >
                          <ArrowRight size={20} />
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}

              <p className="mt-4 text-xs text-muted">
                Seller replies on this page are scripted — there is no live inbox yet. For
                anything urgent, call +91 98200 31409 or use the{" "}
                <Link to="/contact" className="text-primary hover:underline">
                  contact form
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}