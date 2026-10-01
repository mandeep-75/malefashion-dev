import Breadcrumb from "../components/Breadcrumb";

export default function About() {
  return (
    <>
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "About Us" }]} />

      <section className="spad">
        <div className="container">
          <div className="mb-10">
            <img src="/img/about/about-us.jpg" alt="About us" className="w-full" />
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h4 className="font-display text-xl text-ink">Who We Are ?</h4>
              <p className="mt-3 leading-7">
                Contextual advertising programs sometimes have strict policies that need to be adhered to.
                We focus on building products that are built to last and made with intention.
              </p>
            </div>
            <div>
              <h4 className="font-display text-xl text-ink">What We Do ?</h4>
              <p className="mt-3 leading-7">
                We design and curate menswear essentials — think hard-wearing outerwear, everyday tees
                and accessories that look as good after five years of wear as they do on day one.
              </p>
            </div>
            <div>
              <h4 className="font-display text-xl text-ink">Why Choose Us</h4>
              <p className="mt-3 leading-7">
                We keep things simple: quality over quantity, transparent pricing and customer support
                that actually responds. Everything we sell is built for real life.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
