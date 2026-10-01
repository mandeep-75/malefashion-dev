import { Link, useLocation } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/useCart";

/**
 * Floating cart button, pinned to the bottom-right corner of the viewport.
 *
 * The header already carries a cart link, but the header one only shows from
 * `lg` up, so on phones and tablets there was no persistent way back to the
 * cart from a long product page. This covers that gap: `lg:hidden` keeps it off
 * desktop where the header link is visible, so the two never appear together.
 *
 * `z-[99]` puts it above page content, but the mobile drawer (`z-50`) must stay
 * above the button, so it hides itself whenever an overlay is open. That is
 * passed in rather than guessed at, since a cart button sitting on top of an
 * open dialog traps clicks and breaks `aria-modal`.
 */
export default function FloatingCartButton({ hidden = false }) {
  const { count } = useCart();
  const { pathname } = useLocation();

  // No point linking to the cart page while the cart page is on screen.
  if (hidden || pathname === "/cart") return null;

  return (
    <Link
      to="/cart"
      aria-label={`Shopping cart, ${count} item${count === 1 ? "" : "s"}`}
      className="fixed right-4 bottom-4 z-[99] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink lg:hidden"
    >
      <ShoppingCart size={24} strokeWidth={1.5} aria-hidden="true" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-secondary px-1.5 text-[11px] leading-none font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}