import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";

/**
 * Uses the design tokens and button classes shared by every other page rather
 * than raw Tailwind greys, so it sits in the same system as the storefront.
 */

const VALUES = [
  {
    title: "Who We Are",
    body: "A design-focused brand creating timeless menswear for people who value quality, comfort and effortless style.",
  },
  {
    title: "What We Do",
    body: "Everyday tees and versatile outerwear alongside carefully chosen accessories, curated to work season after season.",
  },
  {
    title: "Why Choose Us",
    body: "Quality over quantity, honest pricing and support that puts people first. No unnecessary complications.",
  },
];

const STATS = [
  { value: "Small", label: "Production runs" },
  { value: "2", label: "Studios" },
  { value: "INR", label: "Priced locally" },
];

export default function About() {
  return (
    <>
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "About Us" }]} />

      <section className="spad">
        <div className="container">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="overflow-hidden">
              <img
                src="/img/logo/logo.PNG"
                alt="The Male Fashion collection"
                className="h-full min-h-[420px] w-full object-cover"
              />
            </div>

            <div>
              <span className="block text-[14px] leading-none font-bold tracking-[2px] text-primary uppercase">
                About Our Brand
              </span>

              <h2 className="mt-[15px] text-[46px] leading-[1.15] font-bold text-ink max-lg:text-[38px] max-md:text-[30px]">
                Built for everyday life.
                <br />
                <span className="text-primary">Made to last.</span>
              </h2>

              <p className="mt-[25px] max-w-xl text-[16px] leading-[1.8] text-body max-md:text-[15px]">
                We believe great clothing should feel effortless. Our approach is simple —
                thoughtful design, dependable quality and timeless pieces that become part of
                your everyday wardrobe.
              </p>

              <p className="mt-4 max-w-xl text-[16px] leading-[1.8] text-body max-md:text-[15px]">
                From carefully selected fabrics to the smallest finishing details, every
                product is created with comfort, durability and real life in mind.
              </p>

              <Link to="/shop" className="primary-btn mt-[35px]">
                Explore Collection
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Numbers rather than an invented quote: every figure here is something
          the rest of the site already states. */}
      <section className="border-y border-hairline bg-surface py-16">
        <div className="container">
          <ul className="grid gap-8 text-center sm:grid-cols-3">
            {STATS.map((stat) => (
              <li key={stat.label}>
                <span className="block font-display text-3xl font-bold text-primary">
                  {stat.value}
                </span>
                <span className="mt-2 block text-[13px] tracking-[2px] text-body uppercase">
                  {stat.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="spad">
        <div className="container">
          <div className="section-title">
            <span>What We Stand For</span>
            <h2>More than just clothing</h2>
            <p>We focus on products and experiences that are simple, reliable and worth coming back to.</p>
          </div>

          <ul className="grid gap-8 md:grid-cols-3">
            {VALUES.map((value) => (
              <li key={value.title} className="border border-hairline bg-white p-8">
                <h3 className="font-display text-xl font-bold text-ink">{value.title}</h3>
                <p className="mt-4 text-[15px] leading-[1.8]">{value.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-secondary py-spad">
        <div className="container text-center">
          <span className="block text-[14px] font-bold tracking-[3px] text-white/60 uppercase">
            Our Philosophy
          </span>
          <h2 className="mx-auto mt-[15px] max-w-3xl text-[38px] leading-[1.2] font-bold text-white max-lg:text-[32px] max-md:text-[26px]">
            Good design should never have to shout.
          </h2>
          <p className="mx-auto mt-[25px] max-w-2xl text-[15px] leading-[1.8] text-white/70">
            We create understated pieces that fit naturally into your wardrobe — thoughtfully
            designed, carefully made and built to be worn again and again.
          </p>
        </div>
      </section>
    </>
  );
}