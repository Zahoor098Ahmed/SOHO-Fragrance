import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import { fetchProducts } from "../data/products";

import { useStore } from "../store/store";

export default function Root() {
  const { pathname } = useLocation();
  const { dispatch } = useStore();

  useEffect(() => {
    const load = async () => {
      const list = await fetchProducts();
      dispatch({ type: "SET_PRODUCTS", products: list });
    };
    load();
  }, []);

  useEffect(() => {
    const migrateLocalUsers = async () => {
      try {
        const saved = localStorage.getItem("soho_registered_users");
        if (saved) {
          const usersObj = JSON.parse(saved);
          const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
          
          for (const email of Object.keys(usersObj)) {
            const user = usersObj[email];
            await fetch(`${apiBase}/auth/migrate-user`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: user.name,
                email: email,
                password: user.password || "user123", // default fallback
                scentFamily: user.scentFamily || "Amber Woody"
              })
            });
          }
          localStorage.removeItem("soho_registered_users");
        }
      } catch (err) {
        console.error("Migration error:", err);
      }
    };
    migrateLocalUsers();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar />
      <CartDrawer />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
