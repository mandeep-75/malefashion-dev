import { Minus, Plus } from "lucide-react";

export default function QuantityStepper({ value, onChange, min = 1, max = 99, size = "md" }) {
  const clamp = (n) => Math.min(Math.max(Math.floor(n) || min, min), max);
  const dim = size === "sm" ? "h-9 w-9" : "h-11 w-11";

  return (
    <div className="inline-flex items-center border border-hairline-2">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        className={`${dim} flex cursor-pointer items-center justify-center border-r border-hairline-2 text-ink transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-35`}
      >
        <Minus size={14} strokeWidth={2} />
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        aria-label="Quantity"
        onChange={(event) => onChange(clamp(Number(event.target.value)))}
        className={`${size === "sm" ? "w-12" : "w-14"} text-center text-sm font-semibold text-ink focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        className={`${dim} flex cursor-pointer items-center justify-center border-l border-hairline-2 text-ink transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-35`}
      >
        <Plus size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
