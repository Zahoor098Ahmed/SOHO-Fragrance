import { Link } from "react-router";
import { useStore } from "../store/store";
import ProductCard from "../components/ProductCard";

export default function Wishlist() {
  const { state } = useStore();
  const wishlisted = state.products.filter((p) => state.wishlist.includes(p.id));

  return (
    <div className="min-h-screen bg-ivory pt-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <h1 className="font-display text-4xl text-dark-text mb-2">My Wishlist</h1>
        <p className="text-xs text-muted-text tracking-[0.2em] mb-10">SOHO FRAGRANCE · SAVED COLLECTION</p>

        {wishlisted.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-muted-text mb-4">Your wishlist is empty.</p>
            <Link to="/collection" className="text-champagne text-sm hover:underline tracking-wider">
              Explore the Collection →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {wishlisted.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
