import { Link } from "react-router";

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-ivory pt-16">
      <section className="hero-gradient py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.4em] text-champagne/60 uppercase mb-4">Legal</p>
          <h1 className="font-display text-4xl lg:text-6xl text-cream font-light leading-tight">
            Terms & Conditions
          </h1>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="section-divider mb-12" />
        <div className="space-y-8 text-muted-text leading-relaxed">
          <p className="text-dark-text font-medium text-lg">
            Welcome to SOHO Fragrance. By accessing or using our website, you agree to comply with and be bound by the following terms.
          </p>

          <div>
            <h2 className="font-display text-2xl text-dark-text mb-3">1. Use of the Website</h2>
            <p>
              You agree to use this website only for lawful purposes and in a way that does not infringe on the rights of others or restrict their use and enjoyment of this website. Unauthorized use or copying of our brand assets is strictly prohibited.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-dark-text mb-3">2. Pricing and Availability</h2>
            <p>
              All prices shown on the website are in Pakistani Rupees (PKR) and are inclusive of local taxes where applicable. We reserve the right to modify prices, update product descriptions, or withdraw items from sale at any time without prior notice.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-dark-text mb-3">3. Orders and Payment</h2>
            <p>
              Placing an order constitutes an offer to purchase. We accept Cash on Delivery (COD) and electronic payment methods (JazzCash, Easypaisa, NayaPay, SadaPay). We reserve the right to cancel or refuse any order for reasons including stock limitations or suspicion of fraudulent activity.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-dark-text mb-3">4. Intellectual Property</h2>
            <p>
              All design, text, graphics, logos, images, and brand assets are intellectual property owned by or licensed to SOHO Fragrance. You are not permitted to reproduce, distribute, or modify any content without explicit written consent.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-dark-text mb-3">5. Governing Law</h2>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the laws of Pakistan. Any disputes arising out of the use of this website shall be subject to the exclusive jurisdiction of the courts of Pakistan.
            </p>
          </div>
        </div>
        <div className="section-divider mt-12" />
      </section>

      <section className="bg-espresso py-16 px-6 text-center">
        <p className="font-display text-2xl text-cream font-light mb-6">
          "CRAFTED TO BE REMEMBERED."
        </p>
        <Link to="/collection" className="inline-block px-8 py-3 bg-champagne text-dark-text text-xs tracking-[0.3em] uppercase font-semibold hover:bg-cream transition-colors">
          Explore Fragrances
        </Link>
      </section>
    </div>
  );
}
