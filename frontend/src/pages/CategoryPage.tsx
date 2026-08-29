import { useStore } from "../store/store";
import ProductCard from "../components/ProductCard";

interface Props {
  category: "men" | "women" | "unisex" | "best-sellers";
}

const titles: Record<Props["category"], { heading: string; sub: string; tagline: string }> = {
  men: { heading: "For Men", sub: "Masculine · Commanding · Bold", tagline: "Fragrances that define presence." },
  women: { heading: "For Women", sub: "Elegant · Feminine · Timeless", tagline: "Fragrances that leave an impression." },
  unisex: { heading: "Unisex", sub: "Beyond Boundaries", tagline: "Crafted for all who wear it with confidence." },
  "best-sellers": { heading: "Best Sellers", sub: "Most Loved by Our Community", tagline: "The fragrances SOHO customers love most." },
};

export default function CategoryPage({ category }: Props) {
  const { state } = useStore();
  const filtered = category === "best-sellers"
    ? state.products.filter((p) => p.isBestSeller)
    : state.products.filter((p) => p.gender === category);

  const meta = titles[category];

  return (
    <div className="min-h-screen bg-ivory pt-16">
      <section className="bg-espresso py-20 px-6 text-center">
        <p className="text-xs tracking-[0.4em] text-champagne/60 uppercase mb-3">SOHO Fragrance</p>
        <h1 className="font-display text-5xl lg:text-6xl text-cream font-light">{meta.heading}</h1>
        <p className="text-cream/40 mt-3 text-sm tracking-widest uppercase">{meta.sub}</p>
        <p className="text-cream/30 mt-4 text-sm italic font-display">{meta.tagline}</p>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-muted-text">No fragrances in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
