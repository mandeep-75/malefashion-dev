import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { CATEGORIES, productsInCategory } from "../data/products";


/**
 * Hero copy sits directly on the photo, so the colour has to survive both the
 * light and the dark parts of the frame. Each slide picks its own mid-grey
 * once, here, rather than a runtime random() that would re-shuffle text colour
 * on every re-render and read as a bug.
 */
const HERO_SLIDES = [
  {
    image: "/img/hero/hero-1.png",
    tone: "text-legible",
    kicker: "THE NEW SEASON",
    title: "Timeless Style. Modern Essentials.",
    copy: "Thoughtfully designed menswear made for every season, every occasion, and every day.",
  },
  {
    image: "/img/hero/hero-2.png",
    tone: "text-legible-2",
    kicker: "New Arrivals",
    title: "Made for Modern Men.",
    copy: "Clean silhouettes, premium details and timeless pieces built for everyday life.",
  },
];

/** Deal countdown target. Set a real promo date, or remove the widget. */
const DEAL_ENDS = new Date("2026/12/31T23:59:59");

/**
 * Each banner sits on its own row of a 12-column grid, and the middle one is
 * mirrored (image left, text right). Order is expressed here because the two
 * halves swap places per position.
 *
 * Every class is `lg:`-prefixed on purpose: below 992px the whole 12-column
 * placement is dropped for a plain 2-up card grid (see Banner), so none of
 * these overrides leak into the mobile layout.
 */
const BANNER_POSITION = {
  "top-right": {
    card: "lg:col-start-5 lg:col-end-13 lg:row-start-1 lg:justify-start",
    image: "lg:order-2",
    content: "lg:order-1",
  },
  "middle-left": {
    card: "lg:col-start-1 lg:col-end-9 lg:row-start-2 lg:justify-end",
    image: "lg:order-1",
    content: "lg:order-2",
  },
  "bottom-right": {
    card: "lg:col-start-6 lg:col-end-13 lg:row-start-3 lg:justify-start",
    image: "lg:order-2",
    content: "lg:order-1",
  },
  "lower-left": {
    card: "lg:col-start-1 lg:col-end-9 lg:row-start-4 lg:justify-end",
    image: "lg:order-1",
    content: "lg:order-2",
  },
  "lowest-right": {
    card: "lg:col-start-6 lg:col-end-13 lg:row-start-5 lg:justify-start",
    image: "lg:order-2",
    content: "lg:order-1",
  },
};

function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target.getTime() - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: diff === 0,
  };
}

function Hero() {
  const [index, setIndex] = useState(0);
  const total = HERO_SLIDES.length;

  // Auto slide every 6 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, 6000);

    return () => clearInterval(id);
  }, [total]);

  const go = (nextIndex) => {
    setIndex((nextIndex + total) % total);
  };

  const slide = HERO_SLIDES[index];

  return (
    <section className="relative w-full overflow-hidden">
      <div
        className="relative flex min-h-[800px] w-full items-center bg-cover bg-center bg-no-repeat transition-[background-image] duration-[400ms] max-lg:min-h-[650px] max-md:min-h-[600px] max-md:bg-[position:65%_center]"
        style={{
          backgroundImage: `url(${slide.image})`,
        }}
      >
        <div className="container">
          <div className="md:w-2/3 lg:w-7/12 xl:w-5/12">
            {/* 80px top on desktop, 40px + 30px left on tablet, 100px/20px on
                mobile — three separate padding rules, so three overrides.
                Every word here sits on the photo, so all three blocks take the
                slide's own legible grey instead of theme colours that only
                work against a single background. */}
            <div className="relative z-[2] pt-20 max-lg:pt-10 max-lg:pl-[30px] max-md:px-5 max-md:pt-[100px]">
              <h6 className={`mb-5 text-[14px] font-bold tracking-[3px] uppercase max-md:text-[12px] max-md:tracking-[2px] ${slide.tone}`}>
                {slide.kicker}
              </h6>

              {/* The hero's largest word, sharing the CTA's navy so the two read as one
                  block against the photo. */}
              <h2 className="mb-[25px] text-[48px] leading-[1.2] font-bold text-primary max-lg:text-[40px] max-md:text-[32px]">
                {slide.title}
              </h2>

              {/* Bottom line of the hero block. Red rather than the slide's
                  grey, so it reads as the supporting detail next to the CTA. */}
              <p className="mb-[30px] max-w-[480px] text-[15px] leading-[1.8] text-shadow-primary shadow-amber-50 max-md:max-w-[350px] max-md:text-[14px]">
                {slide.copy}
              </p>

              {/* .primary-btn, with the hero's 2px tracking and 10px arrow gap;
                  the component itself is 4px. Background is the navy
                  secondary so the hero CTA is not the black default. */}
              <Link
                to="/shop"
                className="primary-btn inline-flex items-center gap-2.5 bg-secondary tracking-[2px] hover:bg-primary"
              >
                EXPLORE COLLECTION
                <ArrowRight size={20} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Previous slide"
          className="absolute top-1/2 left-[25px] z-[5] hidden h-[50px] w-[50px] -translate-y-1/2 cursor-pointer items-center justify-center border-0 bg-white/85 text-ink transition-all duration-300 hover:bg-ink hover:text-white max-lg:h-[42px] max-lg:w-[42px] md:flex"
        >
          <ChevronLeft size={30} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Next slide"
          className="absolute top-1/2 right-[25px] z-[5] hidden h-[50px] w-[50px] -translate-y-1/2 cursor-pointer items-center justify-center border-0 bg-white/85 text-ink transition-all duration-300 hover:bg-ink hover:text-white max-lg:h-[42px] max-lg:w-[42px] md:flex"
        >
          <ChevronRight size={30} aria-hidden="true" />
        </button>

        <div className="absolute bottom-[35px] left-1/2 z-[5] flex -translate-x-1/2 gap-2 max-md:bottom-5">
          {HERO_SLIDES.map((item, i) => (
            <button
              key={item.image}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              className={`h-[3px] cursor-pointer border-0 p-0 transition-all duration-300 ${
                i === index ? "w-[50px] bg-primary" : "w-[30px] bg-ink/35"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Banner() {
  const cards = [
    {
      image: "/img/product/product-1.jpg",
      title: "Black",
      position: "top-right",
    },
    {
      image: "/img/product/product-2.jpg",
      title: "White",
      position: "middle-left",
    },
    {
      image: "/img/product/product-3.jpg",
      title: "Blue",
      position: "bottom-right",
    },
    {
      image: "/img/product/product-4.jpg",
      title: "Maroon",
      position: "lower-left",
    },
    {
      image: "/img/product/product-5.jpg",
      title: "Red / White Sleeves",
      position: "lowest-right",
    },
  ];

  return (
    // Hidden below `lg`: the staggered 12-column layout needs the width, and
    // on phones this section just repeated the product grid underneath it.
    <section className="hidden bg-white py-spad lg:block max-[600px]:py-[50px]">
      <div className="container">
        {/*
          Two layouts, one set of markup.

          Below `lg` the staggered 12-column placement is meaningless, so the
          grid collapses to the same column counts and image height as
          ProductCard below it (1-up on phones, 2-up from `sm`, 260px tall) —
          that is what makes a banner photo line up with the product photo
          sitting under it. Each card stacks image-over-text and centres both,
          so no card depends on where it landed in the sequence.

          From `lg` the card turns horizontal again and BANNER_POSITION takes
          over the placement and half-order.
        */}
        <div className="grid grid-cols-1 items-start gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-12 lg:grid-rows-[repeat(5,180px)] lg:items-center lg:gap-x-[45px] lg:gap-y-0">
          {cards.map((card) => {
            const position = BANNER_POSITION[card.position];

            return (
              <div
                key={card.image}
                className={`group relative flex flex-col items-center text-center lg:flex-row lg:items-center lg:gap-[28px] lg:text-left ${position.card}`}
              >
                <div
                  className={`h-[260px] w-full shrink-0 overflow-hidden bg-surface sm:h-[260px] lg:h-[210px] lg:w-[270px] ${position.image}`}
                >
                  <img
                    src={card.image}
                    alt={card.title}
                    className="block h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                <div className={`mt-4 lg:mt-0 lg:min-w-[170px] ${position.content}`}>
                  <h2 className="text-[20px] leading-[1.25] font-bold text-ink sm:text-[22px] lg:text-[25px]">
                    {card.title}
                  </h2>

                  <Link
                    to="/shop"
                    className="mt-[14px] inline-block border-b-2 border-ink pb-[5px] text-[10px] leading-none font-bold tracking-[1.5px] text-ink uppercase transition-all duration-300 hover:border-primary hover:text-primary lg:text-[11px]"
                  >
                    Shop now
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProductSection() {
  const [category, setCategory] = useState("all");
  const products = productsInCategory(category);

  return (
    // Original `.product` overrode `.spad`: padding-top 0, padding-bottom 60px,
    // because the filter row sat directly under the banner. The banner is gone
    // below `lg`, so this section now needs its own top space there.
    <section className="pt-[50px] pb-[60px] lg:pt-0">
      <div className="container">
        {/* .filter__controls: 24px/700 uppercase, 88px gaps, 45px bottom. */}
        <ul className="mb-[45px] flex flex-wrap justify-center gap-x-[88px]">
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setCategory(c.id)}
                aria-pressed={category === c.id}
                className={`cursor-pointer text-2xl font-bold uppercase transition-colors ${
                  category === c.id ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {c.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DealCountdown() {
  const { days, hours, minutes, seconds, expired } = useCountdown(DEAL_ENDS);
  const units = [
    { value: days, label: "Days" },
    { value: hours, label: "Hours" },
    { value: minutes, label: "Minutes" },
    { value: seconds, label: "Seconds" },
  ];

  return (
    <div className="bg-secondary p-10 text-white">
      <span className="text-sm font-bold tracking-[0.2em] text-primary uppercase">Deal Of The Week</span>
      <h2 className="mt-3 font-display text-2xl text-white">Multi-pocket Chest Bag Black</h2>

      {expired ? (
        <p className="mt-6 text-sm text-white/70">This deal has ended. Check back soon.</p>
      ) : (
        <div className="mt-6 flex gap-4">
          {units.map((unit) => (
            <div key={unit.label} className="flex-1 bg-white/10 py-4 text-center">
              <span className="block font-display text-2xl text-white">
                {String(unit.value).padStart(2, "0")}
              </span>
              <p className="text-[11px] tracking-widest text-white/60 uppercase">{unit.label}</p>
            </div>
          ))}
        </div>
      )}

      <Link to="/product/cross-knit-black" className="primary-btn mt-8 bg-primary hover:bg-white hover:text-secondary">
        Shop now
      </Link>
    </div>
  );
}

function Categories() {
  return (
    // Original `.categories` overrode `.spad`: padding-top 150px, padding-bottom 125px.
    <section className="bg-surface pt-[150px] pb-[125px]">
      <div className="container">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <h2 className="font-display text-3xl leading-tight text-ink md:text-4xl">
              Clothings Hot <br />
              <span className="text-primary">Shoe Collection</span> <br />
              Accessories
            </h2>
          </div>
          <div className="lg:col-span-4">
            <div className="relative">
              <img src="/img/product-sale.png" alt="" className="w-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="text-xs font-bold tracking-[0.2em] text-body uppercase">Sale Of</span>
                <h5 className="font-display text-3xl text-primary">₹999</h5>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <DealCountdown />
          </div>
        </div>
      </div>
    </section>
  );
}

function Instagram() {
  const shots = Array.from({ length: 6 }, (_, i) => `/img/instagram/instagram-${i + 1}.jpg`);

  return (
    // Original `.instagram` overrode `.spad` with padding-bottom: 0.
    <section className="pt-[100px]">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="grid grid-cols-3 gap-3">
              {shots.map((shot) => (
                <a
                  key={shot}
                  href="https://www.instagram.com/aurex.co.inn/"
                  target="_blank"
                  rel="noreferrer"
                  className="set-bg block aspect-square transition-opacity hover:opacity-80"
                  style={{ backgroundImage: `url(${shot})` }}
                />
              ))}
            </div>
          </div>
          <div className="lg:col-span-4">
            <h2 className="font-display text-3xl text-ink">Instagram</h2>
            <p className="mt-4">
              Follow along for new arrivals, look books and behind-the-scenes from the studio.
            </p>
            <h3 className="mt-5 font-display text-xl text-primary">#aurex.co.inn</h3>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Banner />
      <ProductSection />
    </>
  );
}
