import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Star, Check, ShieldCheck, Truck, RotateCcw, ChevronRight } from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import ProductCard from "../components/ProductCard";
import QuantityStepper from "../components/QuantityStepper";
import { PRODUCTS, getProduct } from "../data/products";
import { useCart } from "../context/useCart";
import { formatPrice } from "../lib/money";

export default function ProductDetails() {
  const { id } = useParams();
  const product = getProduct(id);

  const { add } = useCart();
  const [size, setSize] = useState(product?.sizes[0] ?? "");
  const [color, setColor] = useState(product?.colors[0] ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <>
        <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Shop", to: "/shop" }, { label: "Not found" }]} />
        <section className="spad">
          <div className="container text-center">
            <h1 className="font-display text-3xl">Product not found</h1>
            <p className="mt-3">That product may have been removed or the link is out of date.</p>
            <Link to="/shop" className="primary-btn mt-7">
              Browse the shop
            </Link>
          </div>
        </section>
      </>
    );
  }

  const related = PRODUCTS.filter((p) => p.id !== product.id)
    .sort((a, b) => (a.category === product.category ? -1 : 1) - (b.category === product.category ? -1 : 1))
    .slice(0, 4);

  const handleAdd = () => {
    add(product.id, qty, size);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Home", to: "/" },
          { label: "Shop", to: "/shop" },
          { label: product.name },
        ]}
      />

      <section className="spad">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <div className="set-bg aspect-square w-full" style={{ backgroundImage: `url(${product.image})` }}>
                {product.sale && (
                  <span className="absolute top-5 left-5 bg-primary px-3 py-1.5 text-[11px] font-bold tracking-widest text-white uppercase">
                    Sale
                  </span>
                )}
              </div>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="set-bg aspect-square cursor-pointer border-2 border-primary/0 transition-colors hover:border-primary"
                    style={{ backgroundImage: `url(${product.image})` }}
                  />
                ))}
              </div>
            </div>

            <div>
              <h1 className="font-display text-3xl text-ink">{product.name}</h1>

              <div className="mt-3 flex items-center gap-3">
                <span className="flex items-center gap-0.5 text-primary" aria-label={`${product.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={14}
                      strokeWidth={1.5}
                      className={i < product.rating ? "fill-primary text-primary" : "text-hairline-2"}
                    />
                  ))}
                </span>
                <span className="text-sm text-body">{product.reviews} Reviews</span>
              </div>

              <h3 className="mt-5 text-2xl font-bold text-ink">{formatPrice(product.price)}</h3>
              <p className="mt-2 text-sm text-body">Inclusive of all taxes</p>

              <p className="mt-6 leading-7">{product.description}</p>

              {product.sizes.length > 1 && (
                <div className="mt-7">
                  <span className="mb-3 block text-sm font-semibold text-ink">Size</span>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSize(option)}
                        aria-pressed={size === option}
                        className={`min-w-12 cursor-pointer border px-4 py-2.5 text-sm font-semibold transition-colors ${
                          size === option
                            ? "border-primary bg-primary text-white"
                            : "border-hairline-2 text-body hover:border-primary"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-7">
                <span className="mb-3 block text-sm font-semibold text-ink">Color</span>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setColor(option)}
                      aria-pressed={color === option}
                      aria-label={option}
                      className={`h-9 w-9 cursor-pointer rounded-full border-2 capitalize transition-colors ${
                        color === option ? "border-primary" : "border-hairline-2"
                      }`}
                      style={{ backgroundColor: option === "khaki" ? "#bdb08a" : option }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <QuantityStepper value={qty} onChange={setQty} />
                <button
                  type="button"
                  onClick={handleAdd}
                  className="primary-btn flex-1 sm:flex-none"
                >
                  {added ? (
                    <>
                      Added <Check size={16} />
                    </>
                  ) : (
                    "Add To Cart"
                  )}
                </button>
              </div>

              <ul className="mt-9 space-y-3 border-t border-hairline pt-7 text-sm">
                <li className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-primary" /> Secure Razorpay checkout
                </li>
                <li className="flex items-center gap-3">
                  <Truck size={18} className="text-primary" /> Free delivery over ₹2,000
                </li>
                <li className="flex items-center gap-3">
                  <RotateCcw size={18} className="text-primary" /> 7-day easy returns
                </li>
              </ul>

              <dl className="mt-7 border-t border-hairline pt-7 text-sm">
                <div className="flex justify-between border-b border-hairline py-3">
                  <dt className="text-body">SKU</dt>
                  <dd className="font-semibold text-ink">{product.id.toUpperCase()}</dd>
                </div>
                <div className="flex justify-between border-b border-hairline py-3">
                  <dt className="text-body">Category</dt>
                  <dd className="font-semibold text-ink capitalize">{product.category}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="spad border-t border-hairline">
        <div className="container">
          <h2 className="mb-10 text-center font-display text-3xl text-ink">You may also like</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link to="/shop" className="primary-btn">
              View all products <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
