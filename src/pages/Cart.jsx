import { Link } from "react-router-dom";
import { useState } from "react";
import { X, Trash2, ArrowRight } from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import QuantityStepper from "../components/QuantityStepper";
import { useCart } from "../context/useCart";
import { formatPrice } from "../lib/money";

const FREE_SHIPPING_OVER = 200000; // ₹2,000 in paise

export default function Cart() {
  const { detailed, subtotal, count, setQty, remove, clear } = useCart();
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState(null);

  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_OVER ? 0 : 9900;
  const total = subtotal + shipping;

  const applyCoupon = (event) => {
    event.preventDefault();
    // No backend exists for promotions yet, so never pretend a code worked.
    setCouponMsg(
      coupon.trim()
        ? "Coupon codes need a backend before they can be validated — none applied."
        : null
    );
  };

  if (count === 0) {
    return (
      <>
        <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Shopping Cart" }]} />
        <section className="spad">
          <div className="container text-center">
            <h1 className="font-display text-3xl text-ink">Your cart is empty</h1>
            <p className="mt-3">Nothing here yet. Have a look at what&apos;s new.</p>
            <Link to="/shop" className="primary-btn mt-7">
              Browse products <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Shopping Cart" }]} />

      <section className="spad">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-hairline text-left text-sm tracking-widest text-body uppercase">
                    <th className="pb-4 font-semibold">Product</th>
                    <th className="pb-4 font-semibold">Quantity</th>
                    <th className="pb-4 text-right font-semibold">Total</th>
                    <th className="pb-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {detailed.map((line) => (
                    <tr key={`${line.id}-${line.size}`} className="align-top">
                      <td className="py-6">
                        <div className="flex items-center gap-5">
                          <div
                            className="set-bg h-24 w-20 shrink-0"
                            style={{ backgroundImage: `url(${line.product.image})` }}
                          />
                          <div>
                            <h5 className="text-sm font-semibold">
                              <Link
                                to={`/product/${line.id}`}
                                className="transition-colors hover:text-primary"
                              >
                                {line.product.name}
                              </Link>
                            </h5>
                            {line.size && <p className="mt-1 text-xs text-body">Size: {line.size}</p>}
                            <p className="mt-1 text-xs text-body">
                              Unit price: {formatPrice(line.product.price)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6">
                        <QuantityStepper
                          value={line.qty}
                          onChange={(value) => setQty(line.index, value)}
                          size="sm"
                        />
                      </td>
                      <td className="py-6 text-right text-sm font-semibold text-ink">
                        {formatPrice(line.lineTotal)}
                      </td>
                      <td className="py-6 text-right">
                        <button
                          type="button"
                          onClick={() => remove(line.index)}
                          aria-label={`Remove ${line.product.name}`}
                          className="cursor-pointer text-hairline-2 transition-colors hover:text-primary"
                        >
                          <X size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <Link
                  to="/shop"
                  className="border-b border-ink pb-1 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
                >
                  Continue shopping
                </Link>
                <button
                  type="button"
                  onClick={clear}
                  className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-body transition-colors hover:text-primary"
                >
                  <Trash2 size={16} /> Clear cart
                </button>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="border border-hairline p-7">
                <h6 className="mb-4 font-display text-sm font-bold tracking-widest text-ink uppercase">
                  Discount codes
                </h6>
                <form onSubmit={applyCoupon} className="flex">
                  <label htmlFor="coupon" className="sr-only">
                    Coupon code
                  </label>
                  <input
                    id="coupon"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Coupon code"
                    className="min-w-0 flex-1 border border-hairline-2 px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                  <button type="submit" className="site-btn px-6">
                    Apply
                  </button>
                </form>
                {couponMsg && (
                  <p className="mt-3 border-l-2 border-primary bg-surface px-4 py-2 text-xs text-body">
                    {couponMsg}
                  </p>
                )}
              </div>

              <div className="mt-8 bg-surface p-7">
                <h6 className="mb-5 font-display text-sm font-bold tracking-widest text-ink uppercase">
                  Cart total
                </h6>
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
                  <li className="flex justify-between border-t border-hairline-2 pt-4 text-base">
                    <span className="font-bold text-ink">Total</span>
                    <span className="font-bold text-primary">{formatPrice(total)}</span>
                  </li>
                </ul>
                {subtotal < FREE_SHIPPING_OVER && (
                  <p className="mt-4 text-xs text-body">
                    Add {formatPrice(FREE_SHIPPING_OVER - subtotal)} more for free shipping.
                  </p>
                )}
                <Link to="/checkout" className="primary-btn mt-6 w-full justify-center">
                  Proceed to checkout
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
