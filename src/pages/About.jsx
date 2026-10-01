import Breadcrumb from "../components/Breadcrumb";

export default function About() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: "Home", to: "/" },
          { label: "About Us" },
        ]}
      />

      {/* Hero Section */}
      <section className="spad">
        <div className="container">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            {/* Image */}
            <div className="group overflow-hidden rounded-2xl">
              <img
                src="/img/logo/logo.PNG"
                alt="Our collection"
                className="h-full min-h-[420px] w-full object-cover transition duration-700 group-hover:scale-105"
              />
            </div>

            {/* Content */}
            <div>
              <span className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">
                About Our Brand
              </span>

              <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
                Built for everyday life.
                <br />
                <span className="text-gray-500">Made to last.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-gray-600">
                We believe great clothing should feel effortless. Our approach
                is simple — thoughtful design, dependable quality and timeless
                pieces that become part of your everyday wardrobe.
              </p>

              <p className="mt-4 max-w-xl text-base leading-8 text-gray-600">
                From carefully selected fabrics to the smallest finishing
                details, every product is created with comfort, durability and
                real life in mind.
              </p>

              <a
                href="/shop"
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
              >
                Explore Collection
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="border-y border-gray-100 bg-gray-50 py-16">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">
              What We Stand For
            </span>

            <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
              More than just clothing
            </h2>

            <p className="mt-4 leading-7 text-gray-600">
              We focus on creating products and experiences that are simple,
              reliable and worth coming back to.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Card 1 */}
            <div className="rounded-2xl bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
                ✦
              </div>

              <h3 className="mt-6 font-display text-2xl text-ink">
                Who We Are
              </h3>

              <p className="mt-4 leading-7 text-gray-600">
                We are a design-focused brand creating timeless menswear for
                people who value quality, comfort and effortless style.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
                ◇
              </div>

              <h3 className="mt-6 font-display text-2xl text-ink">
                What We Do
              </h3>

              <p className="mt-4 leading-7 text-gray-600">
                From everyday tees and versatile outerwear to carefully chosen
                accessories, we curate essentials designed to work season after
                season.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
                ✓
              </div>

              <h3 className="mt-6 font-display text-2xl text-ink">
                Why Choose Us
              </h3>

              <p className="mt-4 leading-7 text-gray-600">
                Quality over quantity, honest pricing and customer support that
                puts people first. No unnecessary complications — just
                products made for real life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
     <section className="spad">
  <div className="container">
    <div className="rounded-3xl bg-[#111111] px-6 py-12 text-center sm:px-12 sm:py-16">
      
      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
        Our Philosophy
      </span>

      <h2
        className="mx-auto mt-5 max-w-3xl !text-3xl !font-semibold !leading-tight !text-white sm:!text-4xl lg:!text-5xl"
      >
        Good design should never have to shout.
      </h2>

      <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 !text-white/70 sm:text-base sm:leading-8">
        We create understated pieces that fit naturally into your wardrobe —
        thoughtfully designed, carefully made and built to be worn again and
        again.
      </p>

    </div>
  </div>
</section>

    </>
  );
}