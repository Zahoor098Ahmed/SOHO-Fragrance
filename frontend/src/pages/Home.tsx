import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { products, formatPKR, Product } from "../data/products";
import ProductCard from "../components/ProductCard";
import BottleVisual from "../components/BottleVisual";
import { useStore } from "../store/store";
import { useBrandStats } from "../context/BrandStatsContext";

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const { state, dispatch } = useStore();
  const { stats } = useBrandStats();
  const allProducts = (state.products && state.products.length > 0 ? state.products : products) as Product[];
  const soverane = (allProducts.find((p) => p.slug === "soverane") || products.find((p) => p.slug === "soverane") || products[0]) as Product;
  const bestSellers = allProducts.filter((p) => p.isBestSeller).slice(0, 4) as Product[];

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 1800);
    const t2 = setTimeout(() => setHeroVisible(true), 2000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  return (
    <>
      {/* Loading screen */}
      <div className={`loading-screen ${loaded ? "hidden" : ""}`}>
        <div className="text-center">
          <div className="font-display text-5xl text-cream tracking-[0.2em] font-light mb-2">SOHO</div>
          <div className="text-[10px] tracking-[0.5em] text-champagne font-light">FRAGRANCE</div>
          <div className="mt-8 text-xs text-cream/30 tracking-[0.3em] italic font-display animate-pulse">
            ENTER THE WORLD OF SCENT
          </div>
          <div className="mt-8 flex justify-center">
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-champagne to-transparent animate-pulse" />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section
        className="relative min-h-screen hero-gradient flex items-center overflow-hidden"
        style={{ paddingTop: "4rem" }}
      >
        {/* Atmospheric background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-champagne/5 blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-muted-rose/5 blur-3xl" />
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(214,185,140,0.4) 1px, transparent 0)",
            backgroundSize: "48px 48px"
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-10 w-full py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — Text */}
          <div className={`transition-all duration-1000 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <p className="text-xs tracking-[0.4em] text-champagne uppercase mb-6 font-light">
              The Signature Collection
            </p>
            <h1 className="font-display text-6xl lg:text-8xl font-light text-cream leading-[0.9] mb-8">
              <span className="block">SCENT</span>
              <span className="block italic text-champagne">BECOMES</span>
              <span className="block">MEMORY.</span>
            </h1>
            <p className="text-sm text-cream/50 leading-relaxed max-w-sm mb-10 font-light tracking-wide">
              SOVÉRANE — the signature expression of SOHO. A sophisticated amber composition created to become your unmistakable presence.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/product/soverane"
                className="px-8 py-3 bg-champagne text-dark-text text-xs tracking-[0.3em] uppercase font-semibold hover:bg-cream transition-colors"
              >
                Discover Sovérane
              </Link>
              <Link
                to="/collection"
                className="px-8 py-3 border border-cream/30 text-cream text-xs tracking-[0.3em] uppercase hover:border-champagne hover:text-champagne transition-colors"
              >
                Explore Collection
              </Link>
            </div>

            {/* Dynamic Social Proof Stats */}
            <div className="flex flex-wrap gap-6 sm:gap-8 mt-12 pt-8 border-t border-cream/10">
              {[
                { value: `${stats.totalCustomers.toLocaleString()}+`, label: "Happy Customers" },
                { value: `${stats.repeatCustomers.toLocaleString()}+`, label: "Repeat Patrons" },
                { value: `${stats.totalBottlesSold.toLocaleString()}+`, label: "Bottles Delivered" },
                { value: "12", label: "Artisanal Blends" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-display text-xl sm:text-2xl text-champagne font-light">{stat.value}</div>
                  <div className="text-[9px] sm:text-[10px] text-cream/50 tracking-[0.18em] uppercase mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Bottle */}
          <div className={`flex justify-center items-center transition-all duration-1200 delay-300 ${heroVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            <div className="relative">
              {/* Glow behind bottle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-64 rounded-full bg-champagne/10 blur-3xl" />
              </div>
              <BottleVisual
                bottleColor={soverane.bottleColor}
                capColor={soverane.bottleCapColor}
                liquidColor={soverane.liquidColor}
                size={340}
                animate
              />
              {/* Notes floating around */}
              <div className="absolute top-12 -right-16 text-right hidden lg:block">
                <div className="text-[9px] tracking-[0.3em] text-champagne/60 uppercase mb-1">Top Notes</div>
                {soverane.topNotes.map((n) => (
                  <div key={n} className="text-xs text-cream/40 font-light">{n}</div>
                ))}
              </div>
              <div className="absolute bottom-16 -left-16 hidden lg:block">
                <div className="text-[9px] tracking-[0.3em] text-champagne/60 uppercase mb-1">Base Notes</div>
                {soverane.baseNotes.slice(0, 3).map((n) => (
                  <div key={n} className="text-xs text-cream/40 font-light">{n}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-[9px] tracking-[0.3em] text-cream/30 uppercase">Scroll</span>
          <svg className="w-4 h-4 text-cream/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Brand statement */}
      <section className="bg-ivory py-20 text-center px-6">
        <div className="max-w-3xl mx-auto">
          <div className="section-divider mb-8" />
          <p className="font-display text-3xl lg:text-4xl text-dark-text font-light leading-relaxed italic">
            "Crafted for those who leave a lasting impression."
          </p>
          <div className="section-divider mt-8" />
          <p className="text-xs tracking-[0.3em] text-muted-text uppercase mt-6">SOHO Fragrance · Karachi, Pakistan</p>
        </div>
      </section>

      {/* Social Proof & Brand Trust Milestones Section */}
      <section className="bg-espresso text-cream py-16 px-6 relative overflow-hidden border-y border-champagne/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-champagne/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-[0.25em] uppercase bg-champagne/10 text-champagne border border-champagne/30 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-champagne animate-pulse" />
              Proven Heritage & Connoisseur Trust
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-cream font-light tracking-wide">
              Trusted by Thousands. Cherished Repeatedly.
            </h2>
            <p className="text-xs sm:text-sm text-cream/60 mt-3 font-light leading-relaxed">
              Our high-concentration Extrait de Parfum formulations have won the loyalty of perfume lovers nationwide.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white/5 border border-cream/10 p-6 rounded-sm text-center backdrop-blur-xs hover:border-champagne/40 transition-colors">
              <div className="font-display text-3xl sm:text-4xl text-champagne font-bold tracking-tight">
                {stats.totalCustomers.toLocaleString()}+
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-cream/90 font-semibold mt-2">
                Valued Customers
              </div>
              <p className="text-[11px] text-cream/50 mt-1">Patrons nationwide across Pakistan</p>
            </div>

            <div className="bg-white/5 border border-cream/10 p-6 rounded-sm text-center backdrop-blur-xs hover:border-champagne/40 transition-colors">
              <div className="font-display text-3xl sm:text-4xl text-champagne font-bold tracking-tight">
                {stats.repeatCustomers.toLocaleString()}+
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-cream/90 font-semibold mt-2">
                Repeat Connoisseurs
              </div>
              <p className="text-[11px] text-cream/50 mt-1">{stats.repeatRate} repurchase rate</p>
            </div>

            <div className="bg-white/5 border border-cream/10 p-6 rounded-sm text-center backdrop-blur-xs hover:border-champagne/40 transition-colors">
              <div className="font-display text-3xl sm:text-4xl text-champagne font-bold tracking-tight">
                {stats.totalBottlesSold.toLocaleString()}+
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-cream/90 font-semibold mt-2">
                Bottles Delivered
              </div>
              <p className="text-[11px] text-cream/50 mt-1">Handcrafted & verified formulations</p>
            </div>

            <div className="bg-white/5 border border-cream/10 p-6 rounded-sm text-center backdrop-blur-xs hover:border-champagne/40 transition-colors">
              <div className="font-display text-3xl sm:text-4xl text-champagne font-bold tracking-tight">
                12
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-cream/90 font-semibold mt-2">
                Artisanal Blends
              </div>
              <p className="text-[11px] text-cream/50 mt-1">Extrait de Parfum concentration</p>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="bg-cream py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] text-champagne uppercase mb-3">Most Loved</p>
            <h2 className="font-display text-4xl lg:text-5xl text-dark-text font-light">Best Sellers</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/collection" className="inline-block px-8 py-3 bg-burgundy text-cream text-xs tracking-[0.3em] uppercase font-semibold hover:bg-espresso transition-colors rounded-sm">
              View All 12 Fragrances
            </Link>
          </div>
        </div>
      </section>

      {/* The Collection — cinematic dark section */}
      <section className="bg-espresso py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.4em] text-champagne/60 uppercase mb-4">Twelve Expressions. One House.</p>
            <h2 className="font-display text-4xl lg:text-6xl text-cream font-light">The SOHO Collection</h2>
          </div>

          {/* Horizontal scroll */}
          <div className="overflow-x-auto collection-scroll -mx-6 px-6">
            <div className="flex gap-4 pb-4" style={{ width: "max-content" }}>
              {allProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.slug}`}
                  className="group relative w-52 flex-shrink-0 overflow-hidden rounded-sm"
                  style={{ background: `${product.bgAccent}40` }}
                >
                  <div className="aspect-[2/3] relative overflow-hidden bg-espresso/40">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3 bg-espresso/80">
                    <h3 className="font-display text-sm text-cream font-semibold tracking-wider">{product.name}</h3>
                    <p className="text-[9px] tracking-[0.25em] text-champagne/60 mt-0.5">By SOHO</p>
                    <p className="text-[10px] text-cream/40 mt-1">{product.family}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Fragrance journey */}
      <section className="bg-ivory py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs tracking-[0.3em] text-champagne uppercase mb-4">The Signature</p>
            <h2 className="font-display text-4xl lg:text-5xl text-dark-text font-light mb-6">
              SOVÉRANE<br /><span className="italic text-muted-text">By SOHO</span>
            </h2>
            <p className="text-muted-text leading-relaxed mb-8">
              {soverane.description} With top notes of Bergamot, Saffron and Black Pepper, opening into a heart of Jasmine, Orris and Rose — anchored by Amber, Oud, Vanilla and Musk.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Top", notes: soverane.topNotes },
                { label: "Heart", notes: soverane.heartNotes },
                { label: "Base", notes: soverane.baseNotes },
              ].map((tier) => (
                <div key={tier.label} className="p-4 bg-cream rounded-sm">
                  <div className="text-[9px] tracking-[0.25em] text-champagne uppercase mb-2">{tier.label}</div>
                  {tier.notes.map((n) => (
                    <div key={n} className="text-xs text-muted-text">{n}</div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mb-8">
              <span className="font-mono-custom text-2xl text-dark-text">{formatPKR(soverane.price50ml)}</span>
              <span className="text-muted-text text-xs">50ml · {formatPKR(soverane.price100ml)} / 100ml</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => dispatch({
                  type: "ADD_TO_CART",
                  item: { productId: soverane.id, slug: soverane.slug, name: soverane.name, size: "100ml", price: soverane.price100ml, image: soverane.image, quantity: 1, deliveryCharge: soverane.deliveryCharge ?? 0 }
                })}
                className="px-8 py-3 bg-burgundy text-cream text-xs tracking-[0.3em] uppercase font-semibold hover:bg-dark-burgundy transition-colors"
              >
                Add to Collection
              </button>
              <Link to="/product/soverane" className="px-6 py-3 border border-champagne text-champagne text-xs tracking-[0.2em] uppercase hover:bg-champagne hover:text-dark-text transition-all">
                Discover More
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={soverane.image}
                alt="SOVÉRANE by SOHO"
                className="w-72 h-96 object-cover rounded-sm"
                style={{ filter: "sepia(20%) saturate(0.9)" }}
              />
              <div className="absolute -bottom-6 -right-6 p-4 bg-burgundy text-cream">
                <div className="text-[9px] tracking-[0.3em] uppercase text-champagne mb-1">Longevity</div>
                <div className="font-display text-lg">{soverane.longevity}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pakistan payment section */}
      <section className="bg-cream py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs tracking-[0.3em] text-muted-text uppercase mb-4">Serving Pakistan</p>
          <h3 className="font-display text-2xl text-dark-text mb-8">Trusted Payment Methods</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {["JazzCash", "Easypaisa", "NayaPay", "SadaPay", "Bank Transfer", "Cash on Delivery"].map((pm) => (
              <div key={pm} className="px-4 py-2 border border-warm-taupe/40 rounded-sm text-sm text-muted-text hover:border-champagne hover:text-dark-text transition-all">
                {pm}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-text/60 mt-6">Nationwide delivery · Free shipping on orders above ₨5,000</p>
        </div>
      </section>

      {/* CTA */}
      <section className="hero-gradient py-24 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="font-display text-4xl lg:text-5xl text-cream font-light mb-4">
            Crafted to Be Remembered.
          </h2>
          <p className="text-cream/50 mb-8 text-sm tracking-wide">
            Explore all twelve expressions of SOHO Fragrance.
          </p>
          <Link to="/collection" className="inline-block px-10 py-4 bg-champagne text-dark-text text-xs tracking-[0.3em] uppercase font-semibold hover:bg-cream transition-colors">
            Shop the Collection
          </Link>
        </div>
      </section>
    </>
  );
}
