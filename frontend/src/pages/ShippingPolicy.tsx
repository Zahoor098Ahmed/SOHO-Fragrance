import { Link } from "react-router";

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-ivory pt-16">
      <section className="hero-gradient py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.4em] text-champagne/60 uppercase mb-4">Customer Care</p>
          <h1 className="font-display text-4xl lg:text-6xl text-cream font-light leading-tight">
            Shipping Policy
          </h1>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="section-divider mb-12" />
        <div className="space-y-8 text-muted-text leading-relaxed">
          <p className="text-dark-text font-medium text-lg">
            SOHO Fragrance provides premium delivery across all major cities and towns in Pakistan.
          </p>

          <div>
            <h2 className="font-display text-2xl text-dark-text mb-3">1. Delivery Timeline</h2>
            <p>
              Orders are typically processed within 24 to 48 hours. Shipping within Karachi takes 1-2 business days. Shipping to other cities (including Lahore, Islamabad, Rawalpindi, Faisalabad, and Peshawar) takes 3-5 business days.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-dark-text mb-3">2. Shipping Charges</h2>
            <p>
              We offer flat-rate shipping of PKR 250 on all orders below PKR 5,000. We are pleased to provide complimentary standard delivery for all orders of PKR 5,000 and above.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-dark-text mb-3">3. Order Tracking</h2>
            <p>
              Once your shipment has been dispatched, you will receive a confirmation email and SMS containing your package tracking details. You can also view your shipment status on our dedicated Track Order page.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-dark-text mb-3">4. Delivery Instructions</h2>
            <p>
              Please make sure to provide accurate shipping addresses and a functional phone number to avoid delays. Our delivery partners will attempt to contact you before delivery. After three failed attempts, the package will be returned to our warehouse.
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
