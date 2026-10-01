import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search } from "lucide-react";
import { PRODUCTS } from "../data/products";
import { formatPrice } from "../lib/money";

/**
 * Only mounted while the modal is open, so the query resets on close without
 * needing an effect to clear it.
 */
function SearchPanel({ onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const term = query.trim().toLowerCase();
  const results = term
    ? PRODUCTS.filter((p) => p.name.toLowerCase().includes(term) || p.category.includes(term))
    : [];

  const go = (to) => {
    onClose();
    navigate(to);
  };

  return (
    <div className="relative mt-24 w-[90%] max-w-3xl">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close search"
        className="absolute -top-12 right-0 cursor-pointer text-white transition-colors hover:text-primary"
      >
        <X size={28} />
      </button>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (term) go(`/shop?q=${encodeURIComponent(query.trim())}`);
        }}
        className="flex items-center gap-3 border-b-2 border-white pb-3"
      >
        <Search size={22} className="text-white/60" />
        <label htmlFor="search-input" className="sr-only">
          Search products
        </label>
        <input
          id="search-input"
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search here....."
          className="w-full bg-transparent text-lg text-white placeholder:text-white/50 focus:outline-none"
        />
      </form>

      {term && (
        <div className="mt-4 max-h-[45vh] overflow-y-auto bg-white">
          {results.length === 0 ? (
            <p className="p-5 text-sm text-body">No products match &ldquo;{query.trim()}&rdquo;.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {results.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => go(`/product/${product.id}`)}
                    className="flex w-full cursor-pointer items-center gap-4 p-3 text-left transition-colors hover:bg-surface"
                  >
                    <img src={product.image} alt="" className="h-14 w-14 shrink-0 object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {product.name}
                      </span>
                      <span className="text-xs text-body">
                        {product.category} · {formatPrice(product.price)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      inert={!open}
      className={`fixed inset-0 z-60 flex items-start justify-center transition-opacity duration-300 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
    >
      <div className="absolute inset-0 bg-black/70" onClick={onClose} role="presentation" />
      {open && <SearchPanel onClose={onClose} />}
    </div>
  );
}
