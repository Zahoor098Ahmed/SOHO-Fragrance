import { Link } from "react-router";

export default function ReturnPolicy() {
  return (
    <div className="min-h-screen bg-ivory pt-16">
      <section className="hero-gradient py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.4em] text-champagne/60 uppercase mb-4">Customer Care</p>
          <h1 className="font-display text-4xl lg:text-6xl text-cream font-light leading-tight">
            Return & Exchange Policy
          </h1>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="section-divider mb-12" />
        <div className="space-y-8 text-muted-text leading-relaxed">
          <p className="text-dark-text font-medium text-lg">
            We are dedicated to providing a premium luxury experience. If you are not satisfied with your purchase, we are here to assist.
          </p>

          <div>
            <h2 className="font-display text-2xl text-dark-text mb-3">1. Return Window</h2>
            <p>
              We accept requests for returns and exchanges within 7 days of delivery. To be eligible, products must remain completely unused, in their original packaging, with all plastic wraps and security seals intact.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-dark-text mb-3">2. Non-Returnable Items</h2>
            <p>
              Due to hygiene and product integrity standards, we cannot accept returns on bottles that have been opened, sprayed, or had their protective cellophane wrap removed.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-dark-text mb-3">3. Damaged or Faulty Items</h2>
            <p>
              If your order arrives damaged or defective, please contact our support team immediately (within 24 hours of delivery) with photographic proof. We will arrange a complimentary replacement.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-dark-text mb-3">4. Return Process</h2>
            <p>
              To initiate a return or exchange, please email us at <strong>returns@sohofragrance.pk</strong> or contact us via WhatsApp at <strong>+92 300 000 0000</strong>. Once your return is authorized, you will need to ship the item back to our Karachi warehouse.
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
