/**
 * Single source of truth for every product on the site.
 *
 * `price` is in paise. `razorpayLink` is your Razorpay Payment Link short URL
 * (Dashboard -> Payment Links). Leaving it empty deliberately disables payment
 * for that product instead of failing silently at the last step.
 */

export const PRODUCTS = [
  {
    id: "cross-knit-black",
    name: "Cross-Print Cropped Knit — Black",
    price: 65000,
    category: "knitwear",
    image: "/img/product/product-1.jpg",
    sale: false,
    description:
      "Black cropped long-sleeve knit with a graphic cross print on the chest. Boxy body, ribbed cuffs and hem, and a crew neck that sits close to the collarbone.",
    colors: ["black"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4,
    reviews: 12,
    razorpayLink: "",
  },
  {
    id: "cross-knit-white",
    name: "Cross-Print Cropped Knit — White",
    price: 65000,
    category: "knitwear",
    image: "/img/product/product-2.jpg",
    sale: false,
    description:
      "White cropped long-sleeve knit with the same cross graphic. Ribbed trim, boxy fit and a close crew neck.",
    colors: ["white"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4,
    reviews: 9,
    razorpayLink: "",
  },
  {
    id: "cross-knit-blue",
    name: "Cross-Print Cropped Knit — Blue",
    price: 65000,
    category: "knitwear",
    image: "/img/product/product-3.jpg",
    sale: false,
    description:
      "Blue cropped knit sweater with the cross motif. Slightly boxy through the body with long sleeves and ribbed edges.",
    colors: ["blue"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4,
    reviews: 7,
    razorpayLink: "",
  },
  {
    id: "cross-knit-maroon",
    name: "Cross-Print Cropped Knit — Maroon",
    price: 70000,
    category: "knitwear",
    image: "/img/product/product-4.jpg",
    sale: false,
    description:
      "Maroon cropped knit with the cross graphic. Cropped length, long sleeves, crew neck and ribbed cuffs that hold the sleeve in place.",
    colors: ["maroon"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4,
    reviews: 6,
    razorpayLink: "",
  },
  {
    id: "cross-knit-red-white-sleeve",
    name: "Cross-Print Cropped Knit — Red / White Sleeves",
    price: 70000,
    category: "knitwear",
    image: "/img/product/product-5.jpg",
    sale: false,
    description:
      "Red cropped knit with contrast white sleeves and the cross graphic across the chest. Boxy fit, ribbed trim and a crew neck.",
    colors: ["red", "white"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4,
    reviews: 15,
    razorpayLink: "",
  },
];

export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "knitwear", label: "Knitwear" },
];

export const getProduct = (id) => PRODUCTS.find((p) => p.id === id) ?? null;

export const productsInCategory = (category) =>
  category === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === category);