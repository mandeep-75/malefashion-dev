import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Tag } from "lucide-react";
import ProductCard from "../components/ProductCard";
import Breadcrumb from "../components/Breadcrumb";
import { CATEGORIES, PRODUCTS } from "../data/products";

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "asc", label: "Price: Low To High" },
  { id: "desc", label: "Price: High To Low" },
  { id: "name", label: "Name: A to Z" },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") ?? "all";
  const query = params.get("q") ?? "";
  const [sort, setSort] = useState("featured");
  const [search, setSearch] = useState(query);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setParams(next, { replace: true });
  };

  const results = useMemo(() => {
    let list = PRODUCTS;

    if (category !== "all") {
      list = list.filter((p) => p.category === category);
    }

    const term = query.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(term) || p.category.includes(term)
      );
    }

    const sorted = [...list];
    if (sort === "asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [category, query, sort]);

  const countFor = (id) =>
    id === "all" ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === id).length;

  return (
    <>
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Shop" }]} />

      <section className="spad">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-12">
            {/* Sidebar */}
            <aside className="lg:col-span-3">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setParam("q", search.trim());
                }}
                className="mb-8 flex border border-hairline-2"
              >
                <label htmlFor="shop-search" className="sr-only">
                  Search products
                </label>
                <input
                  id="shop-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="min-w-0 flex-1 px-4 py-3 text-sm focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="cursor-pointer px-4 text-ink transition-colors hover:text-primary"
                >
                  <Search size={18} strokeWidth={1.5} />
                </button>
              </form>

              <div className="mb-8">
                <h6 className="mb-4 flex items-center gap-2 font-display text-sm font-bold tracking-widest text-ink uppercase">
                  <Tag size={15} /> Categories
                </h6>
                <ul className="space-y-3 text-sm">
                  {CATEGORIES.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setParam("category", c.id === "all" ? "" : c.id)}
                        className={`cursor-pointer transition-colors hover:text-primary ${
                          category === c.id ? "font-semibold text-primary" : "text-body"
                        }`}
                      >
                        {c.label} ({countFor(c.id)})
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h6 className="mb-4 font-display text-sm font-bold tracking-widest text-ink uppercase">
                  Price
                </h6>
                <p className="text-sm text-body">
                  All prices are in INR and include GST. Sort below to browse by price.
                </p>
              </div>
            </aside>

            {/* Grid */}
            <div className="lg:col-span-9">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-5">
                <p className="text-sm text-body">
                  Showing <span className="font-semibold text-ink">{results.length}</span> of{" "}
                  {PRODUCTS.length} products
                </p>
                <div className="flex items-center gap-3">
                  <label htmlFor="shop-sort" className="text-sm text-ink">
                    Sort by
                  </label>
                  <select
                    id="shop-sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="border border-hairline-2 bg-white px-4 py-2.5 text-sm font-semibold text-ink focus:border-primary focus:outline-none"
                  >
                    {SORTS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {results.length === 0 ? (
                <div className="border border-hairline px-6 py-16 text-center">
                  <p className="text-body">No products match your filters.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setParams(new URLSearchParams(), { replace: true });
                    }}
                    className="primary-btn mt-6"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
