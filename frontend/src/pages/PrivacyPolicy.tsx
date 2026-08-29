import { Link } from "react-router";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-ivory pt-16">
      <section className="hero-gradient py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.4em] text-champagne/60 uppercase mb-4">Legal</p>
          <h1 className="font-display text-4xl lg:text-6xl text-cream font-light leading-tight">
            Privacy Policy
          </h1>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="section-divider mb-12" />
        <div className="space-y-8 text-muted-text leading-relaxed">
          <p className="text-dark-text font-medium text-lg">
            At SOHO Fragrance, we value your privacy and are committed to protecting your personal data.
          </p>

          <div>
            <h2 className="font-display text-2xl text-dark-text mb-3">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when placing an order, subscribing to our newsletter, or contacting customer service. This may include your name, shipping address, billing address, email address, phone number, and payment information.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-dark-text mb-3">2. How We Use Your Information</h2>
            <p>
              We use the collected information to process and fulfill your orders, communicate with you regarding your transactions, send you marketing messages (if you opt-in), improve our store experience, and comply with legal obligations.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-dark-text mb-3">3. Data Security</h2>
            <p>
              We implement industry-standard security measures to safeguard your personal information against unauthorized access, alteration, disclosure, or destruction. However, no transmission method over the internet is completely secure.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-dark-text mb-3">4. Third-Party Services</h2>
            <p>
              We do not sell, trade, or transfer your personal data to outside parties, except trusted third parties who assist us in operating our website, conducting business, or servicing you (e.g. shipping partners and payment gateways).
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-dark-text mb-3">5. Cookies</h2>
            <p>
              We use cookies to analyze web traffic, remember items in your shopping cart, and personalize your experience. You can disable cookies in your browser settings, though this may limit website functionality.
            </p>
          </div>
        </div>
        <div className="section-divider mt-12" />
      </section>

      <section className="bg-espresso py-16 px-6 text-center">
        <p className="font-display text-2xl text-cream font-light mb-6">
          "SCENT BECOMES MEMORY."
        </p>
        <Link to="/collection" className="inline-block px-8 py-3 bg-champagne text-dark-text text-xs tracking-[0.3em] uppercase font-semibold hover:bg-cream transition-colors">
          Explore Fragrances
        </Link>
      </section>
    </div>
  );
}
