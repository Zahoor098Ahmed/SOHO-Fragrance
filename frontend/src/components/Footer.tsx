import { useState } from "react";
import { Link } from "react-router";

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      setNewsletterStatus({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    setSubscribing(true);
    setNewsletterStatus(null);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiBase}/subscribers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail.trim(), source: "Footer Newsletter" }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewsletterStatus({ type: "success", message: data.message || "Welcome to the Maison SOHO circle." });
        setNewsletterEmail("");
      } else {
        setNewsletterStatus({ type: "error", message: data.error || "Failed to subscribe. Please try again." });
      }
    } catch (err) {
      setNewsletterStatus({ type: "error", message: "Network error. Please try again later." });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="bg-espresso text-cream/70">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        {/* Newsletter Subscription Banner */}
        <div className="border-b border-cream/10 pb-12 mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-md">
              <span className="text-[10px] tracking-[0.3em] uppercase text-champagne font-semibold block mb-1">
                Private Circle
              </span>
              <h3 className="font-display text-xl sm:text-2xl text-cream font-light">
                Receive Privileged Access & 10% Off
              </h3>
              <p className="text-xs text-cream/50 mt-1">
                Subscribe to receive private invitations, seasonal releases, and private member offers.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex-1 max-w-md">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-3 bg-cream/5 border border-cream/15 text-cream placeholder-cream/30 text-xs rounded-sm focus:outline-none focus:border-champagne transition-colors"
                  disabled={subscribing}
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="px-6 py-3 bg-champagne hover:bg-champagne/90 text-espresso font-semibold text-xs tracking-[0.15em] uppercase rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {subscribing ? "Joining..." : "Join Circle"}
                </button>
              </div>
              {newsletterStatus && (
                <p className={`text-xs mt-2.5 font-medium ${newsletterStatus.type === "success" ? "text-champagne" : "text-red-400"}`}>
                  {newsletterStatus.message}
                </p>
              )}
            </form>
          </div>
        </div>

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
