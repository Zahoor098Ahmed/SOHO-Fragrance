import React, { createContext, useContext, useReducer } from "react";
import { products as initialProducts } from "../data/products";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  size: "50ml" | "100ml";
  price: number;
  image: string;
  quantity: number;
}

export interface User {
  email: string;
  name: string;
  role: "user" | "admin" | "superadmin";
  token?: string;
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
              ? { ...i, quantity: i.quantity + 1 }
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
    case "SET_USER":
      if (action.user) {
        localStorage.setItem("soho_user", JSON.stringify(action.user));
      } else {
        localStorage.removeItem("soho_user");
      }
      return { ...state, user: action.user };
    case "SET_PRODUCTS":
      return { ...state, products: action.products };
    case "LOGOUT":
      localStorage.removeItem("soho_user");
      return { ...state, user: null, cart: [], wishlist: [] };
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: StoreState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

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
    cart: [],
    wishlist: [],
    isCartOpen: false,
    user: getInitialUser(),
    products: initialProducts,
  });
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

