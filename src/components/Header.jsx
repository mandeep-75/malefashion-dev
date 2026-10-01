import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingCart, X, ChevronDown } from "lucide-react";
import { useCart } from "../context/useCart";
import { formatPrice } from "../lib/money";

const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/shop", label: "Shop" },
];

const PAGES = [
  { to: "/about", label: "About Us" },
  { to: "/cart", label: "Shopping Cart" },
  { to: "/checkout", label: "Check Out" },
  { to: "/orders", label: "My Orders" },
];

function CartLink({ onNavigate, className = "" }) {
  const { count, subtotal } = useCart();
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <Link
        to="/cart"
        aria-label={`Shopping cart, ${count} item${count === 1 ? "" : "s"}`}
        onClick={onNavigate}
        className="relative flex items-center"
      >
        <ShoppingCart size={22} strokeWidth={1.5} className="text-ink" />
        <span className="absolute -top-2 left-4 bg-primary px-1.5 text-[11px] leading-5 font-bold text-white">
          {count}
        </span>
      </Link>
      <span className="text-sm font-semibold text-ink">{formatPrice(subtotal)}</span>
    </div>
  );
}

function SearchButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label="Search products" className="cursor-pointer">
      <Search size={22} strokeWidth={1.5} className="text-ink" />
    </button>
  );
}

export default function Header({ onOpenSearch }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  const { count } = useCart();
  const navigate = useNavigate();

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const close = () => setDrawerOpen(false);
  const go = (to) => {
    close();
    navigate(to);
  };

  return (
    <>
      <header className="border-b border-hairline bg-white">
        <div className="container">
          <div className="flex items-center justify-between gap-4 py-[30px]">
            <Link to="/" aria-label="Male Fashion home" onClick={close}>
              <img src="/img/logo.png" alt="Male Fashion" className="w-[210px]" />
            </Link>

            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="flex items-center gap-[45px]">
                {NAV.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `text-[15px] transition-colors ${
                          isActive
                            ? "border-b-2 border-primary pb-1 font-semibold text-ink"
                            : "pb-1 text-body hover:text-primary"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
                <li
                  className="relative"
                  onMouseEnter={() => setPagesOpen(true)}
                  onMouseLeave={() => setPagesOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setPagesOpen((v) => !v)}
                    aria-expanded={pagesOpen}
                    className="flex cursor-pointer items-center gap-1 pb-1 text-[15px] text-body transition-colors hover:text-primary"
                  >
                    Pages <ChevronDown size={15} />
                  </button>
                  {pagesOpen && (
                    <ul className="absolute top-full left-0 z-30 w-52 border border-hairline bg-white py-2 shadow-lg">
                      {PAGES.map((page) => (
                        <li key={page.to}>
                          <Link
                            to={page.to}
                            onClick={() => setPagesOpen(false)}
                            className="block px-5 py-2.5 text-sm text-body transition-colors hover:bg-surface hover:text-primary"
                          >
                            {page.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
                <li>
                  <NavLink
                    to="/contact"
                    className={({ isActive }) =>
                      `text-[15px] transition-colors ${
                        isActive
                          ? "border-b-2 border-primary pb-1 font-semibold text-ink"
                          : "pb-1 text-body hover:text-primary"
                      }`
                    }
                  >
                    Contacts
                  </NavLink>
                </li>
              </ul>
            </nav>

            <div className="flex items-center gap-5">
              <SearchButton onClick={onOpenSearch} />
              <CartLink className="hidden lg:flex" />
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                className="cursor-pointer lg:hidden"
              >
                <Menu size={24} strokeWidth={1.5} className="text-ink" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer - replaces the old slicknav jQuery plugin.
          `inert` while closed keeps the hidden panel out of the tab order and
          the accessibility tree; it stays mounted so the slide animation runs. */}
      <div
        inert={!drawerOpen}
        className={`fixed inset-0 z-50 transition-opacity duration-300 lg:hidden ${
          drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={close}
          role="presentation"
        />
        <div
          className={`absolute top-0 right-0 flex h-full w-[300px] max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ${
            drawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="flex items-center justify-between border-b border-hairline px-6 py-5">
            <img src="/img/logo.png" alt="Male Fashion" className="w-[150px]" />
            <button type="button" onClick={close} aria-label="Close menu" className="cursor-pointer">
              <X size={22} className="text-ink" />
            </button>
          </div>

          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-6 py-4">
            <ul className="space-y-1">
              {[...NAV, ...PAGES, { to: "/contact", label: "Contacts" }].map((item) => (
                <li key={item.to}>
                  <button
                    type="button"
                    onClick={() => go(item.to)}
                    className="w-full cursor-pointer py-3 text-left text-[15px] text-ink transition-colors hover:text-primary"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-hairline px-6 py-5">
            <div className="flex items-center justify-between">
              <SearchButton onClick={() => { close(); onOpenSearch(); }} />
              <CartLink onNavigate={close} />
            </div>
            <p className="mt-4 text-xs text-body">
              {count} item{count === 1 ? "" : "s"} in cart
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
