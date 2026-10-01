import { Link } from "react-router-dom";
import { useState } from "react";
import { Mail, Heart } from "lucide-react";

// Resolved once at module load, not on every render.
const COPYRIGHT_YEAR = new Date().getFullYear();

const SHOPPING_LINKS = [
  { to: "/shop", label: "Clothing Store" },
  { to: "/shop?category=knitwear", label: "Knitwear" },
  { to: "/product/cross-knit-red-white-sleeve", label: "New In" },
];

const HELP_LINKS = [
  { to: "/contact", label: "Contact Us" },
  { to: "/checkout", label: "Payment Methods" },
  { to: "/shop", label: "Delivery" },
  { to: "/shop", label: "Return & Exchanges" },
];

// Lucide carries no brand marks, so social links are text rather than glyphs.
const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/aurex.co.inn/" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="bg-secondary text-white/70">
      <div className="container pt-[70px] pb-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <img src="/img/footer-logo.png" alt="Male Fashion" className="mb-[30px] w-[195px]" />
            <p className="max-w-xs text-sm leading-7">
              The customer is at the heart of our unique business model, which includes design.
            </p>
            <img src="/img/payment.png" alt="Accepted payment methods" className="mt-6 max-w-[190px]" />

            <ul className="mt-6 flex flex-wrap gap-x-[18px] gap-y-2 text-sm">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 lg:col-start-5">
            <h6 className="mb-5 font-display text-[15px] font-bold tracking-widest text-white uppercase">
              Shopping
            </h6>
            <ul className="space-y-3 text-sm">
              {SHOPPING_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h6 className="mb-5 font-display text-[15px] font-bold tracking-widest text-white uppercase">
              Information
            </h6>
            <ul className="space-y-3 text-sm">
              {HELP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h6 className="mb-5 font-display text-[15px] font-bold tracking-widest text-white uppercase">
              Newsletter
            </h6>
            <p className="text-sm leading-7">
              Be the first to know about new arrivals, look books, sales &amp; promos!
            </p>
            {subscribed ? (
              <p className="mt-4 text-sm font-semibold text-primary">
                Thanks — you&apos;re on the list.
              </p>
            ) : (
              <form
                className="mt-5 flex border border-white/25"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (email.trim()) setSubscribed(true);
                }}
              >
                <label htmlFor="newsletter-email" className="sr-only">
                  Your email
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="cursor-pointer px-4 text-white transition-colors hover:text-primary"
                >
                  <Mail size={18} strokeWidth={1.5} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container py-6 text-center">
          <p className="text-sm">
            Copyright © {COPYRIGHT_YEAR} All rights reserved
            <Heart size={14} className="inline align-text-bottom text-primary" aria-hidden="true" /> by{" "}
          </p>
        </div>
      </div>
    </footer>
  );
}
