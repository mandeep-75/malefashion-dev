import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function Breadcrumb({ items }) {
  return (
    <section className="set-bg bg-surface py-10 text-center" style={{ backgroundImage: "none" }}>
      <div className="container">
        <ul className="flex flex-wrap items-center justify-center gap-1.5 text-[15px] text-body">
          {items.map((item, i) => {
            const last = i === items.length - 1;
            return (
              <li key={item.label} className="flex items-center gap-1.5">
                {last || !item.to ? (
                  <span className="font-semibold text-ink">{item.label}</span>
                ) : (
                  <Link to={item.to} className="transition-colors hover:text-primary">
                    {item.label}
                  </Link>
                )}
                {!last && <ChevronRight size={14} className="text-hairline-2" />}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
