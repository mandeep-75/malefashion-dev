import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="spad">
      <div className="container text-center">
        <p className="font-display text-6xl text-primary">404</p>
        <h1 className="mt-3 font-display text-3xl text-ink">Page not found</h1>
        <p className="mt-3">That page doesn&apos;t exist, or it may have moved.</p>
        <Link to="/" className="primary-btn mt-7">
          Back to home
        </Link>
      </div>
    </section>
  );
}
