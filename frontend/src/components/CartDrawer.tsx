import { Link } from "react-router";
import { useStore, cartTotal, cartCount } from "../store/store";
import { formatPKR } from "../data/products";

export default function CartDrawer() {
  const { state, dispatch } = useStore();
  const total = cartTotal(state.cart);
  const count = cartCount(state.cart);

  return (
    <>
      {/* Backdrop */}
      {state.isCartOpen && (
        <div
          className="fixed inset-0 z-50 bg-dark-burgundy/60 backdrop-blur-sm"
          onClick={() => dispatch({ type: "CLOSE_CART" })}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] z-50 bg-ivory flex flex-col transition-transform duration-400 ease-out ${
          state.isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Shopping cart"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-cream">
          <div>
            <h2 className="font-display text-lg font-semibold text-dark-text tracking-wide">Your Collection</h2>
            <p className="text-xs text-muted-text tracking-[0.1em] mt-0.5">{count} {count === 1 ? "piece" : "pieces"}</p>
          </div>
          <button
            onClick={() => dispatch({ type: "CLOSE_CART" })}
            aria-label="Close cart"
            className="w-8 h-8 flex items-center justify-center text-muted-text hover:text-burgundy transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {state.cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-champagne" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="font-display text-base text-dark-text">Your collection is empty</p>
              <p className="text-sm text-muted-text mt-2">Discover our fragrances</p>
              <Link
                to="/collection"
                onClick={() => dispatch({ type: "CLOSE_CART" })}
                className="mt-6 px-6 py-2 bg-burgundy text-cream text-xs tracking-[0.2em] uppercase hover:bg-dark-burgundy transition-colors"
              >
                Explore Collection
              </Link>
            </div>
          ) : (
            state.cart.map((item) => (
              <div key={`${item.productId}-${item.size}`} className="flex gap-3 p-3 bg-cream rounded-sm">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-20 object-cover rounded-sm flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-display text-sm font-semibold text-dark-text leading-tight">{item.name}</h4>
                      <p className="text-[10px] text-muted-text tracking-wider mt-0.5">By SOHO · {item.size}</p>
                    </div>
                    <button
                      onClick={() => dispatch({ type: "REMOVE_FROM_CART", productId: item.productId, size: item.size })}
                      aria-label="Remove item"
                      className="text-muted-text hover:text-burgundy transition-colors ml-2 flex-shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-warm-taupe/30 rounded-sm">
                      <button
                        onClick={() => dispatch({ type: "UPDATE_QTY", productId: item.productId, size: item.size, quantity: item.quantity - 1 })}
                        className="w-6 h-6 flex items-center justify-center text-muted-text hover:text-dark-text transition-colors text-sm"
                        aria-label="Decrease quantity"
                      >−</button>
                      <span className="w-6 text-center text-xs font-mono-custom text-dark-text">{item.quantity}</span>
                      <button
                        onClick={() => dispatch({ type: "UPDATE_QTY", productId: item.productId, size: item.size, quantity: item.quantity + 1 })}
                        className="w-6 h-6 flex items-center justify-center text-muted-text hover:text-dark-text transition-colors text-sm"
                        aria-label="Increase quantity"
                      >+</button>
                    </div>
                    <span className="text-sm font-mono-custom text-dark-text font-medium">
                      {formatPKR(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {state.cart.length > 0 && (
          <div className="px-6 py-5 border-t border-cream space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-text">Subtotal</span>
              <span className="font-mono-custom font-medium text-dark-text">{formatPKR(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-text">Shipping</span>
              <span className="text-xs text-muted-text">Calculated at checkout</span>
            </div>
            <div className="gold-line my-2" />
            <div className="flex justify-between font-semibold">
              <span className="text-dark-text font-display">Total</span>
              <span className="font-mono-custom text-burgundy">{formatPKR(total)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={() => dispatch({ type: "CLOSE_CART" })}
              className="block w-full py-3 bg-burgundy text-cream text-center text-xs tracking-[0.25em] uppercase font-semibold hover:bg-dark-burgundy transition-colors"
            >
              Proceed to Checkout
            </Link>
            <Link
              to="/cart"
              onClick={() => dispatch({ type: "CLOSE_CART" })}
              className="block w-full py-2.5 border border-champagne text-champagne text-center text-xs tracking-[0.2em] uppercase hover:bg-champagne hover:text-dark-text transition-all"
            >
              View Cart
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
