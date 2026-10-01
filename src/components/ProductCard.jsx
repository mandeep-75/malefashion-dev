import { Link } from "react-router-dom";
import { Star, Eye, Check } from "lucide-react";
import { useState } from "react";
import { useCart } from "../context/useCart";
import { formatPrice } from "../lib/money";

function Rating({ value = 0 }) {
  return (
    <span className="flex items-center gap-0.5 text-primary" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={13}
          strokeWidth={1.5}
          className={i < value ? "fill-primary text-primary" : "text-hairline-2"}
        />
      ))}
    </span>
  );
}

export default function ProductCard({ product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    add(product.id, 1, product.sizes[0] ?? "");
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group relative">
      <div
        className="set-bg relative h-[260px] overflow-hidden"
        style={{ backgroundImage: `url(${product.image})` }}
      >
        {product.sale && (
          <span className="absolute top-0 left-0 z-10 bg-primary px-[15px] pt-1 pb-0.5 text-[11px] font-bold tracking-widest text-white uppercase">
            Sale
          </span>
        )}

        <ul className="absolute top-1/2 left-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <li>
            <Link
              to={`/product/${product.id}`}
              aria-label={`View ${product.name}`}
              className="flex h-11 w-11 items-center justify-center bg-white text-ink transition-colors hover:bg-primary hover:text-white"
            >
              <Eye size={18} strokeWidth={1.5} />
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={handleAdd}
              aria-label={`Add ${product.name} to cart`}
              className="flex h-11 items-center gap-2 bg-white px-4 text-xs font-bold tracking-widest text-ink uppercase transition-colors hover:bg-primary hover:text-white"
            >
              {added ? <Check size={16} strokeWidth={2} /> : "Add"}
            </button>
          </li>
        </ul>
      </div>

      <div className="pt-[25px] text-center">
        <h6 className="text-[15px] font-semibold">
          <Link to={`/product/${product.id}`} className="transition-colors hover:text-primary">
            {product.name}
          </Link>
        </h6>
        <div className="mt-2 flex justify-center">
          <Rating value={product.rating} />
        </div>
        <h5 className="mt-2 text-base font-bold text-ink">{formatPrice(product.price)}</h5>
        <button
          type="button"
          onClick={handleAdd}
          className="mt-3 cursor-pointer text-xs font-bold tracking-widest text-primary uppercase transition-colors hover:text-ink"
        >
          {added ? "Added ✓" : "+ Add To Cart"}
        </button>
      </div>
    </div>
  );
}
