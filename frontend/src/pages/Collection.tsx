import { useState, useMemo } from "react";
import { useStore } from "../store/store";
import ProductCard from "../components/ProductCard";

type Filter = "All" | "Men" | "Women" | "Unisex" | "Oud" | "Woody" | "Amber" | "Floral" | "Fresh" | "Best Sellers" | "New Arrivals";

const filters: Filter[] = ["All", "Men", "Women", "Unisex", "Oud", "Woody", "Amber", "Floral", "Fresh", "Best Sellers", "New Arrivals"];

export default function Collection() {
  const { state } = useStore();
  const [active, setActive] = useState<Filter>("All");
  const [sort, setSort] = useState("featured");

  const filtered = useMemo(() => {
    let list = [...state.products];
    if (active === "Men") list = list.filter((p) => p.gender === "men");
    else if (active === "Women") list = list.filter((p) => p.gender === "women");
    else if (active === "Unisex") list = list.filter((p) => p.gender === "unisex");
    else if (active === "Best Sellers") list = list.filter((p) => p.isBestSeller);
    else if (active === "New Arrivals") list = list.filter((p) => p.isNewArrival);
    else if (active !== "All") list = list.filter((p) => p.tags.includes(active));

    if (sort === "price-asc") list.sort((a, b) => a.price50ml - b.price50ml);
    else if (sort === "price-desc") list.sort((a, b) => b.price50ml - a.price50ml);
    else if (sort === "rating") list.sort((a, b) => b.rating - a.rating);

    return list;
  }, [active, sort]);

  return (
    <div className="min-h-screen bg-ivory pt-16">
      {/* Header */}
      <section className="bg-espresso py-16 px-6 text-center">
        <p className="text-xs tracking-[0.4em] text-champagne/60 uppercase mb-3">SOHO Fragrance</p>
        <h1 className="font-display text-5xl lg:text-6xl text-cream font-light">The Collection</h1>
        <p className="text-cream/40 mt-4 text-sm tracking-wide">
          Twelve Expressions. One House.
        </p>
      </section>

      {/* Filters */}
      <div className="sticky top-16 z-30 bg-ivory/95 backdrop-blur-md border-b border-cream">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex overflow-x-auto gap-2 pb-1 flex-1" role="group" aria-label="Filter fragrances">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={`flex-shrink-0 px-4 py-1.5 text-xs tracking-[0.15em] uppercase rounded-sm transition-all ${
                  active === f
                    ? "bg-burgundy text-cream"
                    : "border border-warm-taupe/40 text-muted-text hover:border-champagne hover:text-dark-text"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-xs border border-warm-taupe/40 text-muted-text bg-transparent px-3 py-1.5 rounded-sm focus:outline-none focus:border-champagne flex-shrink-0"
            aria-label="Sort fragrances"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <p className="text-xs text-muted-text tracking-[0.1em] mb-6">{filtered.length} fragrance{filtered.length !== 1 ? "s" : ""}</p>
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-xl text-muted-text">No fragrances match this filter.</p>
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
