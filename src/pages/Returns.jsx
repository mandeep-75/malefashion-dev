import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";

export default function Returns() {
  const WINDOW_DAYS = 7;

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
          </div>

          <div className="mt-6 space-y-6">
            <p className="text-sm leading-7">
              You have {WINDOW_DAYS} days from delivery to raise a return or
              exchange request. Items must be unworn, in original condition, and
              returned with their original tags attached.
            </p>

            <p className="text-sm leading-7">
              Exchanges are subject to the requested size being in stock.
              Refunds are processed within 3–5 working days after the returned
              parcel reaches us.
            </p>

            <div className="flex items-start gap-3 border border-hairline bg-surface p-6">
              <ShieldCheck
                size={20}
                className="mt-1 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div>
                <h3 className="font-semibold text-ink">
                  How to raise a request
                </h3>
                <p className="mt-2 text-sm">
                  To raise a return or exchange, please contact us directly:
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>Call: +91 98200 31409</li>
                  <li>
                    Use the contact form:{" "}
                    <Link
                      to="/contact"
                      className="text-primary hover:underline"
                    >
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
