import { Link } from "react-router-dom";
import { Heart, Camera } from "lucide-react";

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
  { to: "/returns", label: "Return & Exchanges" },
];

// Lucide carries no brand marks, so the social link is a wordmark in the
// footer bar rather than a plain text row buried under the logo.
const INSTAGRAM_URL = "https://www.instagram.com/aurex.co.inn/";

export default function Footer() {
  return (
    <footer className="bg-secondary text-white/70">
      <div className="container pt-[70px] pb-10">
        {/*
          Explicit fractions rather than a 12-column grid with `col-start`
          offsets. The old version pinned Shopping to column 5 and let
          Information auto-flow after it, leaving empty tracks on both sides and
          crowding the two link lists together in the middle. Fractions with one
          shared gap space the columns evenly and cannot drift when a list gains
          or loses a row.
        */}
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.8fr_1fr] lg:gap-x-[60px]">
          <div>
            <img src="/img/footer-logo.png" alt="Male Fashion" className="mb-[30px] w-[195px]" />
            <p className="max-w-xs text-sm leading-7">
              The customer is at the heart of our unique business model, which includes design.
            </p>

            <p className="mt-8 mb-3 text-[13px] tracking-widest text-white/50 uppercase">
              Accepted payment methods
            </p>
            <img src="/img/payment.png" alt="Accepted payment methods" className="max-w-[190px]" />
          </div>

          <div>
            <h6 className="mb-5 font-display text-[15px] font-bold tracking-widest text-white uppercase">
              Shopping
            </h6>
            <ul className="space-y-3.5 text-sm">
              {SHOPPING_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h6 className="mb-5 font-display text-[15px] font-bold tracking-widest text-white uppercase">
              Information
            </h6>
            <ul className="space-y-3.5 text-sm">
              {HELP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center gap-6 py-6 sm:flex-row sm:justify-between">
          {/* The only social link on the site, so it gets the whole left of the
              footer bar as a standalone mark rather than sitting in a list under
              the logo where it read as another footer link. */}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-2.5 text-sm font-bold tracking-[2px] text-white uppercase transition-colors hover:text-primary"
          >
            <Camera size={20} strokeWidth={1.5} aria-hidden="true" />
            Instagram
          </a>

          <div className="text-center sm:text-right">
            <p className="text-sm">
            Copyright © {COPYRIGHT_YEAR} Male Fashion. All rights reserved
            <Heart size={14} className="ml-1 inline align-text-bottom text-primary" aria-hidden="true" />
          </p>
          <p className="mt-2 text-xs text-white/45">
            Managed by{" "}
            <a
              href="https://github.com/mandeep-75"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-white/60 underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              github.com/mandeep-75
            </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
