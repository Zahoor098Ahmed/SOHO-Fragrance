import React, { createContext, useContext, useReducer } from "react";
import { products as initialProducts, fetchProducts } from "../data/products";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  size: "50ml" | "100ml";
  price: number;
  image: string;
  quantity: number;
  deliveryCharge?: number;
}

export interface User {
  id?: string;
  email: string;
  name: string;
  role: "user" | "admin" | "superadmin";
  token?: string;
  cart?: CartItem[];
  wishlist?: string[];
}

interface StoreState {
  cart: CartItem[];
  wishlist: string[];
  isCartOpen: boolean;
  user: User | null;
  products: any[];
}

type Action =
  | { type: "ADD_TO_CART"; item: CartItem }
  | { type: "REMOVE_FROM_CART"; productId: string; size: string }
  | { type: "UPDATE_QTY"; productId: string; size: string; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_CART" }
  | { type: "OPEN_CART" }
  | { type: "CLOSE_CART" }
  | { type: "TOGGLE_WISHLIST"; productId: string }
  | { type: "SET_USER"; user: User | null }
  | { type: "SET_PRODUCTS"; products: any[] }
  | { type: "LOGOUT" };

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existing = state.cart.find(
        (i) => i.productId === action.item.productId && i.size === action.item.size
      );
      if (existing) {
        return {
          ...state,
          isCartOpen: true,
          cart: state.cart.map((i) =>
            i.productId === action.item.productId && i.size === action.item.size
              ? { ...i, quantity: i.quantity + 1, deliveryCharge: action.item.deliveryCharge ?? i.deliveryCharge }
              : i
          ),
        };
      }
      return { ...state, isCartOpen: true, cart: [...state.cart, action.item] };
    }
    case "REMOVE_FROM_CART":
      return {
        ...state,
        cart: state.cart.filter(
          (i) => !(i.productId === action.productId && i.size === action.size)
        ),
      };
    case "UPDATE_QTY":
      if (action.quantity <= 0) {
        return {
          ...state,
          cart: state.cart.filter(
            (i) => !(i.productId === action.productId && i.size === action.size)
          ),
        };
      }
      return {
        ...state,
        cart: state.cart.map((i) =>
          i.productId === action.productId && i.size === action.size
            ? { ...i, quantity: action.quantity }
            : i
        ),
      };
    case "CLEAR_CART":
      try {
        localStorage.removeItem("soho_cart");
      } catch (_) {}
      return { ...state, cart: [] };
    case "TOGGLE_CART":
      return { ...state, isCartOpen: !state.isCartOpen };
    case "OPEN_CART":
      return { ...state, isCartOpen: true };
    case "CLOSE_CART":
      return { ...state, isCartOpen: false };
    case "TOGGLE_WISHLIST":
      return {
        ...state,
        wishlist: state.wishlist.includes(action.productId)
          ? state.wishlist.filter((id) => id !== action.productId)
          : [...state.wishlist, action.productId],
      };
    case "SET_USER": {
      if (action.user) {
        localStorage.setItem("soho_user", JSON.stringify(action.user));
        const emailKey = action.user.email.toLowerCase().trim();

        // Retrieve user's stored cart from localStorage or from server user object
        let userSavedCart: CartItem[] = [];
        try {
          const raw = localStorage.getItem(`soho_cart_${emailKey}`);
          if (raw) userSavedCart = JSON.parse(raw);
        } catch (_) {}

        if ((!userSavedCart || userSavedCart.length === 0) && Array.isArray(action.user.cart) && action.user.cart.length > 0) {
          userSavedCart = action.user.cart;
        }

        // Retrieve user's stored wishlist from localStorage or from server user object
        let userSavedWishlist: string[] = [];
        try {
          const raw = localStorage.getItem(`soho_wishlist_${emailKey}`);
          if (raw) userSavedWishlist = JSON.parse(raw);
        } catch (_) {}

        if ((!userSavedWishlist || userSavedWishlist.length === 0) && Array.isArray(action.user.wishlist) && action.user.wishlist.length > 0) {
          userSavedWishlist = action.user.wishlist;
        }

        // Merge in-memory cart with user saved cart
        const cartMap = new Map<string, CartItem>();
        userSavedCart.forEach((item) => cartMap.set(`${item.productId}_${item.size}`, item));
        state.cart.forEach((item) => {
          const k = `${item.productId}_${item.size}`;
          if (cartMap.has(k)) {
            const cur = cartMap.get(k)!;
            cartMap.set(k, { ...cur, quantity: Math.max(cur.quantity, item.quantity) });
          } else {
            cartMap.set(k, item);
          }
        });
        const finalCart = Array.from(cartMap.values());

        // Merge wishlist
        const finalWishlist = Array.from(new Set([...userSavedWishlist, ...state.wishlist]));

        try {
          localStorage.setItem("soho_cart", JSON.stringify(finalCart));
          localStorage.setItem(`soho_cart_${emailKey}`, JSON.stringify(finalCart));
          localStorage.setItem("soho_wishlist", JSON.stringify(finalWishlist));
          localStorage.setItem(`soho_wishlist_${emailKey}`, JSON.stringify(finalWishlist));
        } catch (_) {}

        return {
          ...state,
          user: action.user,
          cart: finalCart,
          wishlist: finalWishlist,
        };
      } else {
        localStorage.removeItem("soho_user");
        return { ...state, user: null };
      }
    }
    case "SET_PRODUCTS":
      try {
        localStorage.setItem("soho_cached_products", JSON.stringify(action.products));
      } catch (_) {}
      return { ...state, products: action.products };
    case "LOGOUT": {
      try {
        if (state.user?.email) {
          const emailKey = state.user.email.toLowerCase().trim();
          localStorage.setItem(`soho_cart_${emailKey}`, JSON.stringify(state.cart));
          localStorage.setItem(`soho_wishlist_${emailKey}`, JSON.stringify(state.wishlist));
        }
        localStorage.removeItem("soho_user");
        localStorage.removeItem("soho_cart");
        localStorage.removeItem("soho_wishlist");
      } catch (_) {}
      return { ...state, user: null, cart: [], wishlist: [] };
    }
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: StoreState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

const getInitialProducts = (): any[] => {
  try {
    const cached = localStorage.getItem("soho_cached_products");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return initialProducts;
};

const getInitialCart = (): CartItem[] => {
  try {
    const savedUser = localStorage.getItem("soho_user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user?.email) {
        const userSaved = localStorage.getItem(`soho_cart_${user.email.toLowerCase().trim()}`);
        if (userSaved) {
          const parsed = JSON.parse(userSaved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    }
    const saved = localStorage.getItem("soho_cart");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
    return [];
  } catch {
    return [];
  }
};

const getInitialWishlist = (): string[] => {
  try {
    const savedUser = localStorage.getItem("soho_user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user?.email) {
        const userSaved = localStorage.getItem(`soho_wishlist_${user.email.toLowerCase().trim()}`);
        if (userSaved) {
          const parsed = JSON.parse(userSaved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    }
    const saved = localStorage.getItem("soho_wishlist");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
    return [];
  } catch {
    return [];
  }
};

const getInitialUser = (): User | null => {
  try {
    const saved = localStorage.getItem("soho_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    cart: getInitialCart(),
    wishlist: getInitialWishlist(),
    isCartOpen: false,
    user: getInitialUser(),
    products: getInitialProducts(),
  });

  // Sync products from REST API on mount
  React.useEffect(() => {
    fetchProducts().then((loaded) => {
      if (loaded && Array.isArray(loaded) && loaded.length > 0) {
        dispatch({ type: "SET_PRODUCTS", products: loaded });
      }
    });
  }, []);

  // Keep localStorage and backend synced on every cart change
  React.useEffect(() => {
    try {
      localStorage.setItem("soho_cart", JSON.stringify(state.cart));
      if (state.user?.email) {
        const emailKey = state.user.email.toLowerCase().trim();
        localStorage.setItem(`soho_cart_${emailKey}`, JSON.stringify(state.cart));
      }
    } catch (_) {}

    if (state.user) {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const token = state.user.token || "";
      fetch(`${apiBase}/auth/sync-cart-wishlist`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          email: state.user.email,
          cart: state.cart
        })
      }).catch(() => {});
    }
  }, [state.cart, state.user]);

  // Keep localStorage and backend synced on every wishlist change
  React.useEffect(() => {
    try {
      localStorage.setItem("soho_wishlist", JSON.stringify(state.wishlist));
      if (state.user?.email) {
        const emailKey = state.user.email.toLowerCase().trim();
        localStorage.setItem(`soho_wishlist_${emailKey}`, JSON.stringify(state.wishlist));
      }
    } catch (_) {}

    if (state.user) {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const token = state.user.token || "";
      fetch(`${apiBase}/auth/sync-cart-wishlist`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          email: state.user.email,
          wishlist: state.wishlist
        })
      }).catch(() => {});
    }
  }, [state.wishlist, state.user]);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export const cartTotal = (cart: CartItem[]) =>
  cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

export const cartCount = (cart: CartItem[]) =>
  cart.reduce((sum, i) => sum + i.quantity, 0);

