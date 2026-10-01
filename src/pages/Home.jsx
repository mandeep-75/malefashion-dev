import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { CATEGORIES, productsInCategory } from "../data/products";


const HERO_SLIDES = [
  {
    image: "/img/hero/hero-1.png",
    kicker: "THE NEW SEASON",
    title: "Timeless Style. Modern Essentials.",
    copy: "Thoughtfully designed menswear made for every season, every occasion, and every day.",
  },
  {
    image: "/img/hero/hero-2.png",
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
 */
const BANNER_POSITION = {
  "top-right": {
    card: "col-start-5 col-end-13 row-start-1 justify-start",
    image: "order-2",
    content: "order-1",
  },
  "middle-left": {
    card: "col-start-1 col-end-9 row-start-2 justify-end max-[450px]:items-end",
    image: "order-1",
    content: "order-2",
  },
  "bottom-right": {
    card: "col-start-6 col-end-13 row-start-3 justify-start",
    image: "order-2",
    content: "order-1",
  },
  "lower-left": {
    card: "col-start-1 col-end-9 row-start-4 justify-end max-[450px]:items-end",
    image: "order-1",
    content: "order-2",
  },
  "lowest-right": {
    card: "col-start-6 col-end-13 row-start-5 justify-start",
    image: "order-2",
    content: "order-1",
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
                mobile — three separate padding rules, so three overrides. */}
            <div className="relative z-[2] pt-20 max-lg:pt-10 max-lg:pl-[30px] max-md:px-5 max-md:pt-[100px]">
              <h6 className="mb-5 text-[14px] font-bold tracking-[3px] text-primary uppercase max-md:text-[12px] max-md:tracking-[2px]">
                {slide.kicker}
              </h6>

              <h2 className="mb-[25px] text-[48px] leading-[1.2] font-bold text-ink max-lg:text-[40px] max-md:text-[32px]">
                {slide.title}
              </h2>

              <p className="mb-[30px] max-w-[480px] text-[15px] leading-[1.8] text-[#3d3d3d] max-md:max-w-[350px] max-md:text-[14px]">
                {slide.copy}
              </p>

              {/* .primary-btn, with the hero's 2px tracking and 10px arrow gap;
                  the component itself is 4px. */}
              <Link
                to="/shop"
                className="primary-btn inline-flex items-center gap-2.5 tracking-[2px]"
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
    <section className="bg-white py-spad max-lg:py-[70px] max-[600px]:py-[50px]">
      <div className="container">
        <div className="grid grid-cols-12 grid-rows-[repeat(5,180px)] items-center gap-x-[45px] max-lg:grid-cols-1 max-lg:grid-rows-none max-lg:gap-[45px]">
          {cards.map((card) => {
            const position = BANNER_POSITION[card.position];

            return (
              <div
                key={card.image}
                className={`group relative flex items-center gap-[28px] max-lg:col-auto max-lg:row-auto max-lg:justify-center max-lg:gap-[18px] max-[450px]:flex-col max-[450px]:items-start ${position.card}`}
              >
                <div
                  className={`h-[210px] w-[270px] shrink-0 overflow-hidden bg-surface max-lg:h-[220px] max-lg:w-[280px] max-[600px]:h-[160px] max-[600px]:w-[190px] max-[450px]:h-[220px] max-[450px]:w-full ${position.image}`}
                >
                  <img
                    src={card.image}
                    alt={card.title}
                    className="block h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                <div
                  className={`min-w-[170px] max-[600px]:min-w-[120px] ${position.content}`}
                >
                  <h2 className="text-[25px] leading-[1.25] font-bold text-ink max-lg:text-[22px] max-[600px]:text-[18px]">
                    {card.title}
                  </h2>

                  <Link
                    to="/shop"
                    className="mt-[14px] inline-block border-b-2 border-ink pb-[5px] text-[11px] leading-none font-bold tracking-[1.5px] text-ink uppercase transition-all duration-300 hover:border-primary hover:text-primary max-[600px]:text-[9px]"
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
    // because the filter row sits directly under the banner.
    <section className="pb-[60px]">
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
