import { Link } from "react-router";
import { useStore, cartTotal } from "../store/store";
import { formatPKR } from "../data/products";

export default function Cart() {
  const { state, dispatch } = useStore();
  const total = cartTotal(state.cart);

  return (
    <div className="min-h-screen bg-ivory pt-16">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="font-display text-4xl text-dark-text mb-2">Your Collection</h1>
        <p className="text-xs text-muted-text tracking-[0.2em]">SOHO FRAGRANCE · SHOPPING CART</p>

        {state.cart.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-cream flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-champagne" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="font-display text-2xl text-dark-text mb-4">Your collection is empty</h2>
            <p className="text-muted-text mb-8">Discover the SOHO collection and find your signature scent.</p>
            <Link to="/collection" className="px-8 py-3 bg-burgundy text-cream text-xs tracking-[0.3em] uppercase font-semibold hover:bg-dark-burgundy transition-colors">
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {state.cart.map((item) => (
                <div key={`${item.productId}-${item.size}`} className="flex gap-4 p-4 bg-cream rounded-sm">
                  <img src={item.image} alt={item.name} className="w-20 h-24 object-cover rounded-sm flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display font-semibold text-dark-text">{item.name}</h3>
                        <p className="text-xs text-muted-text tracking-wider mt-0.5">By SOHO · {item.size}</p>
                      </div>
                      <button
                        onClick={() => dispatch({ type: "REMOVE_FROM_CART", productId: item.productId, size: item.size })}
                        className="text-muted-text hover:text-burgundy transition-colors"
                        aria-label="Remove item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-warm-taupe/30 rounded-sm">
                        <button onClick={() => dispatch({ type: "UPDATE_QTY", productId: item.productId, size: item.size, quantity: item.quantity - 1 })} className="w-8 h-8 flex items-center justify-center text-muted-text hover:text-dark-text">−</button>
                        <span className="w-8 text-center text-sm font-mono-custom">{item.quantity}</span>
                        <button onClick={() => dispatch({ type: "UPDATE_QTY", productId: item.productId, size: item.size, quantity: item.quantity + 1 })} className="w-8 h-8 flex items-center justify-center text-muted-text hover:text-dark-text">+</button>
                      </div>
                      <span className="font-mono-custom text-dark-text font-medium">{formatPKR(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-cream rounded-sm p-6 h-fit sticky top-24">
              <h3 className="font-display text-xl text-dark-text mb-6">Order Summary</h3>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-text">Subtotal</span>
                  <span className="font-mono-custom text-dark-text">{formatPKR(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-text">Shipping</span>
                  <span className="text-muted-text text-xs">{total >= 5000 ? "Free" : "Calculated at checkout"}</span>
                </div>
                {total >= 5000 && (
                  <div className="text-xs text-champagne tracking-wider">✓ Free shipping applied</div>
                )}
              </div>
              <div className="gold-line mb-4" />
              <div className="flex justify-between font-semibold mb-6">
                <span className="font-display text-dark-text">Total</span>
                <span className="font-mono-custom text-burgundy text-lg">{formatPKR(total)}</span>
              </div>
              <Link to="/checkout" className="block w-full py-3 bg-burgundy text-cream text-center text-xs tracking-[0.3em] uppercase font-semibold hover:bg-dark-burgundy transition-colors mb-3">
                Proceed to Checkout
              </Link>
              <Link to="/collection" className="block w-full py-2.5 border border-champagne text-champagne text-center text-xs tracking-[0.2em] uppercase hover:bg-champagne hover:text-dark-text transition-all">
                Continue Shopping
              </Link>
              <div className="mt-6 text-center">
                <p className="text-[10px] text-muted-text tracking-wider mb-2">Secure Payments</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {["JazzCash", "Easypaisa", "COD", "Bank"].map((pm) => (
                    <span key={pm} className="px-2 py-0.5 border border-warm-taupe/30 text-[9px] text-muted-text rounded-sm">{pm}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
