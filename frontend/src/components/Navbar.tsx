import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useStore, cartCount } from "../store/store";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [banner, setBanner] = useState<{ message: string; link?: string; bgColor?: string; textColor?: string; isActive?: boolean } | null>(null);
  const { state, dispatch } = useStore();
  const count = cartCount(state.cart);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
        const res = await fetch(`${apiBase}/banners/active`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.isActive) {
            setBanner(data);
          }
        }
      } catch (err) {
        // Fallback banner if backend temporarily offline
        setBanner({
          message: "Complimentary nationwide delivery on orders above Rs. 5,000 | Handcrafted in Pakistan",
          link: "/collection",
          isActive: true
        });
      }
    };
    fetchBanner();
  }, []);

  const isDark =
    location.pathname === "/" ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/superadmin");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navBg = scrolled
    ? "bg-ivory/95 backdrop-blur-md shadow-sm"
    : isDark
    ? "bg-transparent"
    : "bg-ivory";

  const textColor = scrolled
    ? "text-dark-text"
    : isDark
    ? "text-cream"
    : "text-dark-text";

  const logoColor = scrolled
    ? "text-burgundy"
    : isDark
    ? "text-cream"
    : "text-burgundy";

  const accountLink = state.user
    ? state.user.role === "superadmin"
      ? "/superadmin"
      : state.user.role === "admin"
      ? "/admin"
      : "/account"
    : "/login";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}
        role="navigation"
        aria-label="Main navigation"
      >
        {banner && banner.isActive && !location.pathname.startsWith("/admin") && !location.pathname.startsWith("/superadmin") && (
          <aside
            style={{
              backgroundColor: banner.bgColor || "#1A1008",
              color: banner.textColor || "#E8D8C8",
            }}
            className="py-1.5 px-4 text-center text-[10px] sm:text-xs tracking-[0.15em] uppercase font-medium flex items-center justify-center gap-2 border-b border-champagne/15"
            aria-label="Announcement"
          >
            <span>{banner.message}</span>
            {banner.link && (
              <Link to={banner.link} className="underline underline-offset-2 hover:opacity-80 font-bold ml-1">
                Explore →
              </Link>
            )}
          </aside>
        )}
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className={`font-display font-semibold ${logoColor} transition-colors duration-300`} aria-label="SOHO Fragrance home">
            <div className="flex flex-col leading-none">
              <span className="text-xl tracking-[0.15em]">SOHO</span>
              <span className="text-[9px] tracking-[0.4em] font-sans font-light opacity-80">FRAGRANCE</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <ul className={`hidden lg:flex items-center gap-8 text-xs tracking-[0.2em] uppercase font-medium ${textColor}`}>
            <li><Link to="/collection" className="hover:text-champagne transition-colors">Collection</Link></li>
            <li><Link to="/men" className="hover:text-champagne transition-colors">Men</Link></li>
            <li><Link to="/women" className="hover:text-champagne transition-colors">Women</Link></li>
            <li><Link to="/unisex" className="hover:text-champagne transition-colors">Unisex</Link></li>
            <li><Link to="/best-sellers" className="hover:text-champagne transition-colors">Best Sellers</Link></li>
            <li><Link to="/about" className="hover:text-champagne transition-colors">About</Link></li>
          </ul>

          {/* Right icons */}
          <div className={`flex items-center gap-5 ${textColor}`}>
            <Link to="/wishlist" aria-label="Wishlist" className="relative hover:text-champagne transition-colors hidden sm:block">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {state.user && state.wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-burgundy text-cream text-[8px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono-custom">
                  {state.wishlist.length}
                </span>
              )}
            </Link>
            <Link to={accountLink} aria-label="Account" className="hover:text-champagne transition-colors hidden sm:block">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
            <button
              onClick={() => {
                if (!state.user) {
                  navigate("/login");
                } else {
                  dispatch({ type: "OPEN_CART" });
                }
              }}
              aria-label={`Cart with ${count} items`}
              className="relative hover:text-champagne transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {state.user && count > 0 && (
                <span className="absolute -top-2 -right-2 bg-champagne text-dark-text text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono-custom">
                  {count}
                </span>
              )}
            </button>
            {/* Mobile menu */}
            <button
              className="lg:hidden hover:text-champagne transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-dark-burgundy/98 flex flex-col pt-24 px-8">
          <nav className="flex flex-col gap-6">
            {[
              ["Collection", "/collection"],
              ["Men", "/men"],
              ["Women", "/women"],
              ["Unisex", "/unisex"],
              ["Best Sellers", "/best-sellers"],
              ["About", "/about"],
              ["Contact", "/contact"],
              ["Account", accountLink],
              ["Wishlist", "/wishlist"],
            ].map(([label, href]) => (
              <Link
                key={href}
                to={href}
                className="font-display text-2xl text-cream tracking-wide border-b border-cream/10 pb-4 hover:text-champagne transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
