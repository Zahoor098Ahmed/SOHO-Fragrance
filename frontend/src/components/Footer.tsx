import { Link } from "react-router";

export default function Footer() {
  return (
    <footer className="bg-espresso text-cream/70">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="font-display mb-4">
              <div className="text-2xl tracking-[0.15em] text-cream font-semibold leading-none">SOHO</div>
              <div className="text-[9px] tracking-[0.4em] text-champagne font-light mt-0.5">FRAGRANCE</div>
            </div>
            <p className="text-sm leading-relaxed text-cream/50 mt-4">
              Crafted in Pakistan. Designed for the world. Luxury Eau de Parfum.
            </p>
            <p className="text-xs tracking-[0.15em] text-champagne mt-4 italic font-display">
              "SCENT BECOMES MEMORY."
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-champagne mb-5 font-medium">Discover</h4>
            <ul className="space-y-3 text-sm">
              {[
                ["The Collection", "/collection"],
                ["Men's Fragrances", "/men"],
                ["Women's Fragrances", "/women"],
                ["Unisex", "/unisex"],
                ["Best Sellers", "/best-sellers"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link to={href} className="hover:text-champagne transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-champagne mb-5 font-medium">SOHO</h4>
            <ul className="space-y-3 text-sm">
              {[
                ["About Us", "/about"],
                ["Contact", "/contact"],
                ["Track Order", "/track-order"],
                ["Privacy Policy", "/privacy-policy"],
                ["Terms & Conditions", "/terms"],
                ["Shipping Policy", "/shipping-policy"],
                ["Return Policy", "/return-policy"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link to={href} className="hover:text-champagne transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-champagne mb-5 font-medium">Contact</h4>
            <address className="not-italic space-y-3 text-sm text-cream/60">
              <p>Karachi, Pakistan</p>
              <p>info@sohofragrance.pk</p>
              <p>+92 300 000 0000</p>
            </address>
            <div className="flex gap-4 mt-6">
              {["Instagram", "Facebook", "TikTok"].map((social) => (
                <button key={social} aria-label={social} className="text-xs tracking-wider hover:text-champagne transition-colors">
                  {social.slice(0, 2).toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="gold-line mb-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-cream/40">
          <p>© 2026 SOHO Fragrance. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>We accept:</span>
            {["JazzCash", "Easypaisa", "NayaPay", "SadaPay", "COD"].map((pm) => (
              <span key={pm} className="px-2 py-0.5 border border-cream/20 rounded text-[10px]">{pm}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
