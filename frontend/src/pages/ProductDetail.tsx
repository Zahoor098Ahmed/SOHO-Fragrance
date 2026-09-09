import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { getProductBySlug, products, formatPKR, Product } from "../data/products";
import { useStore } from "../store/store";
import { useBrandStats } from "../context/BrandStatsContext";
import BottleVisual from "../components/BottleVisual";
import ProductCard from "../components/ProductCard";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { state, dispatch } = useStore();
  const product = ((state.products && state.products.find((p: any) => p.slug === slug || p.id === slug)) || getProductBySlug(slug || "")) as Product | undefined;
  const { getBottlesSoldForProduct } = useBrandStats();
  const navigate = useNavigate();

  const bottlesSold = product ? getBottlesSoldForProduct(product.id, product.name) : 0;

  if (!product) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center pt-16">
        <div className="text-center">
          <h1 className="font-display text-3xl text-dark-text mb-4">Fragrance not found</h1>
          <Link to="/collection" className="text-champagne hover:underline text-sm tracking-wider">
            Return to Collection
          </Link>
        </div>
      </div>
    );
  }

  const [size, setSize] = useState<"50ml" | "100ml">(() => {
    if (product.stock100ml > 0) return "100ml";
    if (product.stock50ml > 0) return "50ml";
    return "100ml";
  });
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<"notes" | "details" | "reviews">("notes");

  const [localReviews, setLocalReviews] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`soho_reviews_${product.id}`);
      if (saved) return JSON.parse(saved);
    } catch { }
    return [
      { name: "Ayesha K.", date: "Aug 2026", rating: 5, text: "Absolutely mesmerizing. The sillage is incredible and lasts all day. Worth every rupee!" },
      { name: "Hassan M.", date: "Aug 2026", rating: 5, text: "The packaging is as luxurious as the scent. Finally a Pakistani brand that matches international quality." },
      { name: "Sara A.", date: "Aug 2026", rating: 4, text: "Love the depth and complexity. Highly recommend for evening wear." },
    ];
  });
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState("");

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.user) return;
    const added = {
      name: state.user.name || "Anonymous User",
      date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      rating: newRating,
      text: newText,
    };
    const updated = [added, ...localReviews];
    setLocalReviews(updated);
    try {
      localStorage.setItem(`soho_reviews_${product.id}`, JSON.stringify(updated));
    } catch { }
    setNewText("");
    setNewRating(5);
  };

  const isWishlisted = state.wishlist.includes(product.id);
  const price = size === "50ml" ? product.price50ml : product.price100ml;
  const currentStock = size === "50ml" ? product.stock50ml : product.stock100ml;
  const isOutOfStock = currentStock <= 0;

  const currentCatalog = (state.products && state.products.length > 0 ? state.products : products);
  const related = currentCatalog.filter((p) => p.id !== product.id && (p.family === product.family || p.tags?.some((t: string) => product.tags?.includes(t)))).slice(0, 4);

  const handleAddToCart = () => {
    if (!state.user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (isOutOfStock) return;
    dispatch({
      type: "ADD_TO_CART",
      item: {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        size,
        price,
        image: product.image,
        quantity: qty,
        deliveryCharge: product.deliveryCharge ?? 0,
      },
    });
  };

  return (
    <div className="min-h-screen bg-ivory pt-16">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <nav className="text-xs text-muted-text tracking-wider" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-champagne">Home</Link>
          <span className="mx-2 opacity-40">/</span>
          <Link to="/collection" className="hover:text-champagne">Collection</Link>
          <span className="mx-2 opacity-40">/</span>
          <span className="text-dark-text">{product.name}</span>
        </nav>
      </div>

      {/* Main product */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Visuals */}
          <div className="sticky top-24">
            <div className="aspect-square rounded-sm overflow-hidden relative flex items-center justify-center bg-white border border-cream">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="pt-4">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-espresso text-champagne text-[9px] tracking-[0.2em] uppercase font-semibold flex items-center gap-1.5 border border-champagne/30 shadow-xs">
                <span>🔥</span>
                <span>{bottlesSold}+ Bottles Delivered</span>
              </span>
              {product.isBestSeller && (
                <span className="px-3 py-1 bg-champagne text-dark-text text-[9px] tracking-[0.2em] uppercase font-semibold shadow-xs">
                  Best Seller
                </span>
              )}
              {product.isNewArrival && (
                <span className="px-3 py-1 bg-burgundy text-cream text-[9px] tracking-[0.2em] uppercase font-semibold shadow-xs">
                  New Arrival
                </span>
              )}
            </div>

            <h1 className="font-display text-4xl lg:text-5xl font-semibold text-dark-text leading-tight">
              {product.name}
            </h1>
            <p className="text-xs tracking-[0.3em] text-muted-text mt-2">By SOHO · {product.family}</p>

            {/* Rating */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(product.rating) ? "fill-champagne" : "fill-cream stroke-champagne"}`} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-mono-custom text-dark-text">{product.rating}</span>
              <span className="text-xs text-muted-text">({product.reviews} reviews)</span>
              <span className="text-xs text-muted-text/60 font-mono">•</span>
              <span className="text-xs text-burgundy font-semibold font-mono flex items-center gap-1">
                <span>🔥</span>
                <span>{bottlesSold} Bottles Sold Across Pakistan</span>
              </span>
            </div>

            <p className="text-muted-text leading-relaxed mt-6 text-sm">{product.description}</p>

            <div className="gold-line my-8" />

            {/* Size selector */}
            <div className="mb-6">
              <p className="text-xs tracking-[0.2em] uppercase text-muted-text mb-3">Select Size</p>
              <div className="flex gap-3">
                {(["50ml", "100ml"] as const).map((s) => {
                  const sStock = s === "50ml" ? product.stock50ml : product.stock100ml;
                  const isSOut = sStock <= 0;
                  return (
                    <button
                      key={s}
                      disabled={isSOut}
                      onClick={() => setSize(s)}
                      className={`flex-1 py-3 text-sm font-medium rounded-sm border transition-all relative ${isSOut
                          ? "border-cream bg-cream/40 text-muted-text/40 cursor-not-allowed line-through"
                          : size === s
                            ? "bg-burgundy border-burgundy text-cream cursor-pointer"
                            : "border-warm-taupe/50 text-muted-text hover:border-champagne cursor-pointer"
                        }`}
                    >
                      <span className="block font-mono-custom">{s} {isSOut && "(Out of Stock)"}</span>
                      <span className="block text-xs mt-0.5 opacity-70">
                        {formatPKR(s === "50ml" ? product.price50ml : product.price100ml)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <p className="text-xs tracking-[0.2em] uppercase text-muted-text">Quantity</p>
              <div className="flex items-center border border-warm-taupe/40 rounded-sm">
                <button
                  disabled={isOutOfStock}
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-10 flex items-center justify-center text-muted-text hover:text-dark-text transition-colors text-lg"
                >
                  −
                </button>
                <span className="w-12 text-center font-mono-custom text-dark-text">{isOutOfStock ? 0 : qty}</span>
                <button
                  disabled={isOutOfStock}
                  onClick={() => setQty(qty + 1)}
                  className="w-10 h-10 flex items-center justify-center text-muted-text hover:text-dark-text transition-colors text-lg"
                >
                  +
                </button>
              </div>
              <span className="font-mono-custom text-2xl text-dark-text ml-auto">{formatPKR(price * (isOutOfStock ? 0 : qty))}</span>
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3 mb-4">
              <button
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className={`flex-1 py-4 text-xs tracking-[0.3em] uppercase font-semibold transition-colors rounded-sm ${isOutOfStock
                    ? "bg-cream text-muted-text/50 cursor-not-allowed border border-cream"
                    : "bg-burgundy text-cream hover:bg-espresso cursor-pointer"
                  }`}
              >
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>
              <button
                onClick={() => dispatch({ type: "TOGGLE_WISHLIST", productId: product.id })}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className={`w-14 flex items-center justify-center border transition-all rounded-sm cursor-pointer ${isWishlisted ? "bg-burgundy border-burgundy" : "border-warm-taupe/40 hover:border-champagne"
                  }`}
              >
                <svg className={`w-5 h-5 ${isWishlisted ? "fill-cream text-cream" : "fill-none text-muted-text"}`} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
            <button
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={`w-full py-3 text-xs tracking-[0.3em] uppercase font-semibold transition-all rounded-sm ${isOutOfStock
                  ? "bg-cream text-muted-text/50 cursor-not-allowed border border-cream"
                  : "border border-burgundy text-burgundy hover:bg-burgundy hover:text-cream cursor-pointer"
                }`}
            >
              {isOutOfStock ? "Out of Stock" : "Buy Now"}
            </button>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-3 mt-8">
              {[
                { label: "Longevity", value: product.longevity },
                { label: "Sillage", value: product.sillage },
                { label: "Family", value: product.family },
                { label: "Size", value: "50ml / 100ml" },
              ].map((spec) => (
                <div key={spec.label} className="p-3 bg-cream rounded-sm">
                  <div className="text-[9px] tracking-[0.2em] text-burgundy/80 uppercase font-semibold mb-1">{spec.label}</div>
                  <div className="text-sm text-dark-text font-medium">{spec.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notes tabs */}
      <section className="border-t border-cream">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
          <div className="flex gap-8 border-b border-cream mb-8">
            {(["notes", "details", "reviews"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-xs tracking-[0.2em] uppercase transition-all border-b-2 -mb-px ${activeTab === tab
                    ? "border-champagne text-dark-text"
                    : "border-transparent text-muted-text hover:text-dark-text"
                  }`}
              >
                {tab === "notes" ? "Fragrance Notes" : tab === "details" ? "Product Details" : "Reviews"}
              </button>
            ))}
          </div>

          {activeTab === "notes" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: "Top Notes", notes: product.topNotes, desc: "The opening impression" },
                { label: "Heart Notes", notes: product.heartNotes, desc: "The character" },
                { label: "Base Notes", notes: product.baseNotes, desc: "The lasting memory" },
              ].map((tier) => (
                <div key={tier.label} className="p-6 bg-cream rounded-sm">
                  <div className="w-8 h-px bg-champagne mb-4" />
                  <h3 className="font-display text-lg text-dark-text mb-1">{tier.label}</h3>
                  <p className="text-[10px] text-muted-text tracking-wider mb-4">{tier.desc}</p>
                  <ul className="space-y-2">
                    {tier.notes.map((n: string) => (
                      <li key={n} className="text-sm text-dark-text flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-champagne" />
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {activeTab === "details" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
              {[
                ["Brand", "SOHO Fragrance"],
                ["Concentration", "Eau de Parfum"],
                ["Gender", product.gender === "men" ? "Men" : product.gender === "women" ? "Women" : "Unisex"],
                ["Fragrance Family", product.family],
                ["Longevity", product.longevity],
                ["Sillage", product.sillage],
                ["Available Sizes", "50ml / 100ml"],
                ["Country of Origin", "Pakistan"],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between py-3 border-b border-cream">
                  <span className="text-xs text-muted-text tracking-wider">{label}</span>
                  <span className="text-xs text-dark-text font-medium">{val}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="max-w-2xl space-y-8">
              {/* Summary */}
              <div className="flex items-center gap-6 p-6 bg-cream rounded-sm">
                <div className="text-center">
                  <div className="font-display text-5xl text-dark-text">{product.rating}</div>
                  <div className="flex gap-0.5 justify-center mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg key={s} className={`w-3 h-3 ${s <= Math.round(product.rating) ? "fill-champagne" : "fill-cream stroke-champagne"}`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <div className="text-xs text-muted-text mt-1">{localReviews.length} reviews</div>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = localReviews.filter((r) => r.rating === star).length;
                    const pct = localReviews.length ? Math.round((count / localReviews.length) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs w-2 text-muted-text">{star}</span>
                        <div className="flex-1 h-1.5 bg-cream rounded-full overflow-hidden">
                          <div className="h-full bg-champagne rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-text w-6">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Write Review Form */}
              <div className="p-6 bg-cream border border-cream rounded-sm">
                <h3 className="font-display text-lg text-dark-text mb-4">Write a Review</h3>
                {state.user ? (
                  <form onSubmit={handleAddReview} className="space-y-4">
                    <div>
                      <label className="block text-xs text-muted-text tracking-wider uppercase mb-1.5 font-semibold">Select Rating</label>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setNewRating(star)}
                            className="focus:outline-none cursor-pointer"
                          >
                            <svg
                              className={`w-6 h-6 ${star <= newRating ? "fill-champagne text-champagne" : "fill-none text-muted-text"}`}
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.837-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-text tracking-wider uppercase mb-1.5 font-semibold">Review Text</label>
                      <textarea
                        required
                        rows={4}
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        placeholder="Share your thoughts about this fragrance..."
                        className="w-full px-4 py-3 bg-white border border-cream text-sm text-dark-text placeholder-muted-text/30 focus:outline-none focus:border-champagne rounded-sm resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-burgundy hover:bg-espresso text-cream text-xs tracking-wider uppercase font-semibold transition-colors rounded-sm cursor-pointer"
                    >
                      Submit Review
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-text">
                    Please{" "}
                    <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} className="text-burgundy font-semibold hover:underline">
                      Sign In
                    </Link>{" "}
                    to submit a review.
                  </div>
                )}
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {localReviews.map((review, i) => (
                  <div key={i} className="py-5 border-b border-cream last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-dark-text">{review.name}</span>
                      <span className="text-xs text-muted-text">{review.date}</span>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg key={s} className={`w-3 h-3 ${s <= review.rating ? "fill-champagne" : "fill-cream stroke-champagne"}`} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm text-muted-text leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-cream py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display text-3xl text-dark-text mb-8">You May Also Love</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
