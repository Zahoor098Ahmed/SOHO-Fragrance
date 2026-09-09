import { Link, useNavigate } from "react-router";
import type { Product } from "../data/products";
import { formatPKR } from "../data/products";
import { useStore } from "../store/store";
import { useBrandStats } from "../context/BrandStatsContext";

interface Props {
  product: Product;
  variant?: "light" | "dark";
}

export default function ProductCard({ product, variant = "light" }: Props) {
  const { state, dispatch } = useStore();
  const { getBottlesSoldForProduct } = useBrandStats();
  const navigate = useNavigate();
  const isWishlisted = state.wishlist.includes(product.id);
  const isDark = variant === "dark";

  const bottlesSold = getBottlesSoldForProduct(product.id, product.name);

  const handleAddToCart = () => {
    if (!state.user) {
      navigate("/login");
      return;
    }
    dispatch({
      type: "ADD_TO_CART",
      item: {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        size: "50ml",
        price: product.price50ml,
        image: product.image,
        quantity: 1,
        deliveryCharge: product.deliveryCharge || 0,
      },
    });
  };

  return (
    <div className={`group relative flex flex-col card-hover rounded-sm overflow-hidden ${isDark ? "bg-espresso" : "bg-ivory"}`}>
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
        {/* Real-time Bottles Sold Social Proof Badge */}
        <span className="px-2 py-0.5 bg-espresso/90 text-champagne text-[8px] tracking-wider uppercase font-semibold rounded-sm backdrop-blur-xs flex items-center gap-1 border border-champagne/30 shadow-xs">
          <span>🔥</span>
          <span>{bottlesSold}+ Sold</span>
        </span>

        {product.isBestSeller && (
          <span className="px-2 py-0.5 bg-champagne text-dark-text text-[8px] tracking-wider uppercase font-semibold rounded-sm shadow-xs">
            Best Seller
          </span>
        )}
        {product.isNewArrival && (
          <span className="px-2 py-0.5 bg-burgundy text-cream text-[8px] tracking-wider uppercase font-semibold rounded-sm shadow-xs">
            New Arrival
          </span>
        )}
      </div>

      {/* Wishlist */}
      <button
        onClick={() => dispatch({ type: "TOGGLE_WISHLIST", productId: product.id })}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm transition-all cursor-pointer"
      >
        <svg className={`w-4 h-4 ${isWishlisted ? "fill-burgundy text-burgundy" : "fill-none text-muted-text"}`} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {/* Image */}
      <Link to={`/product/${product.slug}`} className="block overflow-hidden aspect-[3/4] relative" aria-label={`View ${product.name}`}>
        <div className={`absolute inset-0 ${isDark ? "bg-espresso" : "bg-cream"}`} />
        <img
          src={product.image}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-sm text-dark-text font-semibold group-hover:text-burgundy transition-colors">
              <Link to={`/product/${product.slug}`}>{product.name}</Link>
            </h3>
            <p className="text-[10px] text-muted-text/80 uppercase tracking-widest">{product.family}</p>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 fill-champagne" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-mono-custom text-dark-text font-semibold">{product.rating}</span>
          </div>
        </div>

        {/* Bottles sold subtle counter */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-text">
          <span className="text-burgundy font-semibold">{bottlesSold} bottles delivered</span>
          <span>•</span>
          <span className="text-emerald-700 font-medium">In Stock</span>
        </div>

        <div className={`text-xs ${isDark ? "text-cream/40" : "text-muted-text/70"} font-mono-custom mt-auto pt-2`}>
          <span>{formatPKR(product.price50ml)}</span>
          <span className="mx-1.5 opacity-40">/</span>
          <span>{formatPKR(product.price100ml)}</span>
        </div>

        <button
          onClick={handleAddToCart}
          className={`mt-2 w-full py-2.5 text-[10px] tracking-[0.25em] uppercase font-semibold transition-all duration-200 rounded-sm cursor-pointer ${
            isDark
              ? "bg-champagne text-dark-text hover:bg-cream"
              : "bg-burgundy text-cream hover:bg-espresso"
          }`}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
